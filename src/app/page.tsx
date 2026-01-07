import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Sparkles, ArrowRight, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">VIVE</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild>
              <Link href="/register">시작하기</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto flex flex-1 flex-col items-center justify-center py-24 text-center">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              책 읽은 뒤의{" "}
              <span className="text-primary">진짜 내 지식</span>을<br />
              만들어주는 AI 비서
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              밀리와 리디에서 남긴 하이라이트와 메모를 한곳에 모으고,
              AI가 요약하고 분류해서 언제든 꺼내 쓸 수 있는 내 자산으로 만들어드립니다.
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                무료로 시작하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">
                로그인
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container mx-auto">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              어떻게 작동하나요?
            </h2>
            <p className="mt-4 text-muted-foreground">
              세 단계로 책 속 지식을 내 자산으로 만드세요.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative rounded-lg border bg-background p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">1. 지식 수집</h3>
              <p className="text-muted-foreground">
                책에서 감동받은 문장과 메모를 붙여넣거나 직접 입력하세요.
                곧 밀리, 리디 연동도 지원합니다.
              </p>
            </div>

            <div className="relative rounded-lg border bg-background p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">2. AI 분류</h3>
              <p className="text-muted-foreground">
                AI가 자동으로 내용을 요약하고 비슷한 주제끼리 묶어줍니다.
                복잡한 정리 작업은 AI에게 맡기세요.
              </p>
            </div>

            <div className="relative rounded-lg border bg-background p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">3. 지식 검색</h3>
              <p className="text-muted-foreground">
                &quot;리더십에 대해 읽은 내용 찾아줘&quot;라고 물으면
                AI가 내 책들에서 관련 내용을 찾아 답변해줍니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container mx-auto">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              왜 VIVE인가요?
            </h2>
          </div>

          <div className="mx-auto max-w-3xl space-y-4">
            {[
              "책을 읽고 며칠 후에도 핵심 내용을 기억하세요",
              "흩어진 하이라이트를 한곳에서 관리하세요",
              "업무에 필요할 때 바로 관련 지식을 찾으세요",
              "AI가 자동으로 주제별로 정리해드립니다",
              "노션, 슬랙으로 내보내기 (곧 지원 예정)",
            ].map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg border bg-card p-4"
              >
                <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
            지금 바로 시작하세요
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            무료로 가입하고 책에서 얻은 지식을 평생 자산으로 만드세요.
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link href="/register">
              무료로 시작하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">VIVE</span>
          </div>
          <p className="text-sm text-muted-foreground">
            2024 VIVE. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
