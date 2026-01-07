import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";
import { Book, Highlight, Topic } from "@/types/database";

const updateHighlightSchema = z.object({
  content: z.string().min(1).optional(),
  note: z.string().optional(),
  pageNumber: z.number().int().positive().optional(),
  chapter: z.string().optional(),
  color: z.string().optional(),
});

type RouteParams = { params: Promise<{ highlightId: string }> };

// GET /api/highlights/[highlightId] - Get a single highlight
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { highlightId } = await params;

    // Get highlight
    const { data: highlight, error } = await supabase
      .from("highlights")
      .select("*")
      .eq("id", highlightId)
      .eq("user_id", user.id)
      .single();

    if (error || !highlight) {
      return NextResponse.json({ error: "Highlight not found" }, { status: 404 });
    }

    // Get book
    const { data: book } = await supabase
      .from("books")
      .select("*")
      .eq("id", (highlight as Highlight).book_id)
      .single();

    // Get topics
    const { data: highlightTopics } = await supabase
      .from("highlight_topics")
      .select("topic_id, confidence")
      .eq("highlight_id", highlightId);

    const topicIds = (highlightTopics as Array<{ topic_id: string }> | null)?.map((ht) => ht.topic_id) || [];
    const { data: topics } = await supabase
      .from("topics")
      .select("*")
      .in("id", topicIds.length > 0 ? topicIds : ["none"]);

    const topicMap = new Map<string, Topic>();
    (topics as Topic[] | null)?.forEach((t) => topicMap.set(t.id, t));

    const topicsWithConfidence = (highlightTopics as Array<{ topic_id: string; confidence: number | null }> | null)?.map((ht) => ({
      ...topicMap.get(ht.topic_id)!,
      confidence: ht.confidence,
    })).filter(Boolean) || [];

    return NextResponse.json({
      data: {
        ...(highlight as Highlight),
        book: book as Book,
        topics: topicsWithConfidence,
      },
    });
  } catch (error) {
    console.error("Error fetching highlight:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/highlights/[highlightId] - Update a highlight
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { highlightId } = await params;
    const body = await request.json();
    const validatedData = updateHighlightSchema.parse(body);

    // Check ownership
    const { data: existingHighlight } = await supabase
      .from("highlights")
      .select("id, book_id")
      .eq("id", highlightId)
      .eq("user_id", user.id)
      .single();

    if (!existingHighlight) {
      return NextResponse.json({ error: "Highlight not found" }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (validatedData.content) updateData.content = validatedData.content;
    if (validatedData.note !== undefined) updateData.note = validatedData.note;
    if (validatedData.pageNumber !== undefined) updateData.page_number = validatedData.pageNumber;
    if (validatedData.chapter !== undefined) updateData.chapter = validatedData.chapter;
    if (validatedData.color !== undefined) updateData.color = validatedData.color;

    const { data: highlight, error } = await supabase
      .from("highlights")
      .update(updateData)
      .eq("id", highlightId)
      .select()
      .single();

    if (error) throw error;

    // Get book
    const { data: book } = await supabase
      .from("books")
      .select("id, title, author")
      .eq("id", (existingHighlight as { book_id: string }).book_id)
      .single();

    // Get topics
    const { data: highlightTopics } = await supabase
      .from("highlight_topics")
      .select("topic_id, confidence")
      .eq("highlight_id", highlightId);

    const topicIds = (highlightTopics as Array<{ topic_id: string }> | null)?.map((ht) => ht.topic_id) || [];
    const { data: topics } = await supabase
      .from("topics")
      .select("*")
      .in("id", topicIds.length > 0 ? topicIds : ["none"]);

    const topicMap = new Map<string, Topic>();
    (topics as Topic[] | null)?.forEach((t) => topicMap.set(t.id, t));

    const topicsWithConfidence = (highlightTopics as Array<{ topic_id: string; confidence: number | null }> | null)?.map((ht) => ({
      ...topicMap.get(ht.topic_id)!,
      confidence: ht.confidence,
    })).filter(Boolean) || [];

    return NextResponse.json({
      data: {
        ...(highlight as Highlight),
        book: book as Pick<Book, "id" | "title" | "author">,
        topics: topicsWithConfidence,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError<unknown>;
      return NextResponse.json(
        { error: zodError.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    console.error("Error updating highlight:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/highlights/[highlightId] - Delete a highlight
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { highlightId } = await params;

    // Check ownership
    const { data: existingHighlight } = await supabase
      .from("highlights")
      .select("id")
      .eq("id", highlightId)
      .eq("user_id", user.id)
      .single();

    if (!existingHighlight) {
      return NextResponse.json({ error: "Highlight not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("highlights")
      .delete()
      .eq("id", highlightId);

    if (error) throw error;

    return NextResponse.json({ message: "Highlight deleted successfully" });
  } catch (error) {
    console.error("Error deleting highlight:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
