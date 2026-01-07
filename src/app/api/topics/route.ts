import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";
import { Topic } from "@/types/database";

const createTopicSchema = z.object({
  name: z.string().min(1, "Topic name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
});

// GET /api/topics - Get all topics for current user
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get topics
    const { data: topics, error } = await supabase
      .from("topics")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) throw error;

    // Get highlight counts per topic
    const { data: highlightTopics } = await supabase
      .from("highlight_topics")
      .select("topic_id");

    const countMap = new Map<string, number>();
    (highlightTopics as Array<{ topic_id: string }> | null)?.forEach((ht) => {
      countMap.set(ht.topic_id, (countMap.get(ht.topic_id) || 0) + 1);
    });

    const topicsWithCount = (topics as Topic[] | null)?.map((topic) => ({
      ...topic,
      _count: {
        highlights: countMap.get(topic.id) || 0,
      },
    }));

    return NextResponse.json({ data: topicsWithCount });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/topics - Create a new topic
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTopicSchema.parse(body);

    // Check if topic already exists
    const { data: existingTopic } = await supabase
      .from("topics")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", validatedData.name)
      .single();

    if (existingTopic) {
      return NextResponse.json(
        { error: "Topic with this name already exists" },
        { status: 400 }
      );
    }

    const { data: topic, error } = await supabase
      .from("topics")
      .insert({
        user_id: user.id,
        name: validatedData.name,
        description: validatedData.description ?? null,
        color: validatedData.color ?? null,
        is_auto: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: {
        ...(topic as Topic),
        _count: { highlights: 0 },
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

    console.error("Error creating topic:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
