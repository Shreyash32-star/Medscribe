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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      clinical_notes: {
        Row: {
          ai_generated: boolean
          consultation_id: string
          created_at: string
          doctor_assessment: string
          doctor_id: string
          doctor_plan: string
          fields: Json
          id: string
          reviewed: boolean
          updated_at: string
          vitals: string
        }
        Insert: {
          ai_generated?: boolean
          consultation_id: string
          created_at?: string
          doctor_assessment?: string
          doctor_id: string
          doctor_plan?: string
          fields?: Json
          id?: string
          reviewed?: boolean
          updated_at?: string
          vitals?: string
        }
        Update: {
          ai_generated?: boolean
          consultation_id?: string
          created_at?: string
          doctor_assessment?: string
          doctor_id?: string
          doctor_plan?: string
          fields?: Json
          id?: string
          reviewed?: boolean
          updated_at?: string
          vitals?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: true
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          consent_confirmed: boolean
          created_at: string
          doctor_id: string
          duration_seconds: number
          finalized_at: string | null
          id: string
          is_demo: boolean
          language: string | null
          patient_id: string
          status: string
          updated_at: string
        }
        Insert: {
          consent_confirmed?: boolean
          created_at?: string
          doctor_id: string
          duration_seconds?: number
          finalized_at?: string | null
          id?: string
          is_demo?: boolean
          language?: string | null
          patient_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          consent_confirmed?: boolean
          created_at?: string
          doctor_id?: string
          duration_seconds?: number
          finalized_at?: string | null
          id?: string
          is_demo?: boolean
          language?: string | null
          patient_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_profiles: {
        Row: {
          city: string | null
          clinic_address: string | null
          clinic_name: string | null
          consent_acknowledged: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          languages: string[]
          note_template: string
          onboarded: boolean
          phone: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          consent_acknowledged?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          languages?: string[]
          note_template?: string
          onboarded?: boolean
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          consent_acknowledged?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          languages?: string[]
          note_template?: string
          onboarded?: boolean
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          age: number | null
          allergies: string | null
          blood_group: string | null
          conditions: string | null
          created_at: string
          dob: string | null
          doctor_id: string
          external_id: string | null
          full_name: string
          gender: string | null
          id: string
          medications: string | null
          phone: string | null
        }
        Insert: {
          age?: number | null
          allergies?: string | null
          blood_group?: string | null
          conditions?: string | null
          created_at?: string
          dob?: string | null
          doctor_id: string
          external_id?: string | null
          full_name: string
          gender?: string | null
          id?: string
          medications?: string | null
          phone?: string | null
        }
        Update: {
          age?: number | null
          allergies?: string | null
          blood_group?: string | null
          conditions?: string | null
          created_at?: string
          dob?: string | null
          doctor_id?: string
          external_id?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          medications?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      transcript_segments: {
        Row: {
          consultation_id: string
          created_at: string
          doctor_id: string
          id: string
          idx: number
          speaker: string
          start_seconds: number
          text: string
        }
        Insert: {
          consultation_id: string
          created_at?: string
          doctor_id: string
          id?: string
          idx?: number
          speaker?: string
          start_seconds?: number
          text?: string
        }
        Update: {
          consultation_id?: string
          created_at?: string
          doctor_id?: string
          id?: string
          idx?: number
          speaker?: string
          start_seconds?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcript_segments_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
