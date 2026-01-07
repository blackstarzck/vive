-- ============================================
-- VIVE Database Schema for Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Custom Types
-- ============================================

CREATE TYPE book_source AS ENUM ('MANUAL', 'MILLIE', 'RIDI', 'KINDLE', 'OTHER');

-- ============================================
-- Core Domain Tables
-- ============================================

-- Books table
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT,
    isbn TEXT,
    cover_image TEXT,
    source book_source DEFAULT 'MANUAL',
    source_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Highlights table
CREATE TABLE IF NOT EXISTS highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    note TEXT,
    page_number INTEGER,
    chapter TEXT,
    color TEXT,
    summary TEXT,
    embedding FLOAT8[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    is_auto BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Highlight-Topic junction table
CREATE TABLE IF NOT EXISTS highlight_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(highlight_id, topic_id)
);

-- Search history table
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_source ON books(source, source_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_book_id ON highlights(book_id);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);
CREATE INDEX IF NOT EXISTS idx_highlight_topics_highlight_id ON highlight_topics(highlight_id);
CREATE INDEX IF NOT EXISTS idx_highlight_topics_topic_id ON highlight_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Books policies
CREATE POLICY "Users can view their own books" ON books
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own books" ON books
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books" ON books
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books" ON books
    FOR DELETE USING (auth.uid() = user_id);

-- Highlights policies
CREATE POLICY "Users can view their own highlights" ON highlights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own highlights" ON highlights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights" ON highlights
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights" ON highlights
    FOR DELETE USING (auth.uid() = user_id);

-- Topics policies
CREATE POLICY "Users can view their own topics" ON topics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topics" ON topics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topics" ON topics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topics" ON topics
    FOR DELETE USING (auth.uid() = user_id);

-- Highlight_topics policies (user can manage if they own the highlight)
CREATE POLICY "Users can view their own highlight_topics" ON highlight_topics
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM highlights WHERE highlights.id = highlight_topics.highlight_id AND highlights.user_id = auth.uid())
    );

CREATE POLICY "Users can insert their own highlight_topics" ON highlight_topics
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM highlights WHERE highlights.id = highlight_topics.highlight_id AND highlights.user_id = auth.uid())
    );

CREATE POLICY "Users can delete their own highlight_topics" ON highlight_topics
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM highlights WHERE highlights.id = highlight_topics.highlight_id AND highlights.user_id = auth.uid())
    );

-- Search history policies
CREATE POLICY "Users can view their own search history" ON search_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Functions for updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_highlights_updated_at
    BEFORE UPDATE ON highlights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at
    BEFORE UPDATE ON topics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
