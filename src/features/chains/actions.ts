'use server'

import { createClient } from '@/lib/supabase/server'
import { sanitizeErrorMessage } from '@/lib/errors'
import { TaskRow } from '@/types'

export async function createQuestChain(title: string, description?: string) {
  if (!title || !title.trim()) {
    return { error: 'Quest chain title is required' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Authentication required' }
  }

  const { data: chain, error } = await supabase
    .from('quest_chains')
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    return { error: sanitizeErrorMessage(error) }
  }

  return { success: true, chain }
}

export async function addQuestToChain(chainId: string, taskId: string, stepOrder: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Authentication required' }
  }

  // Verify ownership of both chain and task
  const { data: chain } = await supabase
    .from('quest_chains')
    .select('id')
    .eq('id', chainId)
    .eq('user_id', user.id)
    .single()

  if (!chain) {
    return { error: 'Quest chain not found or access denied' }
  }

  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single()

  if (!task) {
    return { error: 'Task not found or access denied' }
  }

  const { data: chainTask, error } = await supabase
    .from('quest_chain_tasks')
    .insert({
      chain_id: chainId,
      task_id: taskId,
      step_order: stepOrder,
    })
    .select()
    .single()

  if (error) {
    return { error: sanitizeErrorMessage(error) }
  }

  return { success: true, chainTask }
}

export async function getQuestChains() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: chains } = await supabase
    .from('quest_chains')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!chains || chains.length === 0) return []

  const result = []

  for (const chain of chains) {
    const { data: chainTasks } = await supabase
      .from('quest_chain_tasks')
      .select('task_id, step_order')
      .eq('chain_id', chain.id)
      .order('step_order', { ascending: true })

    const taskIds = (chainTasks || []).map((ct) => ct.task_id)

    let tasksList: TaskRow[] = []
    if (taskIds.length > 0) {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .in('id', taskIds)
      
      const taskMap = new Map((tasks || []).map((t) => [t.id, t as TaskRow]))
      tasksList = taskIds.map((id) => taskMap.get(id)).filter((t): t is TaskRow => Boolean(t))
    }

    const completedCount = tasksList.filter((t) => t.status === 'completed').length
    const currentStage = Math.min(completedCount + 1, tasksList.length)

    result.push({
      ...chain,
      tasks: tasksList,
      totalSteps: tasksList.length,
      completedSteps: completedCount,
      currentStage,
      isCompleted: tasksList.length > 0 && completedCount === tasksList.length,
    })
  }

  return result
}
