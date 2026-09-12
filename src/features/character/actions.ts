'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/features/auth/actions'
import { CharacterRow, AttributeType, Archetype } from '@/types'

export interface AttributeMomentumItem {
  attribute: AttributeType
  label: string
  pointsGained: number
  recentCompletionsCount: number
  percentage: number
}

export interface ProgressProofData {
  character: CharacterRow
  totalQuestsCompleted: number
  totalXp: number
  currentStreak: number
  longestStreak: number
  momentum: number
  topAttribute: { name: string; val: number; code: AttributeType }
  secondaryAttribute: { name: string; val: number; code: AttributeType }
  levelGrowth: number
  attributeMomentum: AttributeMomentumItem[]
  buildExplanation: string
  buildEvolution: {
    origin: { name: string; stats: Record<AttributeType, number> }
    current: { name: Archetype; stats: Record<AttributeType, number> }
  }
  recoveryStatus: {
    isReturning: boolean
    message: string
  }
}

export async function getCharacterTelemetry(): Promise<ProgressProofData | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  // 1. Fetch character
  const { data: rawCharacter } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!rawCharacter) return null
  const character = rawCharacter as CharacterRow

  // 2. Total quest completions count
  const { count: totalCompletionsCount } = await supabase
    .from('task_completions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const totalQuestsCompleted = totalCompletionsCount || 0

  // 3. Fetch recent completions to determine attribute momentum
  const { data: recentCompletions } = await supabase
    .from('task_completions')
    .select('task_id, tasks(attribute)')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(30)

  const attrCounts: Record<AttributeType, number> = {
    strength: 0,
    intellect: 0,
    discipline: 0,
    vitality: 0,
    creativity: 0,
  }

  if (recentCompletions) {
    for (const comp of recentCompletions) {
      const taskData = comp.tasks as unknown as { attribute?: AttributeType } | null
      if (taskData?.attribute && attrCounts[taskData.attribute] !== undefined) {
        attrCounts[taskData.attribute]++
      }
    }
  }

  // Calculate points gained above baseline 10
  const statList: { code: AttributeType; label: string; val: number; gained: number }[] = [
    { code: 'intellect' as AttributeType, label: 'Intellect', val: character.intellect, gained: Math.max(0, character.intellect - 10) },
    { code: 'strength' as AttributeType, label: 'Strength', val: character.strength, gained: Math.max(0, character.strength - 10) },
    { code: 'discipline' as AttributeType, label: 'Discipline', val: character.discipline, gained: Math.max(0, character.discipline - 10) },
    { code: 'creativity' as AttributeType, label: 'Creativity', val: character.creativity, gained: Math.max(0, character.creativity - 10) },
    { code: 'vitality' as AttributeType, label: 'Vitality', val: character.vitality, gained: Math.max(0, character.vitality - 10) },
  ].sort((a, b) => b.val - a.val)

  const topAttribute = { name: statList[0].label, val: statList[0].val, code: statList[0].code }
  const secondaryAttribute = { name: statList[1].label, val: statList[1].val, code: statList[1].code }

  const maxRecentCount = Math.max(...Object.values(attrCounts), 1)
  const attributeMomentum: AttributeMomentumItem[] = statList.map((s) => ({
    attribute: s.code,
    label: s.label,
    pointsGained: s.gained,
    recentCompletionsCount: attrCounts[s.code] || 0,
    percentage: Math.min(100, Math.round(((attrCounts[s.code] || 0) / maxRecentCount) * 100)),
  }))

  // Deterministic Build Explanation based on actual stored stats
  let buildExplanation = `Your recent actions are weighted toward ${topAttribute.name} (${topAttribute.val} pts) and ${secondaryAttribute.name} (${secondaryAttribute.val} pts).`
  if (topAttribute.val === 10 && secondaryAttribute.val === 10) {
    buildExplanation = 'Your baseline attributes are evenly balanced at 10 across all domains.'
  } else if (character.archetype === 'The Builder') {
    buildExplanation = `Your high investment in ${topAttribute.name} and ${secondaryAttribute.name} shapes a Builder profile focused on technical construction and systems.`
  } else if (character.archetype === 'The Scholar') {
    buildExplanation = `Your dominant focus on ${topAttribute.name} (${topAttribute.val} pts) defines a Scholar profile specializing in deep learning and analysis.`
  } else if (character.archetype === 'The Strategist') {
    buildExplanation = `Your balanced execution across ${topAttribute.name} and ${secondaryAttribute.name} produces a Strategist profile combining foresight with habit discipline.`
  } else if (character.archetype === 'The Warrior') {
    buildExplanation = `Your physical commitments to ${topAttribute.name} produce a Warrior build focused on physical strength and stamina.`
  } else if (character.archetype === 'The Creator') {
    buildExplanation = `Your active creative pursuits in ${topAttribute.name} shape a Creator build turning raw concepts into tangible output.`
  } else if (character.archetype === 'The Disciplined') {
    buildExplanation = `Your consistent habit consistency in ${topAttribute.name} defines a Disciplined operator focused on structured routine.`
  }

  // Recovery without guilt detection
  let isReturning = false
  if (character.last_active_date) {
    const lastActive = new Date(character.last_active_date)
    const today = new Date()
    const diffDays = Math.round((today.getTime() - lastActive.getTime()) / (1000 * 3600 * 24))
    if (diffDays >= 2) {
      isReturning = true
    }
  }

  return {
    character,
    totalQuestsCompleted,
    totalXp: character.xp,
    currentStreak: character.current_streak,
    longestStreak: character.longest_streak,
    momentum: character.momentum,
    topAttribute,
    secondaryAttribute,
    levelGrowth: Math.max(0, character.level - 1),
    attributeMomentum,
    buildExplanation,
    buildEvolution: {
      origin: {
        name: 'The Balanced',
        stats: { strength: 10, intellect: 10, discipline: 10, vitality: 10, creativity: 10 },
      },
      current: {
        name: character.archetype as Archetype,
        stats: {
          strength: character.strength,
          intellect: character.intellect,
          discipline: character.discipline,
          vitality: character.vitality,
          creativity: character.creativity,
        },
      },
    },
    recoveryStatus: {
      isReturning,
      message: 'Complete one small quest to restart your momentum.',
    },
  }
}
