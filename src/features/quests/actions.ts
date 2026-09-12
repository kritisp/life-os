'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/features/auth/actions'
import {
  AttributeType,
  QuestDifficulty,
  QuestCompletionResult,
  TaskRow,
} from '@/types'
import { DIFFICULTY_CONFIG } from '@/lib/constants'
import {
  UnauthorizedError,
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

  if (title.length > 200) {
    return { error: 'Quest title must be 200 characters or fewer' }
  }

  if (!['easy', 'medium', 'hard', 'epic'].includes(difficulty)) {
    return { error: 'Invalid difficulty tier' }
  }

  if (!['strength', 'intellect', 'discipline', 'vitality', 'creativity'].includes(attribute)) {
    return { error: 'Invalid attribute type' }
  }

  const supabase = await createClient()
  const user = await getCurrentUser()

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
  const user = await getCurrentUser()

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
  const user = await getCurrentUser()

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

/**
 * Authoritative single-path quest completion.
 * Calls atomic complete_quest_rpc in PostgreSQL. No manual or competing fallback mutations.
 */
export async function completeQuest(taskId: string): Promise<QuestCompletionResult> {
  if (!taskId || typeof taskId !== 'string') {
    throw new ValidationError('Valid Task ID is required')
  }

  const user = await getCurrentUser()
  if (!user) {
    throw new UnauthorizedError()
  }

  const supabase = await createClient()

  // Execute atomic PostgreSQL RPC procedure with verified session identity
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'complete_quest_rpc' as unknown as 'complete_quest_rpc',
    { p_task_id: taskId, p_user_id: user.id } as unknown as { p_task_id: string; p_user_id: string }
  )

  if (rpcError || !rpcResult) {
    const safeMsg = rpcError ? sanitizeErrorMessage(rpcError) : 'Failed to process quest completion'
    throw new Error(safeMsg)
  }

  return rpcResult as unknown as QuestCompletionResult
}
