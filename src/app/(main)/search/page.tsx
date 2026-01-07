"use client"

import * as React from "react"
import { 
  Search, 
  Send, 
  BookOpen, 
  Sparkles, 
  History, 
  User, 
  Bot, 
  Library,
  ArrowRight,
  MoreVertical,
  Trash2,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Types
type Highlight = {
  id: string
  content: string
  bookTitle: string
  author: string
  page?: number
}

type SearchResponse = {
  data: {
    highlights: Highlight[]
    aiAnswer: string
    totalResults: number
  }
}

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  highlights?: Highlight[]
  timestamp: Date
}

type HistoryItem = {
  id: string
  query: string
  timestamp: Date
}

export default function SearchPage() {
  const [query, setQuery] = React.useState("")
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [useAI, setUseAI] = React.useState(true)
  const [history, setHistory] = React.useState<HistoryItem[]>([])
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading])

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: searchQuery,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setQuery("")
    setIsLoading(true)

    // Add to history if not duplicate of last
    setHistory(prev => {
      if (prev[0]?.query === searchQuery) return prev
      return [{ id: Date.now().toString(), query: searchQuery, timestamp: new Date() }, ...prev]
    })

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, useAI }),
      })

      if (!response.ok) {
        // Fallback for demo if API endpoint doesn't exist yet
        console.warn("API unavailable, using mock response")
        await new Promise(resolve => setTimeout(resolve, 1500)) // Fake delay
        
        const mockData: SearchResponse = {
          data: {
            aiAnswer: useAI ? "이 주제에 대한 당신의 하이라이트들은 주로 '성장'과 '실패'의 관계에 집중되어 있습니다. 여러 책에서 당신은 실패를 단순한 끝이 아니라 배움의 과정으로 정의하는 문장들을 수집했습니다. 특히 '마인드셋'과 '아주 작은 습관의 힘'에서 이러한 경향이 두드러집니다." : "",
            highlights: [
              {
                id: "1",
                content: "실패는 치명적이지 않다. 실패할 용기가 없는 것이야말로 치명적이다.",
                bookTitle: "윈스턴 처칠의 명언집",
                author: "Winston Churchill",
                page: 124
              },
              {
                id: "2",
                content: "전문가는 아주 좁은 분야에서 저지를 수 있는 모든 실수를 다 저질러본 사람이다.",
                bookTitle: "생각의 탄생",
                author: "Niels Bohr",
                page: 45
              },
              {
                id: "3",
                content: "우리가 두려워해야 할 것은 실패가 아니라, 시도조차 하지 않는 것이다.",
                bookTitle: "도전의 미학",
                author: "Unknown",
                page: 12
              }
            ],
            totalResults: 3
          }
        }
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: mockData.data.aiAnswer || "검색 결과입니다.",
          highlights: mockData.data.highlights,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
        setIsLoading(false)
        return
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.data.aiAnswer || "검색 결과입니다.",
        highlights: data.data.highlights,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      toast.error("검색 중 오류가 발생했습니다.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden text-foreground">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <div className="h-14 border-b flex items-center px-6 justify-between bg-background/50 backdrop-blur-sm z-10 sticky top-0">
          <div className="flex items-center gap-2 text-foreground/80">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-semibold tracking-tight">지식 검색</span>
          </div>
          <div className="md:hidden">
             {/* Mobile History Toggle could go here */}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-8 pb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 opacity-0 animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="p-4 rounded-full bg-primary/5 mb-4 ring-1 ring-primary/10">
                  <Library className="w-10 h-10 text-primary/60" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  무엇이든 물어보세요
                </h1>
                <p className="text-muted-foreground max-w-md text-sm md:text-base leading-relaxed">
                  당신의 서재에 담긴 모든 지식을 AI가 연결해드립니다.<br/>
                  책 속의 문장들과 대화를 시작해보세요.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-lg mt-8">
                  {["리더십에 관한 하이라이트 찾아줘", "행복이란 무엇일까?", "습관 형성에 도움이 되는 문장들", "최근에 읽은 책 요약해줘"].map((suggestion) => (
                    <Button 
                      key={suggestion}
                      variant="outline" 
                      className="justify-start h-auto py-3 px-4 text-xs md:text-sm font-normal text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                      onClick={() => handleSearch(suggestion)}
                    >
                      <MessageSquare className="w-3 h-3 mr-2 opacity-50" />
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500", 
                    msg.role === "assistant" ? "pb-8" : "pb-4"
                  )}
                >
                  {/* Avatar & Role Name */}
                  <div className="flex items-center gap-3">
                    <Avatar className={cn("w-8 h-8 border", msg.role === "assistant" ? "bg-primary/5 border-primary/10" : "bg-background border-border")}>
                      {msg.role === "assistant" ? (
                        <div className="flex items-center justify-center w-full h-full">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                      ) : (
                        <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-sm font-medium text-foreground/70">
                      {msg.role === "assistant" ? "VIVE AI" : "나"}
                    </span>
                  </div>

                  {/* Content Bubble */}
                  <div className="pl-11">
                    {msg.role === "user" ? (
                      <div className="inline-block bg-primary text-primary-foreground px-5 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="space-y-6 w-full">
                        {/* AI Answer Section */}
                        {msg.content && (
                          <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-5 rounded-xl border border-border/50">
                            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-primary uppercase tracking-wider">
                              <Sparkles className="w-3 h-3" />
                              AI 답변
                            </div>
                            <p className="whitespace-pre-wrap leading-7 text-foreground/90 font-light">
                              {msg.content}
                            </p>
                          </div>
                        )}

                        {/* Highlights Grid */}
                        {msg.highlights && msg.highlights.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                              <BookOpen className="w-3 h-3" />
                              관련 하이라이트
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {msg.highlights.map((highlight) => (
                                <Card key={highlight.id} className="group overflow-hidden hover:shadow-md transition-all duration-300 border-border/60 hover:border-primary/30 bg-card/50">
                                  <CardContent className="p-4 flex flex-col h-full gap-3">
                                    <div className="relative">
                                      <span className="absolute -top-1 -left-1 text-4xl font-serif text-muted-foreground/10 leading-none">“</span>
                                      <p className="font-serif text-sm md:text-base leading-relaxed text-foreground/90 pl-2 line-clamp-4 group-hover:line-clamp-none transition-all">
                                        {highlight.content}
                                      </p>
                                    </div>
                                    <Separator className="opacity-50" />
                                    <div className="flex items-center justify-between mt-auto pt-1">
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-medium text-foreground/80 truncate">
                                          {highlight.bookTitle}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground truncate">
                                          {highlight.author}
                                        </span>
                                      </div>
                                      {highlight.page && (
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-secondary/50 text-secondary-foreground/70">
                                          p.{highlight.page}
                                        </Badge>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 border bg-primary/5 border-primary/10">
                    <div className="flex items-center justify-center w-full h-full animate-pulse">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground/70">VIVE AI</span>
                </div>
                <div className="pl-11 space-y-2 max-w-md">
                   <div className="h-4 bg-muted/40 rounded w-3/4 animate-pulse" />
                   <div className="h-4 bg-muted/40 rounded w-1/2 animate-pulse" />
                   <div className="h-4 bg-muted/40 rounded w-5/6 animate-pulse" />
                </div>
              </div>
            )}
            <div ref={scrollRef} className="h-4" />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 bg-background border-t">
          <div className="max-w-3xl mx-auto relative flex items-end gap-2 p-1.5 bg-muted/30 border rounded-3xl shadow-sm focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/20 focus-within:bg-background transition-all">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full h-10 w-10 shrink-0 mb-0.5", 
                useAI ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground"
              )}
              onClick={() => setUseAI(!useAI)}
              title={useAI ? "AI 답변 켜짐" : "AI 답변 꺼짐"}
            >
              <Sparkles className="w-4 h-4" />
            </Button>
            
            <Textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="무엇이든 물어보세요..."
              className="min-h-[44px] max-h-[120px] py-3 px-2 border-0 shadow-none focus-visible:ring-0 resize-none bg-transparent text-sm"
              rows={1}
            />

            <Button
              size="icon"
              className={cn(
                "rounded-full h-10 w-10 shrink-0 mb-0.5 transition-all", 
                query.trim() ? "opacity-100" : "opacity-50 cursor-not-allowed"
              )}
              onClick={() => handleSearch()}
              disabled={!query.trim() || isLoading}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-muted-foreground/60">
              AI는 실수를 할 수 있습니다. 중요한 정보는 확인이 필요합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Right Sidebar - History (Desktop) */}
      <div className="hidden lg:flex flex-col w-72 border-l bg-muted/10 h-full">
        <div className="h-14 flex items-center px-4 border-b">
          <History className="w-4 h-4 mr-2 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">검색 기록</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/50 text-xs">
                <History className="w-8 h-8 mb-2 opacity-20" />
                기록이 없습니다
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    // In a real app, scroll to message or reload session
                    // For now, just pre-fill the input
                    setQuery(item.query)
                    inputRef.current?.focus()
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group relative text-sm group"
                >
                  <p className="font-medium text-foreground/80 truncate pr-4">{item.query}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {item.timestamp.toLocaleDateString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
