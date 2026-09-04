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
      audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          org_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          org_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          dot_number: string | null
          id: string
          mc_number: string | null
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          dot_number?: string | null
          id?: string
          mc_number?: string | null
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          dot_number?: string | null
          id?: string
          mc_number?: string | null
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carriers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          billing_address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          org_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          org_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          org_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_pings: {
        Row: {
          id: string
          lat: number
          lng: number
          load_id: string
          recorded_at: string
        }
        Insert: {
          id?: string
          lat: number
          lng: number
          load_id: string
          recorded_at?: string
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          load_id?: string
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gps_pings_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          org_id: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["user_role_type"]
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["user_role_type"]
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["user_role_type"]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number
          amount_total: number
          carrier_id: string | null
          created_at: string
          customer_id: string | null
          due_date: string | null
          id: string
          invoice_type: Database["public"]["Enums"]["invoice_type_enum"]
          load_id: string | null
          org_id: string
          payment_status: Database["public"]["Enums"]["payment_status_enum"]
          updated_at: string
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number
          amount_total?: number
          carrier_id?: string | null
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_type: Database["public"]["Enums"]["invoice_type_enum"]
          load_id?: string | null
          org_id: string
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          updated_at?: string
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number
          amount_total?: number
          carrier_id?: string | null
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_type?: Database["public"]["Enums"]["invoice_type_enum"]
          load_id?: string | null
          org_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_top_customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      load_documents: {
        Row: {
          created_at: string
          document_type: string | null
          file_url: string | null
          id: string
          load_id: string
          ocr_confidence_score: number | null
          ocr_extracted_json: Json | null
          ocr_status: string
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          file_url?: string | null
          id?: string
          load_id: string
          ocr_confidence_score?: number | null
          ocr_extracted_json?: Json | null
          ocr_status?: string
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string | null
          file_url?: string | null
          id?: string
          load_id?: string
          ocr_confidence_score?: number | null
          ocr_extracted_json?: Json | null
          ocr_status?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "load_documents_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      loads: {
        Row: {
          broker_margin: number | null
          carrier_id: string | null
          carrier_pay: number
          created_at: string
          customer_id: string | null
          delivery_date: string | null
          destination: string | null
          driver_name: string | null
          driver_phone: string | null
          id: string
          last_known_lat: number | null
          last_known_lng: number | null
          last_ping_at: string | null
          org_id: string
          origin: string | null
          pickup_date: string | null
          shipper_rate: number
          status: Database["public"]["Enums"]["load_operational_status"]
          tracking_token: string
          trailer_number: string | null
          truck_number: string | null
          updated_at: string
        }
        Insert: {
          broker_margin?: number | null
          carrier_id?: string | null
          carrier_pay?: number
          created_at?: string
          customer_id?: string | null
          delivery_date?: string | null
          destination?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          last_known_lat?: number | null
          last_known_lng?: number | null
          last_ping_at?: string | null
          org_id: string
          origin?: string | null
          pickup_date?: string | null
          shipper_rate?: number
          status?: Database["public"]["Enums"]["load_operational_status"]
          tracking_token?: string
          trailer_number?: string | null
          truck_number?: string | null
          updated_at?: string
        }
        Update: {
          broker_margin?: number | null
          carrier_id?: string | null
          carrier_pay?: number
          created_at?: string
          customer_id?: string | null
          delivery_date?: string | null
          destination?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          last_known_lat?: number | null
          last_known_lng?: number | null
          last_ping_at?: string | null
          org_id?: string
          origin?: string | null
          pickup_date?: string | null
          shipper_rate?: number
          status?: Database["public"]["Enums"]["load_operational_status"]
          tracking_token?: string
          trailer_number?: string | null
          truck_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loads_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_top_customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "loads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          plan_tier: Database["public"]["Enums"]["subscription_plan_tier"]
          updated_at: string
          workspace_type: Database["public"]["Enums"]["tenant_workspace_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan_tier?: Database["public"]["Enums"]["subscription_plan_tier"]
          updated_at?: string
          workspace_type?: Database["public"]["Enums"]["tenant_workspace_type"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan_tier?: Database["public"]["Enums"]["subscription_plan_tier"]
          updated_at?: string
          workspace_type?: Database["public"]["Enums"]["tenant_workspace_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          org_id: string | null
          role: Database["public"]["Enums"]["user_role_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          org_id?: string | null
          role?: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          org_id?: string | null
          role?: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          id: string
          org_id: string | null
          payload: Json | null
          processed_at: string
          type: string
        }
        Insert: {
          id: string
          org_id?: string | null
          payload?: Json | null
          processed_at?: string
          type: string
        }
        Update: {
          id?: string
          org_id?: string | null
          payload?: Json | null
          processed_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string
          current_period_end: string | null
          org_id: string
          plan: Database["public"]["Enums"]["subscription_plan_tier"]
          seat_limit: number
          state: Database["public"]["Enums"]["subscription_state"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          current_period_end?: string | null
          org_id: string
          plan?: Database["public"]["Enums"]["subscription_plan_tier"]
          seat_limit?: number
          state?: Database["public"]["Enums"]["subscription_state"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          current_period_end?: string | null
          org_id?: string
          plan?: Database["public"]["Enums"]["subscription_plan_tier"]
          seat_limit?: number
          state?: Database["public"]["Enums"]["subscription_state"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_kpi_summary: {
        Row: {
          active_loads: number | null
          delivered_mtd: number | null
          exception_count: number | null
          gross_margin_mtd: number | null
          in_transit: number | null
          margin_percent: number | null
          needs_carrier: number | null
          outstanding_ar: number | null
        }
        Relationships: []
      }
      v_loads_by_status: {
        Row: {
          count: number | null
          status: Database["public"]["Enums"]["load_operational_status"] | null
        }
        Relationships: []
      }
      v_revenue_by_week: {
        Row: {
          cost: number | null
          margin: number | null
          margin_percent: number | null
          revenue: number | null
          week_start: string | null
        }
        Relationships: []
      }
      v_top_customers: {
        Row: {
          company_name: string | null
          customer_id: string | null
          load_count: number | null
          revenue: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      default_trial_interval: { Args: never; Returns: string }
      get_auth_user_org_id: { Args: never; Returns: string }
      get_load_by_tracking_token: {
        Args: { p_token: string }
        Returns: {
          destination: string
          driver_name: string
          id: string
          last_known_lat: number
          last_known_lng: number
          last_ping_at: string
          origin: string
          status: Database["public"]["Enums"]["load_operational_status"]
          truck_number: string
        }[]
      }
      org_can_write: { Args: { p_org_id: string }; Returns: boolean }
      record_tracking_ping: {
        Args: { p_lat: number; p_lng: number; p_token: string }
        Returns: undefined
      }
      seats_used: { Args: { p_org_id: string }; Returns: number }
    }
    Enums: {
      invoice_type_enum: "shipper_invoice" | "carrier_settlement"
      load_operational_status:
        | "quoted"
        | "posted_to_boards"
        | "covered"
        | "dispatched"
        | "at_pickup"
        | "in_transit"
        | "at_delivery"
        | "delivered"
        | "pod_uploaded"
        | "invoiced"
        | "settled"
        | "cancelled"
      payment_status_enum:
        | "pending"
        | "partial"
        | "paid"
        | "overdue"
        | "cancelled"
      subscription_plan_tier: "free" | "starter" | "growth" | "enterprise"
      subscription_state:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "expired"
      tenant_workspace_type:
        | "freight_brokerage"
        | "truck_dispatch"
        | "hybrid_enterprise"
      user_role_type: "owner" | "admin" | "member" | "viewer"
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
    Enums: {
      invoice_type_enum: ["shipper_invoice", "carrier_settlement"],
      load_operational_status: [
        "quoted",
        "posted_to_boards",
        "covered",
        "dispatched",
        "at_pickup",
        "in_transit",
        "at_delivery",
        "delivered",
        "pod_uploaded",
        "invoiced",
        "settled",
        "cancelled",
      ],
      payment_status_enum: [
        "pending",
        "partial",
        "paid",
        "overdue",
        "cancelled",
      ],
      subscription_plan_tier: ["free", "starter", "growth", "enterprise"],
      subscription_state: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "expired",
      ],
      tenant_workspace_type: [
        "freight_brokerage",
        "truck_dispatch",
        "hybrid_enterprise",
      ],
      user_role_type: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
