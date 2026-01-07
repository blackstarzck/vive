import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";
import { Book, Highlight, Topic } from "@/types/database";

const searchSchema = z.object({
  query: z.string().min(1, "Query is required"),
});

// POST /api/search - Search highlights (Text-based only)
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { query } = searchSchema.parse(body);

    // Get all user highlights
    const { data: highlights } = await supabase
      .from("highlights")
      .select("*")
      .eq("user_id", user.id);

    const allHighlights = highlights as Highlight[] | null || [];

    // Get books
    const bookIds = [...new Set(allHighlights.map((h) => h.book_id))];
    const { data: books } = await supabase
      .from("books")
      .select("id, title, author")
      .in("id", bookIds.length > 0 ? bookIds : ["none"]);

    const bookMap = new Map<string, Pick<Book, "id" | "title" | "author">>();
    (books as Array<Pick<Book, "id" | "title" | "author">> | null)?.forEach((b) => bookMap.set(b.id, b));

    // Get topics for highlights
    const highlightIds = allHighlights.map((h) => h.id);
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

    // Add relations to highlights
    const highlightsWithRelations = allHighlights.map((h) => ({
      ...h,
      book: bookMap.get(h.book_id)!,
      topics: topicsByHighlight.get(h.id) || [],
    }));

    // Text-based search
    const textMatches = highlightsWithRelations.filter(
      (h) =>
        h.content.toLowerCase().includes(query.toLowerCase()) ||
        (h.note && h.note.toLowerCase().includes(query.toLowerCase()))
    );

    // Limit to top 10
    const relevantHighlights = textMatches.slice(0, 10);

    return NextResponse.json({
      data: {
        highlights: relevantHighlights,
        totalResults: relevantHighlights.length,
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

    console.error("Error searching highlights:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
