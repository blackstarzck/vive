import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";
import { verifyApiKey, apiKeyError } from "@/lib/api-key";
import { Book, BookSource } from "@/types/database";

// GET /api/v1/books - List books for API key owner
export async function GET(request: NextRequest) {
  // Verify API key
  const authResult = await verifyApiKey(request, "read");
  if (!authResult.valid) {
    return apiKeyError(authResult.error || "Unauthorized");
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Filters
    const search = searchParams.get("search");
    const source = searchParams.get("source") as BookSource | null;

    // Build query
    let query = supabase
      .from("books")
      .select("*", { count: "exact" })
      .eq("user_id", authResult.userId!)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
    }

    if (source) {
      query = query.eq("source", source);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const books = (data || []) as Book[];

    return NextResponse.json({
      data: books,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("API v1 books error:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}
