"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BookSelect } from "./book-select"
import { Highlight } from "@/types"
import { cn } from "@/lib/utils"

const COLORS = [
  { id: "yellow", bg: "bg-yellow-400", border: "border-yellow-500", label: "Yellow" },
  { id: "green", bg: "bg-green-400", border: "border-green-500", label: "Green" },
  { id: "blue", bg: "bg-blue-400", border: "border-blue-500", label: "Blue" },
  { id: "pink", bg: "bg-pink-400", border: "border-pink-500", label: "Pink" },
  { id: "purple", bg: "bg-purple-400", border: "border-purple-500", label: "Purple" },
] as const

// Use strings for form handling to avoid type conflicts with HTML inputs
const formSchema = z.object({
  bookId: z.string().min(1, "책을 선택해주세요"),
  content: z.string().min(1, "하이라이트 내용을 입력해주세요"),
  note: z.string().optional(),
  pageNumber: z.string().optional(),
  chapter: z.string().optional(),
  color: z.string().optional(),
})

interface HighlightFormProps {
  highlight?: Highlight
  onSuccess?: () => void
  onCancel?: () => void
}

export function HighlightForm({ highlight, onSuccess, onCancel }: HighlightFormProps) {
  const isEditing = !!highlight
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bookId: highlight?.book_id || "",
      content: highlight?.content || "",
      note: highlight?.note || "",
      pageNumber: highlight?.page_number?.toString() || "",
      chapter: highlight?.chapter || "",
      color: highlight?.color || "yellow",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const url = isEditing 
        ? `/api/highlights/${highlight!.id}` 
        : "/api/highlights"
      
      const method = isEditing ? "PUT" : "POST"

      // Convert types for API
      const payload = {
        book_id: values.bookId,
        content: values.content,
        note: values.note || undefined,
        page_number: values.pageNumber ? parseInt(values.pageNumber) : undefined,
        chapter: values.chapter || undefined,
        color: values.color || undefined,
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to save highlight")

      toast.success(isEditing ? "하이라이트가 수정되었습니다" : "하이라이트가 저장되었습니다")
      onSuccess?.()
    } catch (error) {
      console.error(error)
      toast.error("저장에 실패했습니다")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="bookId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>책 선택</FormLabel>
              <FormControl>
                <BookSelect 
                  value={field.value} 
                  onChange={field.onChange} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>하이라이트 내용</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="책에서 인상 깊었던 구절을 입력하세요..." 
                  className="min-h-[120px] resize-none text-base leading-relaxed"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pageNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>페이지</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="예: 42" 
                    {...field} 
                    value={field.value || ''} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="chapter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>챕터</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="예: 1장 시작의 기술" 
                    {...field} 
                    value={field.value || ''} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>내 메모</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="이 구절에 대한 내 생각을 기록하세요 (선택)" 
                  className="min-h-[80px] resize-none text-sm text-muted-foreground"
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>색상</FormLabel>
              <div className="flex gap-3 pt-1">
                {COLORS.map((color) => (
                  <div
                    key={color.id}
                    onClick={() => field.onChange(color.id)}
                    className={cn(
                      "h-8 w-8 rounded-full cursor-pointer flex items-center justify-center transition-all",
                      color.bg,
                      field.value === color.id 
                        ? "ring-2 ring-offset-2 ring-foreground scale-110" 
                        : "hover:scale-105 opacity-70 hover:opacity-100"
                    )}
                  >
                    {field.value === color.id && (
                      <Check className="h-4 w-4 text-white drop-shadow-md" />
                    )}
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button type="submit">
            {isEditing ? "수정" : "저장"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
