export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          category: 'push' | 'pull' | 'legs'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: 'push' | 'pull' | 'legs'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: 'push' | 'pull' | 'legs'
          created_at?: string
        }
      }
      workout_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          workout_template_id: string | null
          date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_template_id?: string | null
          date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_template_id?: string | null
          date?: string
          notes?: string | null
          created_at?: string
        }
      }
      workout_sessions: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          sets: number
          reps: number
          weight: number
          notes: string | null
          is_dropset: boolean
          superset_session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id: string
          sets: number
          reps: number
          weight: number
          notes?: string | null
          is_dropset?: boolean
          superset_session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_id?: string
          sets?: number
          reps?: number
          weight?: number
          notes?: string | null
          is_dropset?: boolean
          superset_session_id?: string | null
          created_at?: string
        }
      }
      monthly_summaries: {
        Row: {
          id: string
          user_id: string
          month: string // YYYY-MM
          summary_text: string
          stats_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          summary_text: string
          stats_json?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          summary_text?: string
          stats_json?: Json
          created_at?: string
        }
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
