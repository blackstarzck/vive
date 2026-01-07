"use client"

import { useEffect, useState } from "react"
import { Check, ChevronsUpDown, Plus, Book as BookIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddBookDialog } from "./add-book-dialog"
import { Book } from "@/types"

interface BookSelectProps {
  value?: string
  onChange: (value: string) => void
  className?: string
  allowAdd?: boolean
}

export function BookSelect({ value, onChange, className, allowAdd = true }: BookSelectProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [addBookOpen, setAddBookOpen] = useState(false)

  const fetchBooks = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/books")
      if (!res.ok) throw new Error("Failed to fetch books")
      const data = await res.json()
      setBooks(data.data || [])
    } catch (error) {
      console.error(error)
      toast.error("책 목록을 불러오지 못했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const selectedBook = books.find((book) => book.id === value)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            {selectedBook ? (
              <span className="flex items-center truncate">
                <BookIcon className="mr-2 h-4 w-4 opacity-50" />
                {selectedBook.title}
              </span>
            ) : (
              "책 선택..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] p-0" align="start">
          <div className="max-h-[300px] overflow-y-auto p-1">
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              나의 서재
            </DropdownMenuLabel>
            {isLoading ? (
              <div className="p-2 text-sm text-center text-muted-foreground">로딩 중...</div>
            ) : books.length === 0 ? (
              <div className="p-2 text-sm text-center text-muted-foreground">책이 없습니다</div>
            ) : (
              books.map((book) => (
                <DropdownMenuItem
                  key={book.id}
                  onSelect={() => onChange(book.id)}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">{book.title}</span>
                  {value === book.id && <Check className="ml-2 h-4 w-4 opacity-50" />}
                </DropdownMenuItem>
              ))
            )}
          </div>
          {allowAdd && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-blue-600 focus:text-blue-700 dark:text-blue-400 dark:focus:text-blue-300 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault()
                  setAddBookOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                새 책 추가
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {allowAdd && (
        <AddBookDialog 
          open={addBookOpen} 
          onOpenChange={setAddBookOpen}
          onSuccess={(newBook) => {
            setBooks((prev) => [newBook, ...prev])
            onChange(newBook.id)
          }}
        />
      )}
    </>
  )
}
