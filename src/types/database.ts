export type BookSource = "MANUAL" | "MILLIE" | "RIDI" | "KINDLE" | "OTHER";

export type Database = {
  public: {
    Tables: {
      books: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          author: string | null;
          isbn: string | null;
          cover_image: string | null;
          source: BookSource;
          source_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          author?: string | null;
          isbn?: string | null;
          cover_image?: string | null;
          source?: BookSource;
          source_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          author?: string | null;
          isbn?: string | null;
          cover_image?: string | null;
          source?: BookSource;
          source_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "books_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      highlights: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          content: string;
          note: string | null;
          page_number: number | null;
          chapter: string | null;
          color: string | null;
          summary: string | null;
          embedding: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          content: string;
          note?: string | null;
          page_number?: number | null;
          chapter?: string | null;
          color?: string | null;
          summary?: string | null;
          embedding?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          content?: string;
          note?: string | null;
          page_number?: number | null;
          chapter?: string | null;
          color?: string | null;
          summary?: string | null;
          embedding?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "highlights_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "highlights_book_id_fkey";
            columns: ["book_id"];
            referencedRelation: "books";
            referencedColumns: ["id"];
          }
        ];
      };
      topics: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string | null;
          is_auto: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color?: string | null;
          is_auto?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          is_auto?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topics_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      highlight_topics: {
        Row: {
          id: string;
          highlight_id: string;
          topic_id: string;
          confidence: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          highlight_id: string;
          topic_id: string;
          confidence?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          highlight_id?: string;
          topic_id?: string;
          confidence?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "highlight_topics_highlight_id_fkey";
            columns: ["highlight_id"];
            referencedRelation: "highlights";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "highlight_topics_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topics";
            referencedColumns: ["id"];
          }
        ];
      };
      search_history: {
        Row: {
          id: string;
          user_id: string;
          query: string;
          response: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          query: string;
          response?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          query?: string;
          response?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          scopes: string[];
          last_used_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          scopes?: string[];
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          scopes?: string[];
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      notion_integrations: {
        Row: {
          id: string;
          user_id: string;
          access_token: string;
          database_id: string | null;
          database_name: string | null;
          sync_enabled: boolean;
          auto_sync: boolean;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          access_token: string;
          database_id?: string | null;
          database_name?: string | null;
          sync_enabled?: boolean;
          auto_sync?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          access_token?: string;
          database_id?: string | null;
          database_name?: string | null;
          sync_enabled?: boolean;
          auto_sync?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notion_integrations_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      notion_sync_logs: {
        Row: {
          id: string;
          user_id: string;
          integration_id: string;
          sync_type: "manual" | "auto" | "initial";
          status: "pending" | "in_progress" | "completed" | "failed";
          highlights_synced: number;
          errors: Record<string, unknown> | null;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          integration_id: string;
          sync_type: "manual" | "auto" | "initial";
          status?: "pending" | "in_progress" | "completed" | "failed";
          highlights_synced?: number;
          errors?: Record<string, unknown> | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          integration_id?: string;
          sync_type?: "manual" | "auto" | "initial";
          status?: "pending" | "in_progress" | "completed" | "failed";
          highlights_synced?: number;
          errors?: Record<string, unknown> | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notion_sync_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notion_sync_logs_integration_id_fkey";
            columns: ["integration_id"];
            referencedRelation: "notion_integrations";
            referencedColumns: ["id"];
          }
        ];
      };
      highlight_notion_pages: {
        Row: {
          id: string;
          highlight_id: string;
          user_id: string;
          notion_page_id: string;
          notion_page_url: string | null;
          last_synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          highlight_id: string;
          user_id: string;
          notion_page_id: string;
          notion_page_url?: string | null;
          last_synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          highlight_id?: string;
          user_id?: string;
          notion_page_id?: string;
          notion_page_url?: string | null;
          last_synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "highlight_notion_pages_highlight_id_fkey";
            columns: ["highlight_id"];
            referencedRelation: "highlights";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "highlight_notion_pages_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      book_source: BookSource;
    };
    CompositeTypes: Record<string, never>;
  };
};

// Convenience types
export type Book = Database["public"]["Tables"]["books"]["Row"];
export type BookInsert = Database["public"]["Tables"]["books"]["Insert"];
export type BookUpdate = Database["public"]["Tables"]["books"]["Update"];

export type Highlight = Database["public"]["Tables"]["highlights"]["Row"];
export type HighlightInsert = Database["public"]["Tables"]["highlights"]["Insert"];
export type HighlightUpdate = Database["public"]["Tables"]["highlights"]["Update"];

export type Topic = Database["public"]["Tables"]["topics"]["Row"];
export type TopicInsert = Database["public"]["Tables"]["topics"]["Insert"];
export type TopicUpdate = Database["public"]["Tables"]["topics"]["Update"];

export type HighlightTopic = Database["public"]["Tables"]["highlight_topics"]["Row"];
export type HighlightTopicInsert = Database["public"]["Tables"]["highlight_topics"]["Insert"];

export type SearchHistory = Database["public"]["Tables"]["search_history"]["Row"];
export type SearchHistoryInsert = Database["public"]["Tables"]["search_history"]["Insert"];

export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];
export type ApiKeyInsert = Database["public"]["Tables"]["api_keys"]["Insert"];
export type ApiKeyUpdate = Database["public"]["Tables"]["api_keys"]["Update"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type NotionIntegration = Database["public"]["Tables"]["notion_integrations"]["Row"];
export type NotionIntegrationInsert = Database["public"]["Tables"]["notion_integrations"]["Insert"];
export type NotionIntegrationUpdate = Database["public"]["Tables"]["notion_integrations"]["Update"];

export type NotionSyncLog = Database["public"]["Tables"]["notion_sync_logs"]["Row"];
export type NotionSyncLogInsert = Database["public"]["Tables"]["notion_sync_logs"]["Insert"];

export type HighlightNotionPage = Database["public"]["Tables"]["highlight_notion_pages"]["Row"];
export type HighlightNotionPageInsert = Database["public"]["Tables"]["highlight_notion_pages"]["Insert"];

// API Key scope types
export type ApiKeyScope = "read" | "write" | "delete";

// Extended types with relations
export interface BookWithCount extends Book {
  highlight_count?: number;
  _count?: {
    highlights: number;
  };
}

export interface HighlightWithRelations extends Highlight {
  book?: Pick<Book, "id" | "title" | "author" | "cover_image">;
  topics?: TopicWithConfidence[];
}

export interface TopicWithConfidence extends Topic {
  confidence?: number | null;
}

export interface TopicWithCount extends Topic {
  highlight_count?: number;
  _count?: {
    highlights: number;
  };
}
