import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";
import { verifyApiKey, apiKeyError } from "@/lib/api-key";
import { Highlight, Book, Topic } from "@/types/database";

interface HighlightWithRelations extends Highlight {
  book?: Pick<Book, "id" | "title" | "author">;
  topics?: Pick<Topic, "id" | "name" | "color">[];
}

// GET /api/v1/highlights - List highlights for API key owner
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
    const bookId = searchParams.get("book_id");
    const topicId = searchParams.get("topic_id");
    const search = searchParams.get("search");
    const includeBook = searchParams.get("include_book") !== "false";
    const includeTopics = searchParams.get("include_topics") !== "false";

    // Build base query
    let query = supabase
      .from("highlights")
      .select("*", { count: "exact" })
      .eq("user_id", authResult.userId!)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (bookId) {
      query = query.eq("book_id", bookId);
    }

    if (search) {
      query = query.or(`content.ilike.%${search}%,note.ilike.%${search}%`);
    }

    const { data: highlights, error, count } = await query;

    if (error) throw error;

    let result: HighlightWithRelations[] = (highlights || []) as Highlight[];

    // Fetch related books if requested
    if (includeBook && result.length > 0) {
      const bookIds = [...new Set(result.map((h) => h.book_id))];
      const { data: books } = await supabase
        .from("books")
        .select("id, title, author")
        .in("id", bookIds);

      const bookMap = new Map((books || []).map((b) => [b.id, b]));
      result = result.map((h) => ({
        ...h,
        book: bookMap.get(h.book_id) as Pick<Book, "id" | "title" | "author"> | undefined,
      }));
    }

    // Fetch related topics if requested
    if (includeTopics && result.length > 0) {
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
        topics: topicMap.get(h.id) || [],
      }));
    }

    // Filter by topic if specified (after fetching topics)
    if (topicId && includeTopics) {
      result = result.filter((h) =>
        h.topics?.some((t) => t.id === topicId)
      );
    }

    return NextResponse.json({
      data: result,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("API v1 highlights error:", error);
    return NextResponse.json(
      { error: "Failed to fetch highlights" },
      { status: 500 }
    );
  }
}
