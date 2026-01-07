import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  validateNotionToken,
  listNotionDatabases,
  listNotionPages,
  createViveDatabase,
} from "@/lib/notion";
import type { NotionIntegration } from "@/types/database";

// GET: 현재 사용자의 Notion 연동 정보 조회
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: integration, error } = await supabase
      .from("notion_integrations")
      .select("id, database_id, database_name, sync_enabled, auto_sync, last_synced_at, created_at, updated_at")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found
      console.error("Error fetching integration:", error);
      return NextResponse.json({ error: "Failed to fetch integration" }, { status: 500 });
    }

    return NextResponse.json({ data: integration || null });
  } catch (error) {
    console.error("GET /api/integrations/notion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Notion 연동 생성 또는 업데이트
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { access_token, database_id, action } = body;

    // 액션별 처리
    if (action === "validate") {
      // 토큰 유효성 검증
      if (!access_token) {
        return NextResponse.json({ error: "access_token is required" }, { status: 400 });
      }

      const validation = await validateNotionToken(access_token);
      return NextResponse.json(validation);
    }

    if (action === "list_databases") {
      // 데이터베이스 목록 조회
      const { data: integration } = await supabase
        .from("notion_integrations")
        .select("access_token")
        .eq("user_id", user.id)
        .single();

      if (!integration) {
        return NextResponse.json({ error: "No integration found" }, { status: 404 });
      }

      const databases = await listNotionDatabases(integration.access_token);
      return NextResponse.json({ data: databases });
    }

    if (action === "list_pages") {
      // 페이지 목록 조회 (데이터베이스 생성용)
      const { data: integration } = await supabase
        .from("notion_integrations")
        .select("access_token")
        .eq("user_id", user.id)
        .single();

      if (!integration) {
        return NextResponse.json({ error: "No integration found" }, { status: 404 });
      }

      const pages = await listNotionPages(integration.access_token);
      return NextResponse.json({ data: pages });
    }

    if (action === "create_database") {
      // VIVE 전용 데이터베이스 생성
      const { parent_page_id } = body;
      if (!parent_page_id) {
        return NextResponse.json({ error: "parent_page_id is required" }, { status: 400 });
      }

      const { data: integration } = await supabase
        .from("notion_integrations")
        .select("id, access_token")
        .eq("user_id", user.id)
        .single();

      if (!integration) {
        return NextResponse.json({ error: "No integration found" }, { status: 404 });
      }

      const database = await createViveDatabase(integration.access_token, parent_page_id);

      // 연동 정보 업데이트
      await supabase
        .from("notion_integrations")
        .update({
          database_id: database.id,
          database_name: database.title,
        })
        .eq("id", integration.id);

      return NextResponse.json({ data: database });
    }

    if (action === "set_database") {
      // 기존 데이터베이스 선택
      if (!database_id) {
        return NextResponse.json({ error: "database_id is required" }, { status: 400 });
      }

      const { database_name } = body;

      const { data: integration } = await supabase
        .from("notion_integrations")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!integration) {
        return NextResponse.json({ error: "No integration found" }, { status: 404 });
      }

      await supabase
        .from("notion_integrations")
        .update({
          database_id,
          database_name: database_name || "Selected Database",
        })
        .eq("id", integration.id);

      return NextResponse.json({ success: true });
    }

    // 기본: 새 연동 생성
    if (!access_token) {
      return NextResponse.json({ error: "access_token is required" }, { status: 400 });
    }

    // 토큰 유효성 검증
    const validation = await validateNotionToken(access_token);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || "Invalid token" }, { status: 400 });
    }

    // 기존 연동 확인
    const { data: existing } = await supabase
      .from("notion_integrations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from("notion_integrations")
        .update({
          access_token,
          database_id: null,
          database_name: null,
        })
        .eq("id", existing.id);

      if (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: "Failed to update integration" }, { status: 500 });
      }
    } else {
      // 새로 생성
      const { error } = await supabase.from("notion_integrations").insert({
        user_id: user.id,
        access_token,
      });

      if (error) {
        console.error("Insert error:", error);
        return NextResponse.json({ error: "Failed to create integration" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, user: validation.user });
  } catch (error) {
    console.error("POST /api/integrations/notion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: 연동 설정 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sync_enabled, auto_sync } = body;

    const updateData: Partial<NotionIntegration> = {};
    if (typeof sync_enabled === "boolean") updateData.sync_enabled = sync_enabled;
    if (typeof auto_sync === "boolean") updateData.auto_sync = auto_sync;

    const { error } = await supabase
      .from("notion_integrations")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/integrations/notion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Notion 연동 삭제
export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("notion_integrations")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: "Failed to delete integration" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/integrations/notion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
