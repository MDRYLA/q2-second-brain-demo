// Source of truth — regen via MCP `generate_typescript_types` po każdej migracji.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      entries: {
        Row: {
          ciphertext: string
          created_at: string
          entry_date: string
          entry_type: string
          id: string
          mood_word: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ciphertext: string
          created_at?: string
          entry_date: string
          entry_type: string
          id?: string
          mood_word?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ciphertext?: string
          created_at?: string
          entry_date?: string
          entry_type?: string
          id?: string
          mood_word?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_notes: {
        Row: {
          ciphertext: string
          created_at: string
          id: string
          tags_hash: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ciphertext: string
          created_at?: string
          id?: string
          tags_hash?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ciphertext?: string
          created_at?: string
          id?: string
          tags_hash?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          ciphertext: string
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ciphertext: string
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ciphertext?: string
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          ciphertext: string
          created_at: string
          id: string
          parent_plan_id: string | null
          period_end: string
          period_start: string
          plan_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ciphertext: string
          created_at?: string
          id?: string
          parent_plan_id?: string | null
          period_end: string
          period_start: string
          plan_level: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ciphertext?: string
          created_at?: string
          id?: string
          parent_plan_id?: string | null
          period_end?: string
          period_start?: string
          plan_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_parent_plan_id_fkey"
            columns: ["parent_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      snapshots: {
        Row: {
          ciphertext: string
          id: string
          snapshot_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ciphertext: string
          id?: string
          snapshot_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ciphertext?: string
          id?: string
          snapshot_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          ciphertext: string
          created_at: string
          id: string
          session_date: string
          session_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ciphertext: string
          created_at?: string
          id?: string
          session_date: string
          session_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ciphertext?: string
          created_at?: string
          id?: string
          session_date?: string
          session_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bip39_hash: string | null
          created_at: string
          id: string
          pbkdf2_params: Json
          salt: string
          sentinel: string | null
          updated_at: string
        }
        Insert: {
          bip39_hash?: string | null
          created_at?: string
          id?: string
          pbkdf2_params?: Json
          salt: string
          sentinel?: string | null
          updated_at?: string
        }
        Update: {
          bip39_hash?: string | null
          created_at?: string
          id?: string
          pbkdf2_params?: Json
          salt?: string
          sentinel?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vocabulary: {
        Row: {
          ciphertext: string
          created_at: string
          fsrs_difficulty: number
          fsrs_retrievability: number
          fsrs_stability: number
          id: string
          language_id: string
          lapses: number
          next_review_at: string
          reps: number
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ciphertext: string
          created_at?: string
          fsrs_difficulty?: number
          fsrs_retrievability?: number
          fsrs_stability?: number
          id?: string
          language_id: string
          lapses?: number
          next_review_at?: string
          reps?: number
          state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ciphertext?: string
          created_at?: string
          fsrs_difficulty?: number
          fsrs_retrievability?: number
          fsrs_stability?: number
          id?: string
          language_id?: string
          lapses?: number
          next_review_at?: string
          reps?: number
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Pozwalają używać TablesInsert<"plans">, TablesUpdate<"plans"> itd. w helperach Supabase.

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T] extends { Row: infer R } ? R : never;

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never;

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never;
