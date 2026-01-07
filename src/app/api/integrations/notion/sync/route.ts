import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  createHighlightPage,
  updateHighlightPage,
  findPageByViveId,
  ensureDatabaseSchema,
} from "@/lib/notion";
import type { Highlight, Book } from "@/types/database";

// POST: 하이라이트를 Notion으로 동기화
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
    const { highlight_ids, sync_all } = body;

    // Notion 연동 정보 조회
    const { data: integration, error: integrationError } = await supabase
      .from("notion_integrations")
      .select("id, access_token, database_id, sync_enabled")
      .eq("user_id", user.id)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: "Notion 연동이 설정되지 않았습니다." },
        { status: 400 }
      );
    }

    if (!integration.sync_enabled) {
      return NextResponse.json(
        { error: "Notion 동기화가 비활성화되어 있습니다." },
        { status: 400 }
      );
    }

    if (!integration.database_id) {
      return NextResponse.json(
        { error: "Notion 데이터베이스가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // 동기화 로그 생성
    const { data: syncLog, error: logError } = await supabase
      .from("notion_sync_logs")
      .insert({
        user_id: user.id,
        integration_id: integration.id,
        sync_type: sync_all ? "manual" : "manual",
        status: "in_progress",
      })
      .select("id")
      .single();

    if (logError) {
      console.error("Failed to create sync log:", logError);
    }

    // 동기화할 하이라이트 조회
    let highlightsQuery = supabase
      .from("highlights")
      .select(`
        id, content, note, page_number, chapter, summary, created_at,
        books!inner(id, title, author, source)
      `)
      .eq("user_id", user.id);

    if (!sync_all && highlight_ids?.length > 0) {
      highlightsQuery = highlightsQuery.in("id", highlight_ids);
    }

    const { data: highlights, error: highlightsError } = await highlightsQuery;

    if (highlightsError) {
      console.error("Failed to fetch highlights:", highlightsError);
      return NextResponse.json(
        { error: "하이라이트를 조회하는데 실패했습니다." },
        { status: 500 }
      );
    }

    if (!highlights || highlights.length === 0) {
      return NextResponse.json({ synced: 0, message: "동기화할 하이라이트가 없습니다." });
    }

    // 데이터베이스 스키마 확인 및 업데이트 (필요한 속성 추가)
    try {
      await ensureDatabaseSchema(integration.access_token, integration.database_id);
    } catch (error) {
      console.error("Schema check failed (continuing anyway):", error);
    }

    // 기존 동기화 매핑 조회
    const { data: existingMappings } = await supabase
      .from("highlight_notion_pages")
      .select("highlight_id, notion_page_id")
      .eq("user_id", user.id);

    const mappingMap = new Map(
      existingMappings?.map((m) => [m.highlight_id, m.notion_page_id]) || []
    );

    let syncedCount = 0;
    const errors: Array<{ highlight_id: string; error: string }> = [];

    for (const item of highlights) {
      try {
        const highlight = item as Highlight & {
          books: Pick<Book, "id" | "title" | "author" | "source">;
        };

        const book = highlight.books;
        const existingPageId = mappingMap.get(highlight.id);

        if (existingPageId) {
          // 기존 페이지 업데이트
          await updateHighlightPage(
            integration.access_token,
            existingPageId,
            highlight,
            book
          );

          // 매핑 업데이트
          await supabase
            .from("highlight_notion_pages")
            .update({ last_synced_at: new Date().toISOString() })
            .eq("highlight_id", highlight.id);
        } else {
          // ViveId로 중복 확인
          console.log(`Checking for existing page for highlight ${highlight.id} in DB ${integration.database_id}`);
          const foundPageId = await findPageByViveId(
            integration.access_token,
            integration.database_id,
            highlight.id
          );
          console.log(`Found page: ${foundPageId}`);

          if (foundPageId) {
            // 이미 존재하면 업데이트
            await updateHighlightPage(
              integration.access_token,
              foundPageId,
              highlight,
              book
            );

            // 매핑 생성
            await supabase.from("highlight_notion_pages").insert({
              highlight_id: highlight.id,
              user_id: user.id,
              notion_page_id: foundPageId,
            });
          } else {
            // 새 페이지 생성
            const result = await createHighlightPage(
              integration.access_token,
              integration.database_id,
              highlight,
              book
            );

            // 매핑 생성
            await supabase.from("highlight_notion_pages").insert({
              highlight_id: highlight.id,
              user_id: user.id,
              notion_page_id: result.pageId,
              notion_page_url: result.url,
            });
          }
        }

        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync highlight ${item.id}:`, error);
        errors.push({
          highlight_id: item.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // 동기화 로그 업데이트
    if (syncLog) {
      await supabase
        .from("notion_sync_logs")
        .update({
          status: errors.length > 0 ? "completed" : "completed",
          highlights_synced: syncedCount,
          errors: errors.length > 0 ? { items: errors } : null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", syncLog.id);
    }

    // 연동 정보의 last_synced_at 업데이트
    await supabase
      .from("notion_integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", integration.id);

    return NextResponse.json({
      synced: syncedCount,
      total: highlights.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("POST /api/integrations/notion/sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: 동기화 로그 조회
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: logs, error } = await supabase
      .from("notion_sync_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Failed to fetch sync logs:", error);
      return NextResponse.json(
        { error: "동기화 기록을 조회하는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error("GET /api/integrations/notion/sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
