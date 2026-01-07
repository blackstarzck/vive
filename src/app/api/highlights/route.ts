import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";
import { Book, Highlight, Topic } from "@/types/database";

const createHighlightSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  content: z.string().min(1, "Content is required"),
  note: z.string().optional(),
  pageNumber: z.number().int().positive().optional(),
  chapter: z.string().optional(),
  color: z.string().optional(),
});

// GET /api/highlights - Get all highlights for current user
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20");
    const search = searchParams.get("search");

    // Build query
    let query = supabase
      .from("highlights")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (bookId) {
      query = query.eq("book_id", bookId);
    }

    if (search) {
      query = query.or(`content.ilike.%${search}%,note.ilike.%${search}%`);
    }

    const { data: highlights, count, error } = await query;

    if (error) throw error;

    const highlightList = highlights as Highlight[] | null;

    // Get books for these highlights
    const bookIds = [...new Set(highlightList?.map((h) => h.book_id) || [])];
    const { data: books } = await supabase
      .from("books")
      .select("id, title, author, cover_image")
      .in("id", bookIds.length > 0 ? bookIds : ["none"]);

    const bookMap = new Map<string, Pick<Book, "id" | "title" | "author" | "cover_image">>();
    (books as Array<Pick<Book, "id" | "title" | "author" | "cover_image">> | null)?.forEach((b) => bookMap.set(b.id, b));

    // Get topics for highlights
    const highlightIds = highlightList?.map((h) => h.id) || [];
    const { data: highlightTopics } = await supabase
      .from("highlight_topics")
      .select("highlight_id, topic_id, confidence")
      .in("highlight_id", highlightIds.length > 0 ? highlightIds : ["none"]);

    const topicIds = [...new Set((highlightTopics as Array<{ topic_id: string }> | null)?.map((ht) => ht.topic_id) || [])];
    const { data: topics } = await supabase
      .from("topics")
      .select("*")
      .in("id", topicIds.length > 0 ? topicIds : ["none"]);

    const topicMap = new Map<string, Topic>();
    (topics as Topic[] | null)?.forEach((t) => topicMap.set(t.id, t));

    // Group topics by highlight
    const topicsByHighlight = new Map<string, Array<Topic & { confidence?: number | null }>>();
    (highlightTopics as Array<{ highlight_id: string; topic_id: string; confidence: number | null }> | null)?.forEach((ht) => {
      const topic = topicMap.get(ht.topic_id);
      if (topic) {
        const existing = topicsByHighlight.get(ht.highlight_id) || [];
        existing.push({ ...topic, confidence: ht.confidence });
        topicsByHighlight.set(ht.highlight_id, existing);
      }
    });

    // Transform highlights
    const highlightsWithRelations = highlightList?.map((h) => ({
      ...h,
      book: bookMap.get(h.book_id),
      topics: topicsByHighlight.get(h.id) || [],
    }));

    const total = count || 0;

    return NextResponse.json({
      data: highlightsWithRelations,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching highlights:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/highlights - Create a new highlight
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createHighlightSchema.parse(body);

    // Verify book ownership
    const { data: book } = await supabase
      .from("books")
      .select("id, title, author")
      .eq("id", validatedData.bookId)
      .eq("user_id", user.id)
      .single();

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const { data: highlight, error } = await supabase
      .from("highlights")
      .insert({
        user_id: user.id,
        book_id: validatedData.bookId,
        content: validatedData.content,
        note: validatedData.note ?? null,
        page_number: validatedData.pageNumber ?? null,
        chapter: validatedData.chapter ?? null,
        color: validatedData.color ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: {
        ...(highlight as Highlight),
        book: book as Pick<Book, "id" | "title" | "author">,
        topics: [],
      }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError<unknown>;
      return NextResponse.json(
        { error: zodError.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    console.error("Error creating highlight:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
