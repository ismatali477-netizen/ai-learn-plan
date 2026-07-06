export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          created_at: string
          description: string
          icon: string
          id: string
          threshold_type: string
          threshold_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          threshold_type: string
          threshold_value?: number
          title: string
          xp_reward?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          threshold_type?: string
          threshold_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          sources: Json | null
          thread_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          sources?: Json | null
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          sources?: Json | null
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          course: string | null
          created_at: string
          education_level: string | null
          id: string
          language: string
          last_message_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course?: string | null
          created_at?: string
          education_level?: string | null
          id?: string
          language?: string
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course?: string | null
          created_at?: string
          education_level?: string | null
          id?: string
          language?: string
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          page_number: number | null
          user_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          page_number?: number | null
          user_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          page_number?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          error_message: string | null
          filename: string
          id: string
          mime_type: string | null
          page_count: number | null
          size_bytes: number | null
          status: string
          storage_path: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          filename: string
          id?: string
          mime_type?: string | null
          page_count?: number | null
          size_bytes?: number | null
          status?: string
          storage_path: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          filename?: string
          id?: string
          mime_type?: string | null
          page_count?: number | null
          size_bytes?: number | null
          status?: string
          storage_path?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          created_at: string
          exam_date: string
          id: string
          importance: number
          subject_id: string | null
          title: string
          topics: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_date: string
          id?: string
          importance?: number
          subject_id?: string | null
          title: string
          topics?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_date?: string
          id?: string
          importance?: number
          subject_id?: string | null
          title?: string
          topics?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          kind: string
          source_document_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          kind: string
          source_document_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          kind?: string
          source_document_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          course: string | null
          created_at: string
          daily_study_minutes_goal: number
          education_level: string | null
          email: string | null
          faculty: string | null
          full_name: string | null
          id: string
          learning_goal: string | null
          level: number
          preferred_language: string
          semester: string | null
          streak_days: number
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          course?: string | null
          created_at?: string
          daily_study_minutes_goal?: number
          education_level?: string | null
          email?: string | null
          faculty?: string | null
          full_name?: string | null
          id: string
          learning_goal?: string | null
          level?: number
          preferred_language?: string
          semester?: string | null
          streak_days?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          course?: string | null
          created_at?: string
          daily_study_minutes_goal?: number
          education_level?: string | null
          email?: string | null
          faculty?: string | null
          full_name?: string | null
          id?: string
          learning_goal?: string | null
          level?: number
          preferred_language?: string
          semester?: string | null
          streak_days?: number
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          ai_meta: Json | null
          created_at: string
          end_date: string
          id: string
          start_date: string
          status: string
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_meta?: Json | null
          created_at?: string
          end_date: string
          id?: string
          start_date: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_meta?: Json | null
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string
          subject_id: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          subject_id?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          subject_id?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "study_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      study_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          exam_id: string | null
          id: string
          plan_id: string | null
          priority: number
          scheduled_date: string
          status: string
          subject_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          exam_id?: string | null
          id?: string
          plan_id?: string | null
          priority?: number
          scheduled_date: string
          status?: string
          subject_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          exam_id?: string | null
          id?: string
          plan_id?: string | null
          priority?: number
          scheduled_date?: string
          status?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_tasks_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_tasks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string
          created_at: string
          difficulty: number
          id: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          difficulty?: number
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          difficulty?: number
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          notifications_enabled: boolean
          pomodoro_break_minutes: number
          pomodoro_long_break_minutes: number
          pomodoro_work_minutes: number
          preferred_days: Json
          preferred_end_hour: number
          preferred_start_hour: number
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          notifications_enabled?: boolean
          pomodoro_break_minutes?: number
          pomodoro_long_break_minutes?: number
          pomodoro_work_minutes?: number
          preferred_days?: Json
          preferred_end_hour?: number
          preferred_start_hour?: number
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          notifications_enabled?: boolean
          pomodoro_break_minutes?: number
          pomodoro_long_break_minutes?: number
          pomodoro_work_minutes?: number
          preferred_days?: Json
          preferred_end_hour?: number
          preferred_start_hour?: number
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_document_chunks: {
        Args: {
          filter_document_id?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          content: string
          document_id: string
          id: string
          page_number: number
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
