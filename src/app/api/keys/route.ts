import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  generateApiKey,
  getKeyPrefix,
  hashApiKey,
} from "@/lib/api-key";
import { z } from "zod";
import { ApiKey, ApiKeyScope } from "@/types/database";

const createKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  scopes: z
    .array(z.enum(["read", "write", "delete"]))
    .default(["read"]),
  expiresInDays: z.number().int().positive().optional(),
});

// GET /api/keys - List user's API keys
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: keys, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, scopes, last_used_at, expires_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: keys });
  } catch (error) {
    console.error("Failed to list API keys:", error);
    return NextResponse.json(
      { error: "Failed to list API keys" },
      { status: 500 }
    );
  }
}

// POST /api/keys - Create a new API key
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createKeySchema.parse(body);

    // Generate the API key
    const rawKey = generateApiKey();
    const keyHash = await hashApiKey(rawKey);
    const keyPrefix = getKeyPrefix(rawKey);

    // Calculate expiration
    let expiresAt: string | null = null;
    if (validatedData.expiresInDays) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + validatedData.expiresInDays);
      expiresAt = expDate.toISOString();
    }

    // Store in database
    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        user_id: user.id,
        name: validatedData.name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes: validatedData.scopes as ApiKeyScope[],
        expires_at: expiresAt,
      })
      .select("id, name, key_prefix, scopes, expires_at, created_at")
      .single();

    if (error) throw error;

    const keyData = data as Pick<ApiKey, "id" | "name" | "key_prefix" | "scopes" | "expires_at" | "created_at">;

    // Return the raw key ONLY ONCE - it cannot be retrieved again
    return NextResponse.json(
      {
        message: "API key created successfully. Save this key - it won't be shown again!",
        key: rawKey,
        data: keyData,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }
    console.error("Failed to create API key:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}

// DELETE /api/keys - Delete an API key (with id in body)
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ message: "API key deleted successfully" });
  } catch (error) {
    console.error("Failed to delete API key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
