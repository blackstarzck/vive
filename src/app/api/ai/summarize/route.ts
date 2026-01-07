import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { summarizeHighlight } from "@/lib/openai";
import { z } from "zod";
import { Highlight, Topic, HighlightTopic } from "@/types/database";

const summarizeSchema = z.object({
  highlightId: z.string().min(1, "Highlight ID is required"),
});

// POST /api/ai/summarize - Summarize a highlight and extract topics
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { highlightId } = summarizeSchema.parse(body);

    // Get the highlight
    const { data: highlight, error: highlightError } = await supabase
      .from("highlights")
      .select("*")
      .eq("id", highlightId)
      .eq("user_id", user.id)
      .single();

    if (highlightError || !highlight) {
      return NextResponse.json({ error: "Highlight not found" }, { status: 404 });
    }

    const highlightData = highlight as Highlight;

    // Get AI summary and topics
    const result = await summarizeHighlight(highlightData.content, highlightData.note);

    // Update highlight with summary
    await supabase
      .from("highlights")
      .update({ summary: result.summary })
      .eq("id", highlightId);

    // Create or find topics and link them to the highlight
    const topicLinks: Array<HighlightTopic & { topic: Topic }> = [];
    for (const topicName of result.topics) {
      // Find or create topic
      let { data: topic } = await supabase
        .from("topics")
        .select("*")
        .eq("user_id", user.id)
        .eq("name", topicName)
        .single();

      if (!topic) {
        const { data: newTopic } = await supabase
          .from("topics")
          .insert({
            user_id: user.id,
            name: topicName,
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
        .eq("highlight_id", highlightId)
        .eq("topic_id", (topic as Topic).id)
        .single();

      if (!existingLink) {
        const { data: link } = await supabase
          .from("highlight_topics")
          .insert({
            highlight_id: highlightId,
            topic_id: (topic as Topic).id,
            confidence: 0.8, // Default confidence for AI-generated topics
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

    return NextResponse.json({
      data: {
        summary: result.summary,
        topics: result.topics,
        topicLinks,
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

    console.error("Error summarizing highlight:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
