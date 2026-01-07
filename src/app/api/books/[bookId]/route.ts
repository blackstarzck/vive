import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";
import { Book, Highlight, Topic } from "@/types/database";

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().optional(),
  isbn: z.string().optional(),
  coverImage: z.string().url().optional(),
});

type RouteParams = { params: Promise<{ bookId: string }> };

// GET /api/books/[bookId] - Get a single book
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookId } = await params;

    // Get book
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Get highlights with their topics
    const { data: highlights } = await supabase
      .from("highlights")
      .select("*")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false });

    const highlightList = highlights as Highlight[] | null;
    const highlightIds = highlightList?.map((h) => h.id) || [];

    // Get highlight topics
    const { data: highlightTopics } = await supabase
      .from("highlight_topics")
      .select(`
        highlight_id,
        confidence,
        topic_id
      `)
      .in("highlight_id", highlightIds.length > 0 ? highlightIds : ["none"]);

    // Get all topic ids
    const topicIds = [...new Set((highlightTopics as Array<{ topic_id: string }> | null)?.map((ht) => ht.topic_id) || [])];

    // Get topics
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

    // Transform highlights to include topics
    const highlightsWithTopics = highlightList?.map((h) => ({
      ...h,
      topics: topicsByHighlight.get(h.id) || [],
    }));

    return NextResponse.json({
      data: {
        ...(book as Book),
        highlights: highlightsWithTopics,
        _count: {
          highlights: highlightList?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/books/[bookId] - Update a book
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookId } = await params;
    const body = await request.json();
    const validatedData = updateBookSchema.parse(body);

    // Check ownership
    const { data: existingBook } = await supabase
      .from("books")
      .select("id")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .single();

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.author !== undefined) updateData.author = validatedData.author;
    if (validatedData.isbn !== undefined) updateData.isbn = validatedData.isbn;
    if (validatedData.coverImage !== undefined) updateData.cover_image = validatedData.coverImage;

    const { data: book, error } = await supabase
      .from("books")
      .update(updateData)
      .eq("id", bookId)
      .select()
      .single();

    if (error) throw error;

    // Get highlight count
    const { count } = await supabase
      .from("highlights")
      .select("*", { count: "exact", head: true })
      .eq("book_id", bookId);

    return NextResponse.json({ 
      data: {
        ...(book as Book),
        _count: { highlights: count || 0 },
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError<unknown>;
      return NextResponse.json(
        { error: zodError.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    console.error("Error updating book:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/books/[bookId] - Delete a book
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookId } = await params;

    // Check ownership
    const { data: existingBook } = await supabase
      .from("books")
      .select("id")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .single();

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("books")
      .delete()
      .eq("id", bookId);

    if (error) throw error;

    return NextResponse.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
