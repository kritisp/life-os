import { AttributeType, QuestDifficulty } from '@/types'

export const APP_NAME = 'LIFE//OS'
export const TAGLINE = 'Gamify progress. Not guilt.'

export const ATTRIBUTE_CONFIG: Record<
  AttributeType,
  {
    name: string
    code: AttributeType
    description: string
    color: string
    bgLight: string
    border: string
    icon: string
  }
> = {
  strength: {
    name: 'Strength',
    code: 'strength',
    description: 'Gym, resistance training, physical force, physical labor',
    color: 'text-rose-400',
    bgLight: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: 'Dumbbell',
  },
  intellect: {
    name: 'Intellect',
    code: 'intellect',
    description: 'Coding, studying, technical reading, logic, problem solving',
    color: 'text-cyan-400',
    bgLight: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: 'Brain',
  },
  discipline: {
    name: 'Discipline',
    code: 'discipline',
    description: 'Meditation, morning routines, habit consistency, sleep order',
    color: 'text-amber-400',
    bgLight: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'Shield',
  },
  vitality: {
    name: 'Vitality',
    code: 'vitality',
    description: 'Running, cardio, movement, hydration, active recovery',
    color: 'text-emerald-400',
    bgLight: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: 'HeartPulse',
  },
  creativity: {
    name: 'Creativity',
    code: 'creativity',
    description: 'Writing, UI design, music composition, digital art, crafting',
    color: 'text-purple-400',
    bgLight: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: 'Sparkles',
  },
}

export const DIFFICULTY_CONFIG: Record<
  QuestDifficulty,
  {
    label: string
    xp: number
    gold: number
    statPoints: number
    color: string
    badgeClass: string
  }
> = {
  easy: {
    label: 'Easy',
    xp: 50,
    gold: 20,
    statPoints: 1,
    color: 'text-slate-300',
    badgeClass: 'bg-slate-800/80 text-slate-300 border-slate-700',
  },
  medium: {
    label: 'Medium',
    xp: 100,
    gold: 45,
    statPoints: 2,
    color: 'text-cyan-400',
    badgeClass: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/50',
  },
  hard: {
    label: 'Hard',
    xp: 200,
    gold: 100,
    statPoints: 4,
    color: 'text-amber-400',
    badgeClass: 'bg-amber-950/60 text-amber-400 border-amber-800/50',
  },
  epic: {
    label: 'Epic',
    xp: 500,
    gold: 250,
    statPoints: 10,
    color: 'text-purple-400',
    badgeClass: 'bg-purple-950/60 text-purple-400 border-purple-800/50',
  },
}

/**
 * Level progression formula:
 * XP required for level N = 100 * (N ^ 1.5)
 */
export function getXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.floor(100 * Math.pow(level, 1.5))
}
