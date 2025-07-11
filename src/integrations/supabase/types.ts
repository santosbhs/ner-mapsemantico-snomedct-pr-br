export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clinical_annotations: {
        Row: {
          created_at: string
          id: string
          original_text: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          original_text: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          original_text?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      extracted_entities: {
        Row: {
          annotation_id: string
          confidence: number
          created_at: string
          end_position: number
          id: string
          label: string
          start_position: number
          text: string
        }
        Insert: {
          annotation_id: string
          confidence: number
          created_at?: string
          end_position: number
          id?: string
          label: string
          start_position: number
          text: string
        }
        Update: {
          annotation_id?: string
          confidence?: number
          created_at?: string
          end_position?: number
          id?: string
          label?: string
          start_position?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_entities_annotation_id_fkey"
            columns: ["annotation_id"]
            isOneToOne: false
            referencedRelation: "clinical_annotations"
            referencedColumns: ["id"]
          },
        ]
      }
      hl7_mappings: {
        Row: {
          created_at: string
          entity_id: string
          hl7_code: string
          hl7_code_system_name: string
          hl7_display: string
          hl7_system: string
          hl7_version: string | null
          id: string
          resource_type: string
          similarity_score: number
        }
        Insert: {
          created_at?: string
          entity_id: string
          hl7_code: string
          hl7_code_system_name: string
          hl7_display: string
          hl7_system: string
          hl7_version?: string | null
          id?: string
          resource_type: string
          similarity_score: number
        }
        Update: {
          created_at?: string
          entity_id?: string
          hl7_code?: string
          hl7_code_system_name?: string
          hl7_display?: string
          hl7_system?: string
          hl7_version?: string | null
          id?: string
          resource_type?: string
          similarity_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "hl7_mappings_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "extracted_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      snomed_mappings: {
        Row: {
          created_at: string
          embedding_distance: number
          entity_id: string
          id: string
          original_snomed_term: string
          similarity_score: number
          snomed_code: string
          snomed_hierarchy: string[]
          snomed_synonyms: string[]
          snomed_term: string
        }
        Insert: {
          created_at?: string
          embedding_distance: number
          entity_id: string
          id?: string
          original_snomed_term: string
          similarity_score: number
          snomed_code: string
          snomed_hierarchy?: string[]
          snomed_synonyms?: string[]
          snomed_term: string
        }
        Update: {
          created_at?: string
          embedding_distance?: number
          entity_id?: string
          id?: string
          original_snomed_term?: string
          similarity_score?: number
          snomed_code?: string
          snomed_hierarchy?: string[]
          snomed_synonyms?: string[]
          snomed_term?: string
        }
        Relationships: [
          {
            foreignKeyName: "snomed_mappings_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "extracted_entities"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
