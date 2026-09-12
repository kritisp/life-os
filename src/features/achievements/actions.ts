'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/features/auth/actions'
import { sanitizeErrorMessage } from '@/lib/errors'
import { AchievementRow } from '@/types'

export async function getAchievements() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const { data: achievements, error } = await supabase
    .from('achievements')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(sanitizeErrorMessage(error))
  }

  const achievementList = (achievements as unknown as AchievementRow[]) || []

  if (!user) {
    return achievementList.map((ach) => ({
      ...ach,
      isUnlocked: false,
      unlockedAt: null,
    }))
  }

  const { data: userUnlocks } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', user.id)

  const unlocksList = (userUnlocks as unknown as { achievement_id: string; unlocked_at: string }[]) || []

  const unlockedMap = new Map(
    unlocksList.map((u) => [u.achievement_id, u.unlocked_at])
  )

  return achievementList.map((ach) => ({
    ...ach,
    isUnlocked: unlockedMap.has(ach.id),
    unlockedAt: unlockedMap.get(ach.id) || null,
  }))
}
