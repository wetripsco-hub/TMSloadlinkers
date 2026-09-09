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
      data_reset_requests: {
        Row: {
          email_verified_at: string | null
          id: string
          org_id: string
          otp_code_hash: string | null
          rejection_reason: string | null
          requested_at: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          email_verified_at?: string | null
          id?: string
          org_id: string
          otp_code_hash?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          email_verified_at?: string | null
          id?: string
          org_id?: string
          otp_code_hash?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_reset_requests_org_id_fkey"
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
          accepted_by: string | null
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
          accepted_by?: string | null
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
          accepted_by?: string | null
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
            foreignKeyName: "invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          load_id: string | null
          ocr_attempts: number
          ocr_confidence_score: number | null
          ocr_error: string | null
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
          load_id?: string | null
          ocr_attempts?: number
          ocr_confidence_score?: number | null
          ocr_error?: string | null
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
          load_id?: string | null
          ocr_attempts?: number
          ocr_confidence_score?: number | null
          ocr_error?: string | null
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
          arrived_at_delivery_at: string | null
          arrived_at_pickup_at: string | null
          broker_margin: number | null
          carrier_id: string | null
          carrier_pay: number
          commodity: string | null
          created_at: string
          customer_id: string | null
          customer_po_number: string | null
          delivered_at: string | null
          delivery_date: string | null
          departed_pickup_at: string | null
          destination: string | null
          destination_city: string | null
          destination_facility_name: string | null
          destination_state: string | null
          destination_window_end: string | null
          destination_zip: string | null
          driver_name: string | null
          driver_phone: string | null
          equipment_type: string | null
          id: string
          last_known_lat: number | null
          last_known_lng: number | null
          last_ping_at: string | null
          load_number: string | null
          load_seq: number
          needs_shipper_rate: boolean
          org_id: string
          origin: string | null
          origin_city: string | null
          origin_facility_name: string | null
          origin_state: string | null
          origin_window_end: string | null
          origin_zip: string | null
          pickup_date: string | null
          shipper_rate: number
          status: Database["public"]["Enums"]["load_operational_status"]
          tracking_token: string
          trailer_number: string | null
          truck_number: string | null
          updated_at: string
          weight_lbs: number | null
        }
        Insert: {
          arrived_at_delivery_at?: string | null
          arrived_at_pickup_at?: string | null
          broker_margin?: number | null
          carrier_id?: string | null
          carrier_pay?: number
          commodity?: string | null
          created_at?: string
          customer_id?: string | null
          customer_po_number?: string | null
          delivered_at?: string | null
          delivery_date?: string | null
          departed_pickup_at?: string | null
          destination?: string | null
          destination_city?: string | null
          destination_facility_name?: string | null
          destination_state?: string | null
          destination_window_end?: string | null
          destination_zip?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          equipment_type?: string | null
          id?: string
          last_known_lat?: number | null
          last_known_lng?: number | null
          last_ping_at?: string | null
          load_number?: string | null
          load_seq?: never
          needs_shipper_rate?: boolean
          org_id: string
          origin?: string | null
          origin_city?: string | null
          origin_facility_name?: string | null
          origin_state?: string | null
          origin_window_end?: string | null
          origin_zip?: string | null
          pickup_date?: string | null
          shipper_rate?: number
          status?: Database["public"]["Enums"]["load_operational_status"]
          tracking_token?: string
          trailer_number?: string | null
          truck_number?: string | null
          updated_at?: string
          weight_lbs?: number | null
        }
        Update: {
          arrived_at_delivery_at?: string | null
          arrived_at_pickup_at?: string | null
          broker_margin?: number | null
          carrier_id?: string | null
          carrier_pay?: number
          commodity?: string | null
          created_at?: string
          customer_id?: string | null
          customer_po_number?: string | null
          delivered_at?: string | null
          delivery_date?: string | null
          departed_pickup_at?: string | null
          destination?: string | null
          destination_city?: string | null
          destination_facility_name?: string | null
          destination_state?: string | null
          destination_window_end?: string | null
          destination_zip?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          equipment_type?: string | null
          id?: string
          last_known_lat?: number | null
          last_known_lng?: number | null
          last_ping_at?: string | null
          load_number?: string | null
          load_seq?: never
          needs_shipper_rate?: boolean
          org_id?: string
          origin?: string | null
          origin_city?: string | null
          origin_facility_name?: string | null
          origin_state?: string | null
          origin_window_end?: string | null
          origin_zip?: string | null
          pickup_date?: string | null
          shipper_rate?: number
          status?: Database["public"]["Enums"]["load_operational_status"]
          tracking_token?: string
          trailer_number?: string | null
          truck_number?: string | null
          updated_at?: string
          weight_lbs?: number | null
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
      notifications_sent: {
        Row: {
          id: string
          org_id: string
          recipient: string
          sent_at: string
          template: string
        }
        Insert: {
          id?: string
          org_id: string
          recipient: string
          sent_at?: string
          template: string
        }
        Update: {
          id?: string
          org_id?: string
          recipient?: string
          sent_at?: string
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_sent_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_usage_daily: {
        Row: {
          count: number
          org_id: string
          usage_date: string
        }
        Insert: {
          count?: number
          org_id: string
          usage_date?: string
        }
        Update: {
          count?: number
          org_id?: string
          usage_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocr_usage_daily_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          account_number: string | null
          address: string | null
          bank_name: string | null
          contact_email: string | null
          contact_person_name: string | null
          contact_phone: string | null
          created_at: string
          dot_number: string | null
          id: string
          logo_url: string | null
          mc_number: string | null
          name: string
          plan_tier: Database["public"]["Enums"]["subscription_plan_tier"]
          remittance_notes: string | null
          routing_number: string | null
          updated_at: string
          workspace_type: Database["public"]["Enums"]["tenant_workspace_type"]
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          contact_email?: string | null
          contact_person_name?: string | null
          contact_phone?: string | null
          created_at?: string
          dot_number?: string | null
          id?: string
          logo_url?: string | null
          mc_number?: string | null
          name: string
          plan_tier?: Database["public"]["Enums"]["subscription_plan_tier"]
          remittance_notes?: string | null
          routing_number?: string | null
          updated_at?: string
          workspace_type?: Database["public"]["Enums"]["tenant_workspace_type"]
        }
        Update: {
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          contact_email?: string | null
          contact_person_name?: string | null
          contact_phone?: string | null
          created_at?: string
          dot_number?: string | null
          id?: string
          logo_url?: string | null
          mc_number?: string | null
          name?: string
          plan_tier?: Database["public"]["Enums"]["subscription_plan_tier"]
          remittance_notes?: string | null
          routing_number?: string | null
          updated_at?: string
          workspace_type?: Database["public"]["Enums"]["tenant_workspace_type"]
        }
        Relationships: []
      }
      plan_ocr_daily_limits: {
        Row: {
          daily_limit: number | null
          plan: Database["public"]["Enums"]["subscription_plan_tier"]
        }
        Insert: {
          daily_limit?: number | null
          plan: Database["public"]["Enums"]["subscription_plan_tier"]
        }
        Update: {
          daily_limit?: number | null
          plan?: Database["public"]["Enums"]["subscription_plan_tier"]
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_audit_log: {
        Row: {
          action: string
          actor_admin_id: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string
          id: string
          org_id: string | null
        }
        Insert: {
          action: string
          actor_admin_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          id?: string
          org_id?: string | null
        }
        Update: {
          action?: string
          actor_admin_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          id?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      support_ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string | null
          sender_type: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id?: string | null
          sender_type: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string | null
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          org_id: string
          priority: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          org_id: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          org_id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_tickets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
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
      advance_tracking_status: {
        Args: {
          p_next_status: Database["public"]["Enums"]["load_operational_status"]
          p_token: string
        }
        Returns: undefined
      }
      approve_data_reset_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      check_and_increment_ocr_quota: {
        Args: { p_org_id: string }
        Returns: Json
      }
      complete_onboarding: {
        Args: {
          p_full_name?: string
          p_org_name: string
          p_workspace_type: string
        }
        Returns: string
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      default_trial_interval: { Args: never; Returns: string }
      execute_data_reset: { Args: { request_id: string }; Returns: undefined }
      get_auth_user_org_id: { Args: never; Returns: string }
      get_carrier_performance_report: {
        Args: { p_end_date: string; p_org_id: string; p_start_date: string }
        Returns: {
          carrier_id: string
          carrier_name: string
          delivered_loads: number
          excluded_no_audit_trail_count: number
          on_time_count: number
          on_time_pct: number
          total_carrier_pay: number
          total_eligible_count: number
          total_loads: number
        }[]
      }
      get_financial_report_summary: {
        Args: { p_end_date: string; p_org_id: string; p_start_date: string }
        Returns: {
          delivered_loads: number
          total_loads: number
          total_margin: number
          total_revenue: number
        }[]
      }
      get_load_by_tracking_token: {
        Args: { p_token: string }
        Returns: {
          arrived_at_delivery_at: string
          arrived_at_pickup_at: string
          delivered_at: string
          delivery_date: string
          departed_pickup_at: string
          destination: string
          destination_city: string
          destination_facility_name: string
          destination_state: string
          destination_window_end: string
          destination_zip: string
          driver_name: string
          id: string
          last_known_lat: number
          last_known_lng: number
          last_ping_at: string
          load_number: string
          origin: string
          origin_city: string
          origin_facility_name: string
          origin_state: string
          origin_window_end: string
          origin_zip: string
          pickup_date: string
          status: Database["public"]["Enums"]["load_operational_status"]
          truck_number: string
        }[]
      }
      get_load_volume_by_period: {
        Args: {
          p_bucket?: string
          p_end_date: string
          p_org_id: string
          p_start_date: string
        }
        Returns: {
          bucket_start: string
          load_count: number
        }[]
      }
      get_on_time_delivery_pct: {
        Args: { p_end_date: string; p_org_id: string; p_start_date: string }
        Returns: {
          excluded_no_audit_trail_count: number
          on_time_count: number
          on_time_pct: number
          total_eligible_count: number
        }[]
      }
      get_platform_organizations: {
        Args: never
        Returns: {
          created_at: string
          name: string
          org_id: string
          plan_tier: string
          seat_count: number
          subscription_state: string
          trial_ends_at: string
          workspace_type: string
        }[]
      }
      get_revenue_by_period: {
        Args: {
          p_bucket?: string
          p_end_date: string
          p_org_id: string
          p_start_date: string
        }
        Returns: {
          bucket_start: string
          cost: number
          margin: number
          revenue: number
        }[]
      }
      get_top_customers_report: {
        Args: {
          p_end_date: string
          p_limit?: number
          p_org_id: string
          p_start_date: string
        }
        Returns: {
          company_name: string
          customer_id: string
          load_count: number
          revenue: number
        }[]
      }
      is_org_admin: { Args: never; Returns: boolean }
      is_platform_admin: { Args: { uid: string }; Returns: boolean }
      org_can_write: { Args: { p_org_id: string }; Returns: boolean }
      record_tracking_ping: {
        Args: { p_lat: number; p_lng: number; p_token: string }
        Returns: undefined
      }
      reject_data_reset_request: {
        Args: { p_reason: string; p_request_id: string }
        Returns: undefined
      }
      seats_used: { Args: { p_org_id: string }; Returns: number }
      trial_lifecycle_targets: {
        Args: never
        Returns: {
          org_id: string
          org_name: string
          owner_email: string
          state: string
          trial_ends_at: string
        }[]
      }
      verify_data_reset_otp: {
        Args: { p_code: string; p_request_id: string }
        Returns: boolean
      }
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
