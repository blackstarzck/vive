import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { classifyHighlights } from "@/lib/openai";
import { z } from "zod";
import { Highlight, Topic, HighlightTopic } from "@/types/database";

const classifySchema = z.object({
  highlightIds: z.array(z.string()).min(1, "At least one highlight ID is required"),
});

// POST /api/ai/classify - Classify multiple highlights into topics
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { highlightIds } = classifySchema.parse(body);

    // Get the highlights
    const { data: highlights } = await supabase
      .from("highlights")
      .select("*")
      .in("id", highlightIds)
      .eq("user_id", user.id);

    const highlightList = highlights as Highlight[] | null || [];

    if (highlightList.length === 0) {
      return NextResponse.json({ error: "No highlights found" }, { status: 404 });
    }

    // Get AI classifications
    const classifications = await classifyHighlights(
      highlightList.map((h) => ({
        id: h.id,
        content: h.content,
        note: h.note,
      }))
    );

    // Process each classification
    const results = [];
    for (const highlight of highlightList) {
      const classification = classifications.get(highlight.id);
      if (!classification) continue;

      const topicLinks: Array<HighlightTopic & { topic: Topic }> = [];
      for (const topicData of classification.topics) {
        // Find or create topic
        let { data: topic } = await supabase
          .from("topics")
          .select("*")
          .eq("user_id", user.id)
          .eq("name", topicData.name)
          .single();

        if (!topic) {
          const { data: newTopic } = await supabase
            .from("topics")
            .insert({
              user_id: user.id,
              name: topicData.name,
              is_auto: true,
            })
            .select()
            .single();
          topic = newTopic;
        }

        if (!topic) continue;

        // Check if link already exists
        const { data: existingLink } = await supabase
          .from("highlight_topics")
          .select("*")
          .eq("highlight_id", highlight.id)
          .eq("topic_id", (topic as Topic).id)
          .single();

        if (!existingLink) {
          const { data: link } = await supabase
            .from("highlight_topics")
            .insert({
              highlight_id: highlight.id,
              topic_id: (topic as Topic).id,
              confidence: topicData.confidence,
            })
            .select()
            .single();

          if (link) {
            topicLinks.push({
              ...(link as HighlightTopic),
              topic: topic as Topic,
            });
          }
        }
      }

      results.push({
        highlightId: highlight.id,
        topics: classification.topics,
        topicLinks,
      });
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError<unknown>;
      return NextResponse.json(
        { error: zodError.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    console.error("Error classifying highlights:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
