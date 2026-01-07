import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";
import { Book, BookSource } from "@/types/database";

const createBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().optional(),
  isbn: z.string().optional(),
  coverImage: z.string().url().optional(),
  source: z.enum(["MANUAL", "MILLIE", "RIDI", "KINDLE", "OTHER"]).default("MANUAL"),
  sourceId: z.string().optional(),
});

// GET /api/books - Get all books for current user
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get books
    const { data: books, error } = await supabase
      .from("books")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // Get highlight counts separately
    const { data: highlightCounts } = await supabase
      .from("highlights")
      .select("book_id")
      .eq("user_id", user.id);

    const countMap = new Map<string, number>();
    (highlightCounts as Array<{ book_id: string }> | null)?.forEach((h) => {
      countMap.set(h.book_id, (countMap.get(h.book_id) || 0) + 1);
    });

    // Transform to include highlight_count
    const booksWithCount = (books as Book[] | null)?.map((book) => ({
      ...book,
      _count: {
        highlights: countMap.get(book.id) || 0,
      },
    }));

    return NextResponse.json({ data: booksWithCount });
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/books - Create a new book
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createBookSchema.parse(body);

    const { data: book, error } = await supabase
      .from("books")
      .insert({
        user_id: user.id,
        title: validatedData.title,
        author: validatedData.author ?? null,
        isbn: validatedData.isbn ?? null,
        cover_image: validatedData.coverImage ?? null,
        source: validatedData.source as BookSource,
        source_id: validatedData.sourceId ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      data: {
        ...(book as Book),
        _count: { highlights: 0 },
      }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError<unknown>;
      return NextResponse.json(
        { error: zodError.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    console.error("Error creating book:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
