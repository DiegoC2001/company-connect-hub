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
      chamadas: {
        Row: {
          destinatario_id: string
          duracao_segundos: number
          empresa_id: string
          finalizada_em: string | null
          id: string
          iniciada_em: string
          qualidade: number | null
          remetente_id: string
          status: Database["public"]["Enums"]["status_chamada"]
        }
        Insert: {
          destinatario_id: string
          duracao_segundos?: number
          empresa_id: string
          finalizada_em?: string | null
          id?: string
          iniciada_em?: string
          qualidade?: number | null
          remetente_id: string
          status?: Database["public"]["Enums"]["status_chamada"]
        }
        Update: {
          destinatario_id?: string
          duracao_segundos?: number
          empresa_id?: string
          finalizada_em?: string | null
          id?: string
          iniciada_em?: string
          qualidade?: number | null
          remetente_id?: string
          status?: Database["public"]["Enums"]["status_chamada"]
        }
        Relationships: [
          {
            foreignKeyName: "chamadas_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamadas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamadas_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          data_criacao: string
          dominio_email: string
          id: string
          nome: string
          plano: string
        }
        Insert: {
          data_criacao?: string
          dominio_email: string
          id?: string
          nome: string
          plano?: string
        }
        Update: {
          data_criacao?: string
          dominio_email?: string
          id?: string
          nome?: string
          plano?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          cargo: string | null
          created_at: string
          departamento: string | null
          email: string
          empresa_id: string
          id: string
          nome_completo: string
          status_presenca: Database["public"]["Enums"]["status_presenca"]
          ultimo_acesso: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          email: string
          empresa_id: string
          id: string
          nome_completo: string
          status_presenca?: Database["public"]["Enums"]["status_presenca"]
          ultimo_acesso?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          email?: string
          empresa_id?: string
          id?: string
          nome_completo?: string
          status_presenca?: Database["public"]["Enums"]["status_presenca"]
          ultimo_acesso?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_chat: {
        Row: {
          arquivo_url: string | null
          conteudo: string
          data_envio: string
          destinatario_id: string
          empresa_id: string
          id: string
          lida: boolean
          remetente_id: string
          tipo_arquivo: string | null
        }
        Insert: {
          arquivo_url?: string | null
          conteudo: string
          data_envio?: string
          destinatario_id: string
          empresa_id: string
          id?: string
          lida?: boolean
          remetente_id: string
          tipo_arquivo?: string | null
        }
        Update: {
          arquivo_url?: string | null
          conteudo?: string
          data_envio?: string
          destinatario_id?: string
          empresa_id?: string
          id?: string
          lida?: boolean
          remetente_id?: string
          tipo_arquivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_chat_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chat_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chat_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      salas_reuniao: {
        Row: {
          ativa: boolean
          criador_id: string
          data_criacao: string
          empresa_id: string
          id: string
          nome_sala: string
          participantes: Json
        }
        Insert: {
          ativa?: boolean
          criador_id: string
          data_criacao?: string
          empresa_id: string
          id?: string
          nome_sala: string
          participantes?: Json
        }
        Update: {
          ativa?: boolean
          criador_id?: string
          data_criacao?: string
          empresa_id?: string
          id?: string
          nome_sala?: string
          participantes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "salas_reuniao_criador_id_fkey"
            columns: ["criador_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salas_reuniao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          nao_perturbe: boolean
          notif_chamada_perdida: boolean
          qualidade_video: string
          status_padrao: Database["public"]["Enums"]["status_presenca"]
          updated_at: string
          user_id: string
        }
        Insert: {
          nao_perturbe?: boolean
          notif_chamada_perdida?: boolean
          qualidade_video?: string
          status_padrao?: Database["public"]["Enums"]["status_presenca"]
          updated_at?: string
          user_id: string
        }
        Update: {
          nao_perturbe?: boolean
          notif_chamada_perdida?: boolean
          qualidade_video?: string
          status_padrao?: Database["public"]["Enums"]["status_presenca"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_minha_empresa: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "funcionario"
      status_chamada: "em_andamento" | "completada" | "perdida" | "rejeitada"
      status_presenca: "online" | "ocupado" | "ausente" | "offline"
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
    Enums: {
      app_role: ["admin", "funcionario"],
      status_chamada: ["em_andamento", "completada", "perdida", "rejeitada"],
      status_presenca: ["online", "ocupado", "ausente", "offline"],
    },
  },
} as const
