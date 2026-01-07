import { BookSource } from "@/types/database";

// Book types
export interface Book {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  cover_image: string | null;
  source: BookSource;
  source_id: string | null;
  created_at: string;
  updated_at: string;
  _count?: {
    highlights: number;
  };
}

export interface CreateBookInput {
  title: string;
  author?: string;
  isbn?: string;
  coverImage?: string;
  source?: BookSource;
  sourceId?: string;
}

export interface UpdateBookInput extends Partial<CreateBookInput> {}

// Highlight types
export interface Highlight {
  id: string;
  book_id: string;
  content: string;
  note: string | null;
  page_number: number | null;
  chapter: string | null;
  color: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
  book?: Book;
  topics?: TopicWithConfidence[];
}

export interface CreateHighlightInput {
  bookId: string;
  content: string;
  note?: string;
  pageNumber?: number;
  chapter?: string;
  color?: string;
}

export interface UpdateHighlightInput extends Partial<Omit<CreateHighlightInput, "bookId">> {}

// Topic types
export interface Topic {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_auto: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    highlights: number;
  };
}

export interface TopicWithConfidence extends Topic {
  confidence?: number | null;
}

export interface CreateTopicInput {
  name: string;
  description?: string;
  color?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
