"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Tags, ArrowRight, Library, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface DashboardData {
  stats: {
    totalHighlights: number;
    totalBooks: number;
    totalTopics: number;
    totalSearches: number;
    weeklyHighlights: number;
    monthlyHighlights: number;
  };
  recentHighlights: Array<{
    id: string;
    content: string;
    createdAt: string;
    book: {
      title: string;
      author: string | null;
    };
  }>;
  topTopics: Array<{
    id: string;
    name: string;
    color: string | null;
    _count: {
      highlights: number;
    };
  }>;
  recentBooks: Array<{
    id: string;
    title: string;
    author: string | null;
    _count: {
      highlights: number;
    };
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        setData(result.data);
      } catch {
        toast.error("대시보드 데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR");
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-9 w-48 bg-muted animate-pulse rounded" />
            <div className="h-5 w-72 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats ?? {
    totalHighlights: 0,
    totalBooks: 0,
    totalTopics: 0,
    totalSearches: 0,
    weeklyHighlights: 0,
    monthlyHighlights: 0,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">대시보드</h2>
          <p className="text-muted-foreground">
            당신의 지식 라이브러리를 한눈에 확인하세요.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/highlights">
              <BookOpen className="mr-2 h-4 w-4" />
              하이라이트 추가
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-primary">
          <Link href="/highlights">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 하이라이트</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHighlights}</div>
              <p className="text-xs text-muted-foreground">
                이번 주 +{stats.weeklyHighlights}
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-chart-2">
          <Link href="/highlights">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">읽은 책</CardTitle>
              <Library className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBooks}</div>
              <p className="text-xs text-muted-foreground">
                평균 {stats.totalBooks > 0 ? Math.round(stats.totalHighlights / stats.totalBooks) : 0}개 하이라이트/책
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-chart-4">
          <Link href="/highlights">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">주제</CardTitle>
              <Tags className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTopics}</div>
              <p className="text-xs text-muted-foreground">
                AI가 자동 분류
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-chart-5">
          <Link href="/search">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">지식 검색</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSearches}</div>
              <p className="text-xs text-muted-foreground">
                총 검색 횟수
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>최근 하이라이트</CardTitle>
            <CardDescription>
              최근에 저장한 하이라이트입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.recentHighlights && data.recentHighlights.length > 0 ? (
              <div className="space-y-4">
                {data.recentHighlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight line-clamp-2">
                        &quot;{highlight.content.substring(0, 100)}
                        {highlight.content.length > 100 ? "..." : ""}&quot;
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {highlight.book.title} 
                        {highlight.book.author && ` • ${highlight.book.author}`} 
                        {" • "}{formatRelativeTime(highlight.createdAt)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0" asChild>
                      <Link href="/highlights">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  아직 저장된 하이라이트가 없습니다.
                </p>
                <Button asChild>
                  <Link href="/highlights">첫 하이라이트 추가하기</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle>인기 주제</CardTitle>
            </div>
            <CardDescription>
              가장 많은 하이라이트가 있는 주제입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.topTopics && data.topTopics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.topTopics.map((topic) => (
                  <Button
                    key={topic.id}
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    style={topic.color ? { borderColor: topic.color, borderWidth: 2 } : undefined}
                  >
                    # {topic.name}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({topic._count.highlights})
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Tags className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  AI가 하이라이트를 분석하면 주제가 자동으로 생성됩니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {data?.recentBooks && data.recentBooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>내 책</CardTitle>
            <CardDescription>
              최근에 하이라이트를 추가한 책입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {data.recentBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex flex-col p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center mb-3">
                    <Library className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium text-sm line-clamp-2 mb-1">{book.title}</h4>
                  {book.author && (
                    <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-auto">
                    {book._count.highlights}개 하이라이트
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
