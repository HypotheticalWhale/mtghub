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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      mtg_ai_search_queries: {
        Row: {
          created_at: string | null
          id: string
          original_query: string
          search_results_count: number
          translated_query: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          original_query: string
          search_results_count?: number
          translated_query: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          original_query?: string
          search_results_count?: number
          translated_query?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtg_ai_search_queries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mtg_card_faces: {
        Row: {
          artist: string | null
          artist_id: string | null
          card_id: string | null
          color_identity: string[] | null
          colors: string[] | null
          created_at: string | null
          face_index: number
          flavor_text: string | null
          id: string
          illustration_id: string | null
          image_uris: Json | null
          keywords: string[] | null
          mana_cost: string | null
          name: string
          oracle_text: string | null
          power: string | null
          toughness: string | null
          type_line: string
        }
        Insert: {
          artist?: string | null
          artist_id?: string | null
          card_id?: string | null
          color_identity?: string[] | null
          colors?: string[] | null
          created_at?: string | null
          face_index: number
          flavor_text?: string | null
          id?: string
          illustration_id?: string | null
          image_uris?: Json | null
          keywords?: string[] | null
          mana_cost?: string | null
          name: string
          oracle_text?: string | null
          power?: string | null
          toughness?: string | null
          type_line: string
        }
        Update: {
          artist?: string | null
          artist_id?: string | null
          card_id?: string | null
          color_identity?: string[] | null
          colors?: string[] | null
          created_at?: string | null
          face_index?: number
          flavor_text?: string | null
          id?: string
          illustration_id?: string | null
          image_uris?: Json | null
          keywords?: string[] | null
          mana_cost?: string | null
          name?: string
          oracle_text?: string | null
          power?: string | null
          toughness?: string | null
          type_line?: string
        }
        Relationships: []
      }
      mtg_cards: {
        Row: {
          cmc: number | null
          color_identity: string[] | null
          colors: string[] | null
          created_at: string | null
          id: string
          image_url: string | null
          mana_cost: string | null
          multiverse_id: number | null
          name: string
          oracle_text: string | null
          power: string | null
          rarity: string | null
          scryfall_id: string | null
          set_id: string | null
          toughness: string | null
          type_line: string
          updated_at: string | null
        }
        Insert: {
          cmc?: number | null
          color_identity?: string[] | null
          colors?: string[] | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          mana_cost?: string | null
          multiverse_id?: number | null
          name: string
          oracle_text?: string | null
          power?: string | null
          rarity?: string | null
          scryfall_id?: string | null
          set_id?: string | null
          toughness?: string | null
          type_line: string
          updated_at?: string | null
        }
        Update: {
          cmc?: number | null
          color_identity?: string[] | null
          colors?: string[] | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          mana_cost?: string | null
          multiverse_id?: number | null
          name?: string
          oracle_text?: string | null
          power?: string | null
          rarity?: string | null
          scryfall_id?: string | null
          set_id?: string | null
          toughness?: string | null
          type_line?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtg_cards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "mtg_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      mtg_draft_pack_cards: {
        Row: {
          card_id: string | null
          created_at: string | null
          id: string
          pack_id: string | null
          picked_at: string | null
          picked_by_id: string | null
          position: number
        }
        Insert: {
          card_id?: string | null
          created_at?: string | null
          id?: string
          pack_id?: string | null
          picked_at?: string | null
          picked_by_id?: string | null
          position: number
        }
        Update: {
          card_id?: string | null
          created_at?: string | null
          id?: string
          pack_id?: string | null
          picked_at?: string | null
          picked_by_id?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "mtg_draft_pack_cards_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "mtg_draft_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtg_draft_pack_cards_picked_by_id_fkey"
            columns: ["picked_by_id"]
            isOneToOne: false
            referencedRelation: "mtg_draft_players"
            referencedColumns: ["id"]
          },
        ]
      }
      mtg_draft_packs: {
        Row: {
          created_at: string | null
          current_owner_id: string | null
          draft_session_id: string | null
          id: string
          original_owner_id: string | null
          pack_number: number
          round_number: number
          status: string
        }
        Insert: {
          created_at?: string | null
          current_owner_id?: string | null
          draft_session_id?: string | null
          id?: string
          original_owner_id?: string | null
          pack_number: number
          round_number: number
          status?: string
        }
        Update: {
          created_at?: string | null
          current_owner_id?: string | null
          draft_session_id?: string | null
          id?: string
          original_owner_id?: string | null
          pack_number?: number
          round_number?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mtg_draft_packs_current_owner_id_fkey"
            columns: ["current_owner_id"]
            isOneToOne: false
            referencedRelation: "mtg_draft_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtg_draft_packs_original_owner_id_fkey"
            columns: ["original_owner_id"]
            isOneToOne: false
            referencedRelation: "mtg_draft_players"
            referencedColumns: ["id"]
          },
        ]
      }
      mtg_draft_picks: {
        Row: {
          ai_reasoning: string | null
          card_id: string | null
          created_at: string | null
          id: string
          is_ai_pick: boolean | null
          pack_number: number
          pick_number: number
          session_id: string | null
        }
        Insert: {
          ai_reasoning?: string | null
          card_id?: string | null
          created_at?: string | null
          id?: string
          is_ai_pick?: boolean | null
          pack_number: number
          pick_number: number
          session_id?: string | null
        }
        Update: {
          ai_reasoning?: string | null
          card_id?: string | null
          created_at?: string | null
          id?: string
          is_ai_pick?: boolean | null
          pack_number?: number
          pick_number?: number
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtg_draft_picks_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "mtg_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtg_draft_picks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mtg_draft_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mtg_draft_players: {
        Row: {
          created_at: string | null
          draft_session_id: string | null
          id: string
          name: string
          seat_number: number
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          draft_session_id?: string | null
          id?: string
          name: string
          seat_number: number
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          draft_session_id?: string | null
          id?: string
          name?: string
          seat_number?: number
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtg_draft_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mtg_draft_sessions: {
        Row: {
          ai_players: Json | null
          completed_at: string | null
          created_at: string | null
          current_pack: number | null
          current_pick: number | null
          id: string
          name: string
          picks_per_pack: number | null
          set_code: string | null
          status: string | null
          total_packs: number | null
          total_picks: number | null
          updated_at: string | null
          user_id: string | null
          user_picks: Json | null
        }
        Insert: {
          ai_players?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_pack?: number | null
          current_pick?: number | null
          id?: string
          name: string
          picks_per_pack?: number | null
          set_code?: string | null
          status?: string | null
          total_packs?: number | null
          total_picks?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_picks?: Json | null
        }
        Update: {
          ai_players?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_pack?: number | null
          current_pick?: number | null
          id?: string
          name?: string
          picks_per_pack?: number | null
          set_code?: string | null
          status?: string | null
          total_packs?: number | null
          total_picks?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_picks?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mtg_draft_sessions_set_code_fkey"
            columns: ["set_code"]
            isOneToOne: false
            referencedRelation: "mtg_sets"
            referencedColumns: ["code"]
          },
        ]
      }
      mtg_sets: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
          release_date: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
          release_date?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          release_date?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
