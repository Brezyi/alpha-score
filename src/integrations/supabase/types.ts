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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_deletion_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      accountability_partners: {
        Row: {
          ended_at: string | null
          id: string
          is_active: boolean
          partner_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          is_active?: boolean
          partner_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          is_active?: boolean
          partner_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          key: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon: string
          id?: string
          is_active?: boolean
          key: string
          name: string
          requirement_type: string
          requirement_value?: number
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      activities: {
        Row: {
          active_calories: number | null
          activity_type: string | null
          created_at: string
          distance_km: number | null
          duration_minutes: number | null
          entry_date: string
          id: string
          notes: string | null
          steps: number | null
          user_id: string
        }
        Insert: {
          active_calories?: number | null
          activity_type?: string | null
          created_at?: string
          distance_km?: number | null
          duration_minutes?: number | null
          entry_date?: string
          id?: string
          notes?: string | null
          steps?: number | null
          user_id: string
        }
        Update: {
          active_calories?: number | null
          activity_type?: string | null
          created_at?: string
          distance_km?: number | null
          duration_minutes?: number | null
          entry_date?: string
          id?: string
          notes?: string | null
          steps?: number | null
          user_id?: string
        }
        Relationships: []
      }
      admin_password_reset_requests: {
        Row: {
          admin_notes: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      admin_passwords: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          last_changed_at: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          last_changed_at?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          last_changed_at?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      analyses: {
        Row: {
          created_at: string
          detailed_results: Json | null
          id: string
          looks_score: number | null
          photo_urls: string[]
          potential_image_url: string | null
          potential_score: number | null
          priorities: string[] | null
          status: string
          strengths: string[] | null
          updated_at: string
          user_id: string
          weaknesses: string[] | null
        }
        Insert: {
          created_at?: string
          detailed_results?: Json | null
          id?: string
          looks_score?: number | null
          photo_urls: string[]
          potential_image_url?: string | null
          potential_score?: number | null
          priorities?: string[] | null
          status?: string
          strengths?: string[] | null
          updated_at?: string
          user_id: string
          weaknesses?: string[] | null
        }
        Update: {
          created_at?: string
          detailed_results?: Json | null
          id?: string
          looks_score?: number | null
          photo_urls?: string[]
          potential_image_url?: string | null
          potential_score?: number | null
          priorities?: string[] | null
          status?: string
          strengths?: string[] | null
          updated_at?: string
          user_id?: string
          weaknesses?: string[] | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_type: string
          actor_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          arm_cm: number | null
          body_fat_percent: number | null
          chest_cm: number | null
          created_at: string
          hip_cm: number | null
          id: string
          measured_at: string
          notes: string | null
          thigh_cm: number | null
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          arm_cm?: number | null
          body_fat_percent?: number | null
          chest_cm?: number | null
          created_at?: string
          hip_cm?: number | null
          id?: string
          measured_at?: string
          notes?: string | null
          thigh_cm?: number | null
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          arm_cm?: number | null
          body_fat_percent?: number | null
          chest_cm?: number | null
          created_at?: string
          hip_cm?: number | null
          id?: string
          measured_at?: string
          notes?: string | null
          thigh_cm?: number | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      calorie_adjustments: {
        Row: {
          calorie_adjustment: number | null
          created_at: string
          day_of_week: number | null
          id: string
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          calorie_adjustment?: number | null
          created_at?: string
          day_of_week?: number | null
          id?: string
          is_active?: boolean | null
          user_id: string
        }
        Update: {
          calorie_adjustment?: number | null
          created_at?: string
          day_of_week?: number | null
          id?: string
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      coach_conversations: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coach_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenges: {
        Row: {
          category: string
          created_at: string
          description: string
          difficulty: string
          icon: string
          id: string
          is_active: boolean
          title: string
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          difficulty?: string
          icon?: string
          id?: string
          is_active?: boolean
          title: string
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          difficulty?: string
          icon?: string
          id?: string
          is_active?: boolean
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      face_fitness_sessions: {
        Row: {
          completed_at: string
          duration_seconds: number
          exercise_key: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          duration_seconds: number
          exercise_key: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          duration_seconds?: number
          exercise_key?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          attempted_at: string
          created_at: string
          email: string
          id: string
          ip_address: string | null
        }
        Insert: {
          attempted_at?: string
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          attempted_at?: string
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      fasting_sessions: {
        Row: {
          actual_end_time: string | null
          created_at: string
          fasting_type: string
          id: string
          is_completed: boolean | null
          notes: string | null
          start_time: string
          target_end_time: string
          user_id: string
        }
        Insert: {
          actual_end_time?: string | null
          created_at?: string
          fasting_type?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          start_time: string
          target_end_time: string
          user_id: string
        }
        Update: {
          actual_end_time?: string | null
          created_at?: string
          fasting_type?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          start_time?: string
          target_end_time?: string
          user_id?: string
        }
        Relationships: []
      }
      food_database: {
        Row: {
          barcode: string | null
          brand: string | null
          calories_per_100g: number | null
          carbs_per_100g: number | null
          category: string | null
          created_at: string | null
          created_by: string | null
          fat_per_100g: number | null
          fiber_per_100g: number | null
          id: string
          is_verified: boolean | null
          name: string
          protein_per_100g: number | null
          serving_size_g: number | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          is_verified?: boolean | null
          name: string
          protein_per_100g?: number | null
          serving_size_g?: number | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          is_verified?: boolean | null
          name?: string
          protein_per_100g?: number | null
          serving_size_g?: number | null
        }
        Relationships: []
      }
      friend_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      friend_connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friend_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friend_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friend_status"]
          updated_at?: string
        }
        Relationships: []
      }
      friend_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      friend_privacy_settings: {
        Row: {
          allow_challenge_invites: boolean
          created_at: string
          id: string
          show_challenges: boolean
          show_score: Database["public"]["Enums"]["privacy_visibility"]
          show_streak: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_challenge_invites?: boolean
          created_at?: string
          id?: string
          show_challenges?: boolean
          show_score?: Database["public"]["Enums"]["privacy_visibility"]
          show_streak?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_challenge_invites?: boolean
          created_at?: string
          id?: string
          show_challenges?: boolean
          show_score?: Database["public"]["Enums"]["privacy_visibility"]
          show_streak?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      grocery_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_checked: boolean | null
          item_name: string
          list_id: string
          quantity: number | null
          recipe_id: string | null
          unit: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_checked?: boolean | null
          item_name: string
          list_id: string
          quantity?: number | null
          recipe_id?: string | null
          unit?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_checked?: boolean | null
          item_name?: string
          list_id?: string
          quantity?: number | null
          recipe_id?: string | null
          unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grocery_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "grocery_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_lists: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_connections: {
        Row: {
          access_token_encrypted: string | null
          created_at: string
          id: string
          is_connected: boolean | null
          last_sync_at: string | null
          provider: string
          refresh_token_encrypted: string | null
          sync_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          provider: string
          refresh_token_encrypted?: string | null
          sync_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          provider?: string
          refresh_token_encrypted?: string | null
          sync_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lifestyle_entries: {
        Row: {
          created_at: string
          entry_date: string
          exercise_minutes: number | null
          id: string
          notes: string | null
          nutrition_quality: number | null
          skincare_routine_completed: boolean | null
          sleep_bedtime: string | null
          sleep_hours: number | null
          sleep_quality: number | null
          sleep_waketime: string | null
          sunscreen_applied: boolean | null
          supplements_taken: boolean | null
          updated_at: string
          user_id: string
          water_liters: number | null
        }
        Insert: {
          created_at?: string
          entry_date?: string
          exercise_minutes?: number | null
          id?: string
          notes?: string | null
          nutrition_quality?: number | null
          skincare_routine_completed?: boolean | null
          sleep_bedtime?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          sleep_waketime?: string | null
          sunscreen_applied?: boolean | null
          supplements_taken?: boolean | null
          updated_at?: string
          user_id: string
          water_liters?: number | null
        }
        Update: {
          created_at?: string
          entry_date?: string
          exercise_minutes?: number | null
          id?: string
          notes?: string | null
          nutrition_quality?: number | null
          skincare_routine_completed?: boolean | null
          sleep_bedtime?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          sleep_waketime?: string | null
          sunscreen_applied?: boolean | null
          supplements_taken?: boolean | null
          updated_at?: string
          user_id?: string
          water_liters?: number | null
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          barcode: string | null
          calories: number | null
          carbs_g: number | null
          created_at: string
          entry_date: string
          fat_g: number | null
          fiber_g: number | null
          food_name: string
          id: string
          meal_type: string
          notes: string | null
          protein_g: number | null
          serving_size: string | null
          user_id: string
        }
        Insert: {
          barcode?: string | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          entry_date?: string
          fat_g?: number | null
          fiber_g?: number | null
          food_name: string
          id?: string
          meal_type: string
          notes?: string | null
          protein_g?: number | null
          serving_size?: string | null
          user_id: string
        }
        Update: {
          barcode?: string | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          entry_date?: string
          fat_g?: number | null
          fiber_g?: number | null
          food_name?: string
          id?: string
          meal_type?: string
          notes?: string | null
          protein_g?: number | null
          serving_size?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string | null
          custom_meal_name: string | null
          id: string
          meal_type: string
          notes: string | null
          plan_date: string
          recipe_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_meal_name?: string | null
          id?: string
          meal_type: string
          notes?: string | null
          plan_date: string
          recipe_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_meal_name?: string | null
          id?: string
          meal_type?: string
          notes?: string | null
          plan_date?: string
          recipe_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_backup_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used: boolean
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used?: boolean
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used?: boolean
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          created_at: string
          energy_level: number | null
          entry_date: string
          id: string
          mood_score: number | null
          notes: string | null
          stress_level: number | null
          symptoms: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          energy_level?: number | null
          entry_date?: string
          id?: string
          mood_score?: number | null
          notes?: string | null
          stress_level?: number | null
          symptoms?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          energy_level?: number | null
          entry_date?: string
          id?: string
          mood_score?: number | null
          notes?: string | null
          stress_level?: number | null
          symptoms?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      motivation_tips: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          tip_text: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tip_text: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tip_text?: string
        }
        Relationships: []
      }
      nutrition_goals: {
        Row: {
          created_at: string
          daily_calories: number | null
          daily_carbs_g: number | null
          daily_fat_g: number | null
          daily_fiber_g: number | null
          daily_protein_g: number | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_calories?: number | null
          daily_carbs_g?: number | null
          daily_fat_g?: number | null
          daily_fiber_g?: number | null
          daily_protein_g?: number | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_calories?: number | null
          daily_carbs_g?: number | null
          daily_fat_g?: number | null
          daily_fiber_g?: number | null
          daily_protein_g?: number | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_check_ins: {
        Row: {
          check_in_date: string
          completed_goals: string[] | null
          created_at: string
          id: string
          mood_score: number | null
          notes: string | null
          partnership_id: string
          user_id: string
        }
        Insert: {
          check_in_date?: string
          completed_goals?: string[] | null
          created_at?: string
          id?: string
          mood_score?: number | null
          notes?: string | null
          partnership_id: string
          user_id: string
        }
        Update: {
          check_in_date?: string
          completed_goals?: string[] | null
          created_at?: string
          id?: string
          mood_score?: number | null
          notes?: string | null
          partnership_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_check_ins_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "accountability_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          id: string
          metadata: Json | null
          payment_type: string
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          metadata?: Json | null
          payment_type: string
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          metadata?: Json | null
          payment_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      product_recommendations: {
        Row: {
          affiliate_link: string | null
          brand: string
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_range: string | null
          rating: number | null
          skin_types: string[] | null
          target_issues: string[]
        }
        Insert: {
          affiliate_link?: string | null
          brand: string
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_range?: string | null
          rating?: number | null
          skin_types?: string[] | null
          target_issues?: string[]
        }
        Update: {
          affiliate_link?: string | null
          brand?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_range?: string | null
          rating?: number | null
          skin_types?: string[] | null
          target_issues?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accent_color: string | null
          avatar_url: string | null
          background_style: string | null
          country: string | null
          created_at: string
          display_name: string | null
          display_name_changed_at: string | null
          gender: string | null
          id: string
          theme: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          accent_color?: string | null
          avatar_url?: string | null
          background_style?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          display_name_changed_at?: string | null
          gender?: string | null
          id?: string
          theme?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          accent_color?: string | null
          avatar_url?: string | null
          background_style?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          display_name_changed_at?: string | null
          gender?: string | null
          id?: string
          theme?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          photo_type: string | null
          photo_url: string
          taken_at: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_type?: string | null
          photo_url: string
          taken_at?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_type?: string | null
          photo_url?: string
          taken_at?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      promo_code_redemptions: {
        Row: {
          id: string
          promo_code_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          promo_code_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          promo_code_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number | null
          duration_days: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          plan_type: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          plan_type: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          plan_type?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          calories_per_serving: number | null
          carbs_g: number | null
          category: string | null
          cook_time_minutes: number | null
          created_at: string
          created_by: string | null
          cuisine: string | null
          description: string | null
          difficulty: string | null
          fat_g: number | null
          fiber_g: number | null
          id: string
          image_url: string | null
          ingredients: Json | null
          instructions: string[] | null
          is_system: boolean | null
          name: string
          prep_time_minutes: number | null
          protein_g: number | null
          servings: number | null
          tags: string[] | null
        }
        Insert: {
          calories_per_serving?: number | null
          carbs_g?: number | null
          category?: string | null
          cook_time_minutes?: number | null
          created_at?: string
          created_by?: string | null
          cuisine?: string | null
          description?: string | null
          difficulty?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: string[] | null
          is_system?: boolean | null
          name: string
          prep_time_minutes?: number | null
          protein_g?: number | null
          servings?: number | null
          tags?: string[] | null
        }
        Update: {
          calories_per_serving?: number | null
          carbs_g?: number | null
          category?: string | null
          cook_time_minutes?: number | null
          created_at?: string
          created_by?: string | null
          cuisine?: string | null
          description?: string | null
          difficulty?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: string[] | null
          is_system?: boolean | null
          name?: string
          prep_time_minutes?: number | null
          protein_g?: number | null
          servings?: number | null
          tags?: string[] | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_referrer"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_referral_codes"
            referencedColumns: ["user_id"]
          },
        ]
      }
      refund_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          is_within_period: boolean
          payment_date: string
          payment_intent_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          request_date: string
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          currency?: string
          id?: string
          is_within_period?: boolean
          payment_date: string
          payment_intent_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          request_date?: string
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          is_within_period?: boolean
          payment_date?: string
          payment_intent_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          request_date?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_content_id: string | null
          reported_content_type: string
          reported_user_id: string | null
          reporter_id: string
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_content_id?: string | null
          reported_content_type: string
          reported_user_id?: string | null
          reporter_id: string
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_content_id?: string | null
          reported_content_type?: string
          reported_user_id?: string | null
          reporter_id?: string
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_recipes: {
        Row: {
          id: string
          recipe_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          id?: string
          recipe_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          id?: string
          recipe_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      settings_changelog: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_value: Json
          old_value: Json | null
          setting_key: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_value: Json
          old_value?: Json | null
          setting_key: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_value?: Json
          old_value?: Json | null
          setting_key?: string
        }
        Relationships: []
      }
      shared_challenge_participants: {
        Row: {
          challenge_id: string
          completed_at: string | null
          current_progress: number
          id: string
          is_completed: boolean
          joined_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          current_progress?: number
          id?: string
          is_completed?: boolean
          joined_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          current_progress?: number
          id?: string
          is_completed?: boolean
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "shared_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          creator_id: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          target_value: number | null
          title: string
          xp_reward: number
        }
        Insert: {
          challenge_type: string
          created_at?: string
          creator_id: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          start_date?: string
          target_value?: number | null
          title: string
          xp_reward?: number
        }
        Update: {
          challenge_type?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          target_value?: number | null
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          customer_email: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_email?: string | null
          id?: string
          plan_type: string
          status?: string
          stripe_customer_id: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_email?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      supplement_logs: {
        Row: {
          dosage: string | null
          id: string
          notes: string | null
          supplement_id: string | null
          taken_at: string
          user_id: string
        }
        Insert: {
          dosage?: string | null
          id?: string
          notes?: string | null
          supplement_id?: string | null
          taken_at?: string
          user_id: string
        }
        Update: {
          dosage?: string | null
          id?: string
          notes?: string | null
          supplement_id?: string | null
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_logs_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      supplements: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          default_dosage: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          default_dosage?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          default_dosage?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          attachment_urls: string[] | null
          category: string
          created_at: string
          description: string
          id: string
          is_priority: boolean
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          attachment_urls?: string[] | null
          category: string
          created_at?: string
          description: string
          id?: string
          is_priority?: boolean
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          attachment_urls?: string[] | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_priority?: boolean
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      transformation_submissions: {
        Row: {
          admin_notes: string | null
          after_analysis_id: string | null
          before_analysis_id: string | null
          description: string | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          score_after: number | null
          score_before: number | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          after_analysis_id?: string | null
          before_analysis_id?: string | null
          description?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score_after?: number | null
          score_before?: number | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          after_analysis_id?: string | null
          before_analysis_id?: string | null
          description?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score_after?: number | null
          score_before?: number | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transformation_submissions_after_analysis_id_fkey"
            columns: ["after_analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transformation_submissions_before_analysis_id_fkey"
            columns: ["before_analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
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
      user_calorie_settings: {
        Row: {
          activity_level: string | null
          birth_date: string | null
          calculated_bmr: number | null
          calculated_daily_calories: number | null
          calculated_tdee: number | null
          created_at: string | null
          current_weight_kg: number | null
          gender: string | null
          goal_type: string | null
          height_cm: number | null
          id: string
          target_weight_kg: number | null
          updated_at: string | null
          user_id: string
          weekly_goal_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          birth_date?: string | null
          calculated_bmr?: number | null
          calculated_daily_calories?: number | null
          calculated_tdee?: number | null
          created_at?: string | null
          current_weight_kg?: number | null
          gender?: string | null
          goal_type?: string | null
          height_cm?: number | null
          id?: string
          target_weight_kg?: number | null
          updated_at?: string | null
          user_id: string
          weekly_goal_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          birth_date?: string | null
          calculated_bmr?: number | null
          calculated_daily_calories?: number | null
          calculated_tdee?: number | null
          created_at?: string | null
          current_weight_kg?: number | null
          gender?: string | null
          goal_type?: string | null
          height_cm?: number | null
          id?: string
          target_weight_kg?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_goal_kg?: number | null
        }
        Relationships: []
      }
      user_challenge_progress: {
        Row: {
          assigned_date: string
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_date?: string
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_date?: string
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_email_preferences: {
        Row: {
          achievement_notifications: boolean
          challenge_reminders: boolean
          created_at: string
          id: string
          last_weekly_report_sent: string | null
          marketing_emails: boolean
          updated_at: string
          user_id: string
          weekly_report: boolean
        }
        Insert: {
          achievement_notifications?: boolean
          challenge_reminders?: boolean
          created_at?: string
          id?: string
          last_weekly_report_sent?: string | null
          marketing_emails?: boolean
          updated_at?: string
          user_id: string
          weekly_report?: boolean
        }
        Update: {
          achievement_notifications?: boolean
          challenge_reminders?: boolean
          created_at?: string
          id?: string
          last_weekly_report_sent?: string | null
          marketing_emails?: boolean
          updated_at?: string
          user_id?: string
          weekly_report?: boolean
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          achieved_at: string | null
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          target_date: string | null
          target_score: number
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          target_date?: string | null
          target_score: number
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          target_date?: string | null
          target_score?: number
          user_id?: string
        }
        Relationships: []
      }
      user_milestones: {
        Row: {
          achieved_at: string
          id: string
          milestone_key: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          id?: string
          milestone_key: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          id?: string
          milestone_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_motivation_logs: {
        Row: {
          id: string
          tip_id: string | null
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          tip_id?: string | null
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          tip_id?: string | null
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_motivation_logs_tip_id_fkey"
            columns: ["tip_id"]
            isOneToOne: false
            referencedRelation: "motivation_tips"
            referencedColumns: ["id"]
          },
        ]
      }
      user_referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sensitive_data: {
        Row: {
          created_at: string
          data_hash: string
          first_name_encrypted: string
          id: string
          last_name_encrypted: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_hash: string
          first_name_encrypted: string
          id?: string
          last_name_encrypted: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_hash?: string
          first_name_encrypted?: string
          id?: string
          last_name_encrypted?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sleep_goals: {
        Row: {
          created_at: string
          id: string
          reminder_enabled: boolean | null
          reminder_minutes_before: number | null
          target_bedtime: string | null
          target_hours: number
          target_waketime: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reminder_enabled?: boolean | null
          reminder_minutes_before?: number | null
          target_bedtime?: string | null
          target_hours?: number
          target_waketime?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reminder_enabled?: boolean | null
          reminder_minutes_before?: number | null
          target_bedtime?: string | null
          target_hours?: number
          target_waketime?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          category: string
          completed: boolean
          created_at: string
          description: string | null
          id: string
          priority: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          priority?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          priority?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_testimonials: {
        Row: {
          age: number | null
          analysis_id: string | null
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          is_approved: boolean
          is_featured: boolean
          score_after: number | null
          score_before: number | null
          star_rating: number | null
          testimonial_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          analysis_id?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          score_after?: number | null
          score_before?: number | null
          star_rating?: number | null
          testimonial_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          analysis_id?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          score_after?: number | null
          score_before?: number | null
          star_rating?: number | null
          testimonial_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_testimonials_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_weekly_challenges: {
        Row: {
          challenge_id: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string
          ends_at: string
          id: string
          progress: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          challenge_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          ends_at: string
          id?: string
          progress?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          progress?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_weekly_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_xp: {
        Row: {
          created_at: string
          current_xp: number
          id: string
          level: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_xp?: number
          id?: string
          level?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_xp?: number
          id?: string
          level?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string | null
          id: string
          logged_at: string | null
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string | null
          id?: string
          logged_at?: string | null
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string | null
          id?: string
          logged_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      water_reminders: {
        Row: {
          created_at: string | null
          daily_goal_liters: number | null
          end_time: string | null
          id: string
          is_enabled: boolean | null
          reminder_interval_hours: number | null
          start_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_goal_liters?: number | null
          end_time?: string | null
          id?: string
          is_enabled?: boolean | null
          reminder_interval_hours?: number | null
          start_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_goal_liters?: number | null
          end_time?: string | null
          id?: string
          is_enabled?: boolean | null
          reminder_interval_hours?: number | null
          start_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weekly_challenges: {
        Row: {
          category: string | null
          created_at: string
          description: string
          difficulty: string | null
          duration_days: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          difficulty?: string | null
          duration_days?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          difficulty?: string | null
          duration_days?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      account_deletion_tokens_safe: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string | null
          used: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          used?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          used?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_passwords_safe: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string | null
          last_changed_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          last_changed_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          last_changed_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_safe: {
        Row: {
          action_type: string | null
          actor_id: string | null
          created_at: string | null
          id: string | null
          metadata: Json | null
          record_id: string | null
          table_name: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type?: string | null
          actor_id?: string | null
          created_at?: string | null
          id?: string | null
          metadata?: never
          record_id?: string | null
          table_name?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string | null
          actor_id?: string | null
          created_at?: string | null
          id?: string | null
          metadata?: never
          record_id?: string | null
          table_name?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      failed_login_attempts_masked: {
        Row: {
          attempted_at: string | null
          created_at: string | null
          email_masked: string | null
          id: string | null
          ip_masked: string | null
        }
        Insert: {
          attempted_at?: string | null
          created_at?: string | null
          email_masked?: never
          id?: string | null
          ip_masked?: never
        }
        Update: {
          attempted_at?: string | null
          created_at?: string | null
          email_masked?: never
          id?: string | null
          ip_masked?: never
        }
        Relationships: []
      }
      mfa_backup_codes_safe: {
        Row: {
          created_at: string | null
          id: string | null
          used: boolean | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          used?: boolean | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          used?: boolean | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      product_recommendations_safe: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          name: string | null
          price_range: string | null
          rating: number | null
          skin_types: string[] | null
          target_issues: string[] | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          name?: string | null
          price_range?: string | null
          rating?: number | null
          skin_types?: string[] | null
          target_issues?: string[] | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          name?: string | null
          price_range?: string | null
          rating?: number | null
          skin_types?: string[] | null
          target_issues?: string[] | null
        }
        Relationships: []
      }
      user_testimonials_public: {
        Row: {
          age: number | null
          created_at: string | null
          display_name: string | null
          id: string | null
          is_approved: boolean | null
          is_featured: boolean | null
          score_after: number | null
          score_before: number | null
          star_rating: number | null
          testimonial_text: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          score_after?: number | null
          score_before?: number | null
          star_rating?: number | null
          testimonial_text?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          score_after?: number | null
          score_before?: number | null
          star_rating?: number | null
          testimonial_text?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_user_xp: {
        Args: { p_reason?: string; p_user_id: string; p_xp_amount: number }
        Returns: {
          leveled_up: boolean
          new_level: number
          new_xp: number
        }[]
      }
      can_change_display_name: {
        Args: { p_user_id: string }
        Returns: {
          allowed: boolean
          days_remaining: number
          next_change_date: string
        }[]
      }
      check_account_lockout: {
        Args: { _email: string }
        Returns: {
          failed_attempts: number
          is_locked: boolean
          remaining_seconds: number
        }[]
      }
      check_display_name_available: {
        Args: { p_current_user_id?: string; p_display_name: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          _action_type: string
          _max_actions?: number
          _time_window?: unknown
          _user_id: string
        }
        Returns: boolean
      }
      check_sensitive_rate_limit: {
        Args: {
          _action_type: string
          _max_actions?: number
          _time_window?: unknown
        }
        Returns: boolean
      }
      cleanup_old_login_attempts: { Args: never; Returns: number }
      cleanup_unconfirmed_users: {
        Args: never
        Returns: {
          deleted_count: number
        }[]
      }
      clear_failed_logins: { Args: { _email: string }; Returns: undefined }
      complete_challenge: {
        Args: { p_challenge_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
          xp_earned: number
        }[]
      }
      count_referrals: { Args: { p_user_id: string }; Returns: number }
      create_audit_log: {
        Args: {
          _action_type: string
          _actor_id: string
          _metadata?: Json
          _new_values: Json
          _old_values: Json
          _record_id: string
          _table_name: string
          _target_user_id: string
        }
        Returns: string
      }
      decrypt_sensitive_text: {
        Args: { encrypted_text: string; original_hint: string }
        Returns: string
      }
      encrypt_sensitive_text: { Args: { plain_text: string }; Returns: string }
      generate_backup_codes: {
        Args: { _count?: number; _user_id: string }
        Returns: string[]
      }
      generate_friend_code: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_admin_password_status: {
        Args: never
        Returns: {
          days_until_expiry: number
          has_password: boolean
          is_expired: boolean
          last_changed_at: string
        }[]
      }
      get_admin_users_password_status: {
        Args: never
        Returns: {
          days_until_expiry: number
          display_name: string
          email: string
          has_admin_password: boolean
          password_expired: boolean
          role: string
          user_id: string
        }[]
      }
      get_backup_codes_count: { Args: { _user_id: string }; Returns: number }
      get_daily_challenges: {
        Args: { p_user_id: string }
        Returns: {
          category: string
          challenge_id: string
          completed: boolean
          description: string
          difficulty: string
          icon: string
          title: string
          xp_reward: number
        }[]
      }
      get_expired_unconfirmed_user_ids: {
        Args: never
        Returns: {
          created_at: string
          email: string
          user_id: string
        }[]
      }
      get_my_sensitive_data: {
        Args: never
        Returns: {
          first_name: string
          last_name: string
        }[]
      }
      get_or_create_referral_code: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_owner_masked_email: { Args: never; Returns: string }
      get_pending_password_reset_requests: {
        Args: never
        Returns: {
          display_name: string
          email: string
          id: string
          requested_at: string
          role: string
          status: string
          user_id: string
        }[]
      }
      get_public_branding: {
        Args: never
        Returns: {
          app_logo_url: string
          app_name: string
          favicon_url: string
        }[]
      }
      get_unconfirmed_users_stats: {
        Args: never
        Returns: {
          confirmed: number
          expired_unconfirmed: number
          pending_confirmation: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_pending_password_reset_request: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_promo_code_usage: {
        Args: { promo_code_id: string }
        Returns: undefined
      }
      is_maintenance_mode: { Args: never; Returns: boolean }
      log_security_event: {
        Args: { _details?: Json; _event_type: string }
        Returns: undefined
      }
      record_failed_login: {
        Args: { _email: string; _ip_address?: string }
        Returns: {
          failed_attempts: number
          is_locked: boolean
          remaining_seconds: number
        }[]
      }
      record_referral: {
        Args: { p_new_user_id: string; p_referral_code: string }
        Returns: boolean
      }
      request_admin_password_reset: { Args: never; Returns: string }
      request_admin_password_reset_for_user: {
        Args: { _target_user_id: string }
        Returns: string
      }
      reset_admin_password_for_user: {
        Args: { _target_user_id: string }
        Returns: boolean
      }
      set_admin_password: { Args: { _password: string }; Returns: boolean }
      store_user_sensitive_data: {
        Args: { p_first_name: string; p_last_name: string }
        Returns: boolean
      }
      update_user_sensitive_data: {
        Args: { p_first_name: string; p_last_name: string }
        Returns: boolean
      }
      update_user_streak: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_streaks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_display_name: { Args: { p_name: string }; Returns: boolean }
      validate_promo_code: { Args: { p_code: string }; Returns: Json }
      verify_admin_password: {
        Args: { _password: string }
        Returns: {
          days_until_expiry: number
          is_expired: boolean
          is_valid: boolean
          needs_setup: boolean
        }[]
      }
      verify_admin_password_reset_token: {
        Args: { _token: string }
        Returns: boolean
      }
      verify_backup_code: {
        Args: { _code: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "user"
      friend_status: "pending" | "accepted" | "blocked"
      privacy_visibility: "none" | "delta_only" | "full"
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
      app_role: ["owner", "admin", "user"],
      friend_status: ["pending", "accepted", "blocked"],
      privacy_visibility: ["none", "delta_only", "full"],
    },
  },
} as const
