import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";
import { verifyApiKey, apiKeyError } from "@/lib/api-key";
import { Topic } from "@/types/database";

interface TopicWithCount extends Topic {
  highlight_count?: number;
}

// GET /api/v1/topics - List topics for API key owner
export async function GET(request: NextRequest) {
  // Verify API key
  const authResult = await verifyApiKey(request, "read");
  if (!authResult.valid) {
    return apiKeyError(authResult.error || "Unauthorized");
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Options
    const includeCount = searchParams.get("include_count") === "true";

    // Fetch topics
    const { data: topics, error } = await supabase
      .from("topics")
      .select("*")
      .eq("user_id", authResult.userId!)
      .order("name", { ascending: true });

    if (error) throw error;

    let result: TopicWithCount[] = (topics || []) as Topic[];

    // Fetch highlight counts if requested
    if (includeCount && result.length > 0) {
      const topicIds = result.map((t) => t.id);
      const { data: counts } = await supabase
        .from("highlight_topics")
        .select("topic_id")
        .in("topic_id", topicIds);

      const countMap = new Map<string, number>();
      (counts || []).forEach((c) => {
        countMap.set(c.topic_id, (countMap.get(c.topic_id) || 0) + 1);
      });

      result = result.map((t) => ({
        ...t,
        highlight_count: countMap.get(t.id) || 0,
      }));
    }

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    console.error("API v1 topics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
