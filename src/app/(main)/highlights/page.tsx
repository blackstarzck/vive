"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BookSelect } from "@/components/highlights/book-select"
import { HighlightCard } from "@/components/highlights/highlight-card"
import { HighlightForm } from "@/components/highlights/highlight-form"
import { Highlight } from "@/types"

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [bookId, setBookId] = useState<string>("")
  const [isAddOpen, setIsAddOpen] = useState(false)

  const fetchHighlights = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (bookId) params.append("bookId", bookId)
      
      const res = await fetch(`/api/highlights?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch highlights")
      
      const data = await res.json()
      setHighlights(data.data || [])
    } catch (error) {
      console.error(error)
      toast.error("하이라이트를 불러오지 못했습니다")
    } finally {
      setIsLoading(false)
    }
  }, [search, bookId])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHighlights()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchHighlights])

  return (
    <div className="flex flex-col h-full space-y-6 p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">내 하이라이트</h1>
          <p className="text-muted-foreground mt-1">
            책 속의 기억하고 싶은 순간들을 모아보세요.
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="md:w-auto w-full shadow-lg hover:shadow-xl transition-all">
              <Plus className="mr-2 h-4 w-4" />
              하이라이트 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>새 하이라이트 추가</DialogTitle>
              <DialogDescription>
                책의 인상 깊은 구절을 기록하고 관리하세요.
              </DialogDescription>
            </DialogHeader>
            <HighlightForm 
              onSuccess={() => {
                setIsAddOpen(false)
                fetchHighlights()
              }}
              onCancel={() => setIsAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-muted/30 p-4 rounded-lg border">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="내용 검색..."
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-1/4">
          <BookSelect 
            value={bookId} 
            onChange={setBookId} 
            className="w-full bg-background"
            allowAdd={false}
          />
        </div>
        {(search || bookId) && (
          <Button 
            variant="ghost" 
            onClick={() => {
              setSearch("")
              setBookId("")
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            필터 초기화
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : highlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg bg-muted/10">
            <div className="text-muted-foreground text-lg font-medium mb-2">
              {search || bookId ? "검색 결과가 없습니다" : "저장된 하이라이트가 없습니다"}
            </div>
            <p className="text-sm text-muted-foreground/60 max-w-sm">
              {search || bookId 
                ? "다른 검색어나 필터를 사용해보세요." 
                : "새로운 하이라이트를 추가하여 독서 노트를 시작해보세요."}
            </p>
            {!(search || bookId) && (
              <Button variant="link" onClick={() => setIsAddOpen(true)} className="mt-4">
                첫 하이라이트 추가하기
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {highlights.map((highlight) => (
              <HighlightCard 
                key={highlight.id} 
                highlight={highlight} 
                onUpdate={fetchHighlights} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
