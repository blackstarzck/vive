"use client"

import { useState } from "react"
import { MoreVertical, Edit2, Trash2, BookOpen } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Highlight } from "@/types"
import { cn } from "@/lib/utils"
import { HighlightForm } from "./highlight-form"

// Fallback to simple Dialog for delete confirmation if AlertDialog is missing
// actually I'll just use a state and a Dialog or just confirm() for now if AlertDialog is missing.
// The list had 'dialog' but not 'alert-dialog'.
// I'll use a custom Dialog for deletion confirmation.

interface HighlightCardProps {
  highlight: Highlight
  onUpdate: () => void
}

const COLOR_STYLES: Record<string, string> = {
  yellow: "border-l-yellow-400 bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-950/20",
  green: "border-l-green-400 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20",
  blue: "border-l-blue-400 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20",
  pink: "border-l-pink-400 bg-gradient-to-r from-pink-50/50 to-transparent dark:from-pink-950/20",
  purple: "border-l-purple-400 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20",
}

export function HighlightCard({ highlight, onUpdate }: HighlightCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const colorClass = COLOR_STYLES[highlight.color || "yellow"] || COLOR_STYLES.yellow

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/highlights/${highlight.id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete")

      toast.success("하이라이트가 삭제되었습니다")
      onUpdate()
    } catch (error) {
      toast.error("삭제에 실패했습니다")
    } finally {
      setIsDeleteOpen(false)
    }
  }

  return (
    <>
      <Card className={cn("group relative overflow-hidden transition-all hover:shadow-md border-l-4", colorClass)}>
        <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">메뉴</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                수정
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsDeleteOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardHeader className="pb-3 pt-6">
          <div className="space-y-1">
            <h4 className="flex items-center text-sm font-medium text-muted-foreground">
              <BookOpen className="mr-2 h-3 w-3" />
              {highlight.book?.title || "알 수 없는 책"}
            </h4>
            <div className="flex gap-2 text-xs text-muted-foreground/60">
              {highlight.page_number && <span>p.{highlight.page_number}</span>}
              {highlight.chapter && (
                <>
                  <span>•</span>
                  <span>{highlight.chapter}</span>
                </>
              )}
              <span>•</span>
              <span>{new Date(highlight.created_at).toLocaleDateString("ko-KR")}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <blockquote className="relative border-l-2 border-muted pl-4 italic text-foreground/90">
            "{highlight.content}"
          </blockquote>
          {highlight.note && (
            <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              <p className="font-semibold text-xs mb-1 opacity-70">메모</p>
              {highlight.note}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>하이라이트 수정</DialogTitle>
          </DialogHeader>
          <HighlightForm 
            highlight={highlight} 
            onSuccess={() => {
              setIsEditOpen(false)
              onUpdate()
            }}
            onCancel={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
            <DialogDescription>
              이 작업은 되돌릴 수 없습니다. 하이라이트가 영구적으로 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
