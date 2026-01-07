import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";
import { verifyApiKey, apiKeyError } from "@/lib/api-key";
import { Highlight, Book, Topic } from "@/types/database";

interface SearchResult {
  highlights: Array<
    Highlight & {
      book?: Pick<Book, "id" | "title" | "author">;
      topics?: Pick<Topic, "id" | "name" | "color">[];
    }
  >;
  total: number;
}

// GET /api/v1/search - Search highlights for API key owner
export async function GET(request: NextRequest) {
  // Verify API key
  const authResult = await verifyApiKey(request, "read");
  if (!authResult.valid) {
    return apiKeyError(authResult.error || "Unauthorized");
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");
    if (!query) {
      return NextResponse.json(
        { error: "Search query 'q' is required" },
        { status: 400 }
      );
    }

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Search highlights
    const { data: highlights, error, count } = await supabase
      .from("highlights")
      .select("*", { count: "exact" })
      .eq("user_id", authResult.userId!)
      .or(`content.ilike.%${query}%,note.ilike.%${query}%,summary.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    let result = (highlights || []) as Array<
      Highlight & {
        book?: Pick<Book, "id" | "title" | "author">;
        topics?: Pick<Topic, "id" | "name" | "color">[];
      }
    >;

    // Fetch related books
    if (result.length > 0) {
      const bookIds = [...new Set(result.map((h) => h.book_id))];
      const { data: books } = await supabase
        .from("books")
        .select("id, title, author")
        .in("id", bookIds);

      const bookMap = new Map((books || []).map((b) => [b.id, b]));

      // Fetch related topics
      const highlightIds = result.map((h) => h.id);
      const { data: highlightTopics } = await supabase
        .from("highlight_topics")
        .select("highlight_id, topic_id, topics(id, name, color)")
        .in("highlight_id", highlightIds);

      const topicMap = new Map<string, Pick<Topic, "id" | "name" | "color">[]>();
      (highlightTopics || []).forEach((ht) => {
        const topic = ht.topics as unknown as Pick<Topic, "id" | "name" | "color">;
        if (!topicMap.has(ht.highlight_id)) {
          topicMap.set(ht.highlight_id, []);
        }
        topicMap.get(ht.highlight_id)!.push(topic);
      });

      result = result.map((h) => ({
        ...h,
        book: bookMap.get(h.book_id) as Pick<Book, "id" | "title" | "author"> | undefined,
        topics: topicMap.get(h.id) || [],
      }));
    }

    return NextResponse.json({
      query,
      data: result,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("API v1 search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
