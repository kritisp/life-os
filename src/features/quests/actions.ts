'use server'

import { createClient } from '@/lib/supabase/server'
import {
  AttributeType,
  QuestDifficulty,
  QuestCompletionResult,
  AchievementRow,
  TaskRow,
  CharacterRow,
} from '@/types'
import { DIFFICULTY_CONFIG } from '@/lib/constants'
import {
  getLevelFromTotalXp,
  getXpProgress,
  calculateStreak,
  calculateMomentum,
  calculateArchetype,
} from '@/lib/engine/progression'
import {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  sanitizeErrorMessage,
} from '@/lib/errors'

export async function createTask(formData: FormData) {
  const title = ((formData.get('title') as string) || '').trim()
  const description = ((formData.get('description') as string) || '').trim()
  const category = ((formData.get('category') as string) || 'general').trim()
  const difficulty = (formData.get('difficulty') as QuestDifficulty) || 'medium'
  const attribute = (formData.get('attribute') as AttributeType) || 'intellect'

  if (!title) {
    return { error: 'Quest title is required' }
  }

  if (!['easy', 'medium', 'hard', 'epic'].includes(difficulty)) {
    return { error: 'Invalid difficulty tier' }
  }

  if (!['strength', 'intellect', 'discipline', 'vitality', 'creativity'].includes(attribute)) {
    return { error: 'Invalid attribute type' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Authentication required' }
  }

  const diffConfig = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      category,
      difficulty,
      attribute,
      status: 'active',
      base_xp: diffConfig.xp,
      base_gold: diffConfig.gold,
      is_archived: false,
    })
    .select()
    .single()

  if (error) {
    return { error: sanitizeErrorMessage(error) }
  }

  return { success: true, task: task as unknown as TaskRow }
}

export async function getTasks(statusFilter: 'all' | 'active' | 'completed' = 'active') {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  let query = supabase.from('tasks').select('*').eq('user_id', user.id)

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: tasks } = await query.order('created_at', { ascending: false })
  return (tasks as unknown as TaskRow[]) || []
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Authentication required' }
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) {
    return { error: sanitizeErrorMessage(error) }
  }

  return { success: true }
}

export async function completeQuest(taskId: string): Promise<QuestCompletionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new UnauthorizedError()
  }

  // 1. Attempt atomic database RPC function first
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'complete_quest_rpc' as unknown as 'complete_quest_rpc',
    { p_task_id: taskId } as unknown as { p_task_id: string }
  )

  if (!rpcError && rpcResult) {
    return rpcResult as unknown as QuestCompletionResult
  }

  // 2. Controlled server-side fallback execution
  const { data: rawTask, error: taskError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single()

  if (taskError || !rawTask) {
    throw new NotFoundError('Quest not found or access denied')
  }

  const task = rawTask as unknown as TaskRow

  if (task.status === 'completed') {
    throw new ValidationError('Quest is already completed')
  }

  // Prevent duplicate completion execution
  const { data: existingCompletion } = await supabase
    .from('task_completions')
    .select('id')
    .eq('task_id', taskId)
    .single()

  if (existingCompletion) {
    throw new ValidationError('Quest has already been completed')
  }

  // Fetch character
  const { data: rawCharacter, error: charError } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (charError || !rawCharacter) {
    throw new NotFoundError('Character record not found')
  }

  const character = rawCharacter as unknown as CharacterRow

  const difficulty = task.difficulty as QuestDifficulty
  const diffConfig = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium

  const xpGained = diffConfig.xp
  const goldGained = diffConfig.gold
  const statGained = diffConfig.statPoints
  const attributeName = task.attribute as AttributeType

  const previousLevel = character.level
  const currentXp = character.xp + xpGained
  const newLevel = getLevelFromTotalXp(currentXp)
  const didLevelUp = newLevel > previousLevel

  const updatedStats = {
    strength: character.strength + (attributeName === 'strength' ? statGained : 0),
    intellect: character.intellect + (attributeName === 'intellect' ? statGained : 0),
    discipline: character.discipline + (attributeName === 'discipline' ? statGained : 0),
    vitality: character.vitality + (attributeName === 'vitality' ? statGained : 0),
    creativity: character.creativity + (attributeName === 'creativity' ? statGained : 0),
  }

  const streakResult = calculateStreak(
    character.last_active_date,
    character.current_streak,
    character.longest_streak
  )

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { count: recentCompletionsCount } = await supabase
    .from('task_completions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('completion_date', sevenDaysAgo)

  const newMomentum = calculateMomentum((recentCompletionsCount || 0) + 1)
  const buildInfo = calculateArchetype(updatedStats)

  // Record completion log
  await supabase.from('task_completions').insert({
    user_id: user.id,
    task_id: taskId,
    xp_awarded: xpGained,
    gold_awarded: goldGained,
    attribute_stat_awarded: statGained,
    completion_date: new Date().toISOString().split('T')[0],
  })

  // Mark task completed
  await supabase
    .from('tasks')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', taskId)

  // Update character state
  await supabase
    .from('characters')
    .update({
      xp: currentXp,
      level: newLevel,
      gold: character.gold + goldGained,
      ...updatedStats,
      current_streak: streakResult.currentStreak,
      longest_streak: streakResult.longestStreak,
      momentum: newMomentum,
      archetype: buildInfo.name,
      last_active_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  // Achievement unlock evaluation
  const { count: totalCompletionsCount } = await supabase
    .from('task_completions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const totalCount = totalCompletionsCount || 1
  const newlyUnlockedAchievements: AchievementRow[] = []

  const achievementChecks = [
    { code: 'FIRST_QUEST', met: totalCount >= 1 },
    { code: 'STREAK_3', met: streakResult.currentStreak >= 3 },
    { code: 'STREAK_7', met: streakResult.currentStreak >= 7 },
    { code: 'QUESTS_10', met: totalCount >= 10 },
    { code: 'LEVEL_5', met: newLevel >= 5 },
  ]

  for (const check of achievementChecks) {
    if (check.met) {
      const { data: rawAchievement } = await supabase
        .from('achievements')
        .select('*')
        .eq('code', check.code)
        .single()

      if (rawAchievement) {
        const achievement = rawAchievement as unknown as AchievementRow
        const { data: existingUnlock } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', user.id)
          .eq('achievement_id', achievement.id)
          .single()

        if (!existingUnlock) {
          await supabase.from('user_achievements').insert({
            user_id: user.id,
            achievement_id: achievement.id,
          })
          newlyUnlockedAchievements.push(achievement)
        }
      }
    }
  }

  const xpProgress = getXpProgress(currentXp)

  return {
    success: true,
    xpGained,
    goldGained,
    attributeGained: statGained,
    attributeName,
    previousLevel,
    newLevel,
    didLevelUp,
    currentXp,
    xpRequiredForNextLevel: xpProgress.nextLevelXp,
    currentStreak: streakResult.currentStreak,
    longestStreak: streakResult.longestStreak,
    momentum: newMomentum,
    build: buildInfo,
    newlyUnlockedAchievements,
  }
}
