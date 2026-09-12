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
      profiles: {
        Row: {
          id: string
          email: string | null
          password_hash: string | null
          username: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          password_hash?: string | null
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          password_hash?: string | null
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          id: string
          user_id: string
          name: string
          level: number
          xp: number
          gold: number
          strength: number
          intellect: number
          discipline: number
          vitality: number
          creativity: number
          current_streak: number
          longest_streak: number
          momentum: number
          archetype: string
          last_active_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          level?: number
          xp?: number
          gold?: number
          strength?: number
          intellect?: number
          discipline?: number
          vitality?: number
          creativity?: number
          current_streak?: number
          longest_streak?: number
          momentum?: number
          archetype?: string
          last_active_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          level?: number
          xp?: number
          gold?: number
          strength?: number
          intellect?: number
          discipline?: number
          vitality?: number
          creativity?: number
          current_streak?: number
          longest_streak?: number
          momentum?: number
          archetype?: string
          last_active_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string
          difficulty: 'easy' | 'medium' | 'hard' | 'epic'
          attribute: 'strength' | 'intellect' | 'discipline' | 'vitality' | 'creativity'
          status: 'active' | 'completed' | 'archived'
          base_xp: number
          base_gold: number
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category: string
          difficulty: 'easy' | 'medium' | 'hard' | 'epic'
          attribute: 'strength' | 'intellect' | 'discipline' | 'vitality' | 'creativity'
          status?: 'active' | 'completed' | 'archived'
          base_xp: number
          base_gold: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string
          difficulty?: 'easy' | 'medium' | 'hard' | 'epic'
          attribute?: 'strength' | 'intellect' | 'discipline' | 'vitality' | 'creativity'
          status?: 'active' | 'completed' | 'archived'
          base_xp?: number
          base_gold?: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      task_completions: {
        Row: {
          id: string
          user_id: string
          task_id: string
          xp_awarded: number
          gold_awarded: number
          attribute_stat_awarded: number
          completed_at: string
          completion_date: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          xp_awarded: number
          gold_awarded: number
          attribute_stat_awarded: number
          completed_at?: string
          completion_date?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          xp_awarded?: number
          gold_awarded?: number
          attribute_stat_awarded?: number
          completed_at?: string
          completion_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      items: {
        Row: {
          id: string
          name: string
          description: string
          category: 'theme' | 'badge' | 'frame' | 'effect'
          rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
          price: number
          asset_url: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: 'theme' | 'badge' | 'frame' | 'effect'
          rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
          price: number
          asset_url?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: 'theme' | 'badge' | 'frame' | 'effect'
          rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
          price?: number
          asset_url?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          user_id: string
          item_id: string
          is_equipped: boolean
          purchased_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          is_equipped?: boolean
          purchased_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          is_equipped?: boolean
          purchased_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          }
        ]
      }
      achievements: {
        Row: {
          id: string
          code: string
          title: string
          description: string
          badge_icon: string
          xp_reward: number
          gold_reward: number
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          title: string
          description: string
          badge_icon: string
          xp_reward?: number
          gold_reward?: number
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          title?: string
          description?: string
          badge_icon?: string
          xp_reward?: number
          gold_reward?: number
          created_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          }
        ]
      }
      quest_chains: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_chains_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      quest_chain_tasks: {
        Row: {
          id: string
          chain_id: string
          task_id: string
          step_order: number
        }
        Insert: {
          id?: string
          chain_id: string
          task_id: string
          step_order: number
        }
        Update: {
          id?: string
          chain_id?: string
          task_id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_chain_tasks_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "quest_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_chain_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_quest_rpc: {
        Args: { p_task_id: string }
        Returns: Json
      }
      purchase_item_rpc: {
        Args: { p_item_id: string }
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
}
