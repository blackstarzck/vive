import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Book, Highlight, Topic } from "@/types/database";

// GET /api/dashboard - Get dashboard statistics
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Get all counts in parallel
    const [
      highlightCountResult,
      bookCountResult,
      topicCountResult,
      searchCountResult,
      recentHighlightsResult,
      topicsResult,
      recentBooksResult,
    ] = await Promise.all([
      // Total highlights
      supabase
        .from("highlights")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      
      // Total books
      supabase
        .from("books")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      
      // Total topics
      supabase
        .from("topics")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      
      // Total searches
      supabase
        .from("search_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      
      // Recent highlights (last 5)
      supabase
        .from("highlights")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      
      // Topics
      supabase
        .from("topics")
        .select("*")
        .eq("user_id", userId),
      
      // Recent books (last 5)
      supabase
        .from("books")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

    const recentHighlights = recentHighlightsResult.data as Highlight[] | null || [];
    const allTopics = topicsResult.data as Topic[] | null || [];
    const recentBooks = recentBooksResult.data as Book[] | null || [];

    // Get books for recent highlights
    const bookIds = [...new Set(recentHighlights.map((h) => h.book_id))];
    const { data: highlightBooks } = await supabase
      .from("books")
      .select("id, title, author")
      .in("id", bookIds.length > 0 ? bookIds : ["none"]);

    const bookMap = new Map<string, Pick<Book, "id" | "title" | "author">>();
    (highlightBooks as Array<Pick<Book, "id" | "title" | "author">> | null)?.forEach((b) => bookMap.set(b.id, b));

    // Get highlight counts per topic
    const { data: highlightTopics } = await supabase
      .from("highlight_topics")
      .select("topic_id");

    const topicCountMap = new Map<string, number>();
    (highlightTopics as Array<{ topic_id: string }> | null)?.forEach((ht) => {
      topicCountMap.set(ht.topic_id, (topicCountMap.get(ht.topic_id) || 0) + 1);
    });

    // Sort topics by highlight count
    const topTopics = allTopics
      .map((t) => ({
        ...t,
        _count: { highlights: topicCountMap.get(t.id) || 0 },
      }))
      .sort((a, b) => b._count.highlights - a._count.highlights)
      .slice(0, 10);

    // Get highlight counts per book
    const { data: bookHighlights } = await supabase
      .from("highlights")
      .select("book_id")
      .eq("user_id", userId);

    const bookCountMap = new Map<string, number>();
    (bookHighlights as Array<{ book_id: string }> | null)?.forEach((h) => {
      bookCountMap.set(h.book_id, (bookCountMap.get(h.book_id) || 0) + 1);
    });

    // Add highlight counts to books
    const recentBooksWithCount = recentBooks.map((b) => ({
      ...b,
      _count: { highlights: bookCountMap.get(b.id) || 0 },
    }));

    // Add book info to highlights
    const recentHighlightsWithBook = recentHighlights.map((h) => ({
      ...h,
      book: bookMap.get(h.book_id),
    }));

    // Calculate this week's highlights
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { count: weeklyHighlights } = await supabase
      .from("highlights")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneWeekAgo.toISOString());

    // Calculate this month's highlights
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const { count: monthlyHighlights } = await supabase
      .from("highlights")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneMonthAgo.toISOString());

    return NextResponse.json({
      data: {
        stats: {
          totalHighlights: highlightCountResult.count || 0,
          totalBooks: bookCountResult.count || 0,
          totalTopics: topicCountResult.count || 0,
          totalSearches: searchCountResult.count || 0,
          weeklyHighlights: weeklyHighlights || 0,
          monthlyHighlights: monthlyHighlights || 0,
        },
        recentHighlights: recentHighlightsWithBook,
        topTopics,
        recentBooks: recentBooksWithCount,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
