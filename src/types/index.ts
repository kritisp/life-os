import { Database } from './database'

export type AttributeType = 'strength' | 'intellect' | 'discipline' | 'vitality' | 'creativity'
export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'epic'
export type QuestStatus = 'active' | 'completed' | 'archived'
export type ItemCategory = 'theme' | 'badge' | 'frame' | 'effect'
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type Archetype =
  | 'The Builder'
  | 'The Scholar'
  | 'The Warrior'
  | 'The Creator'
  | 'The Disciplined'
  | 'The Strategist'
  | 'The Balanced'

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type CharacterRow = Database['public']['Tables']['characters']['Row']
export type TaskRow = Database['public']['Tables']['tasks']['Row']
export type TaskCompletionRow = Database['public']['Tables']['task_completions']['Row']
export type ItemRow = Database['public']['Tables']['items']['Row']
export type InventoryRow = Database['public']['Tables']['inventory']['Row']
export type AchievementRow = Database['public']['Tables']['achievements']['Row']
export type UserAchievementRow = Database['public']['Tables']['user_achievements']['Row']
export type QuestChainRow = Database['public']['Tables']['quest_chains']['Row']
export type QuestChainTaskRow = Database['public']['Tables']['quest_chain_tasks']['Row']

export interface BuildInfo {
  name: Archetype
  description: string
}

export interface QuestCompletionResult {
  success: boolean
  xpGained: number
  goldGained: number
  attributeGained: number
  attributeName: AttributeType
  previousLevel: number
  newLevel: number
  didLevelUp: boolean
  currentXp: number
  xpRequiredForNextLevel: number
  currentStreak: number
  longestStreak: number
  momentum: number
  build: BuildInfo
  newlyUnlockedAchievements: AchievementRow[]
}

export interface ItemPurchaseResult {
  success: boolean
  remainingGold: number
  inventoryItem: InventoryRow
  unlockedAchievement?: AchievementRow
}

export interface ServiceResult<T> {
  data: T | null
  error: string | null
}
