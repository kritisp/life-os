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
          username: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
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
          base_xp?: number
          base_gold?: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
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
      }
      items: {
        Row: {
          id: string
          name: string
          description: string
          category: 'theme' | 'badge' | 'frame' | 'effect'
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
          price?: number
          asset_url?: string | null
          metadata?: Json
          created_at?: string
        }
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
      }
    }
  }
}
