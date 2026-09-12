import { Archetype } from '@/types'
import { getXpRequiredForLevel } from './constants'

/**
 * Calculates current level and relative XP within current level from total accumulated XP.
 * Formula: Required XP for Level N = 100 * N^1.5
 */
export function calculateLevelFromXp(totalXp: number): {
  level: number
  currentLevelXp: number
  nextLevelXp: number
  progressPercentage: number
} {
  let level = 1
  while (totalXp >= getXpRequiredForLevel(level + 1)) {
    level++
  }

  const prevLevelXp = getXpRequiredForLevel(level)
  const nextLevelXp = getXpRequiredForLevel(level + 1)
  const xpInCurrentLevel = Math.max(0, totalXp - prevLevelXp)
  const xpNeededForNextLevel = nextLevelXp - prevLevelXp

  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100))
  )

  return {
    level,
    currentLevelXp: xpInCurrentLevel,
    nextLevelXp: xpNeededForNextLevel,
    progressPercentage,
  }
}

/**
 * Determines character archetype based on attribute distribution.
 * Pure deterministic formula.
 */
export function calculateArchetype(stats: {
  strength: number
  intellect: number
  discipline: number
  vitality: number
  creativity: number
}): Archetype {
  const { strength, intellect, discipline, vitality, creativity } = stats

  if (intellect >= 30 && creativity >= 30 && intellect >= strength) {
    return 'The Builder'
  }
  if (intellect >= 30 && discipline >= 30) {
    return 'The Scholar'
  }
  if (strength >= 30 && vitality >= 30) {
    return 'The Warrior'
  }
  if (creativity >= 30 && discipline >= 25) {
    return 'The Creator'
  }
  if (discipline >= 40) {
    return 'The Disciplined'
  }
  if (intellect >= 25 && strength >= 25 && discipline >= 25) {
    return 'The Strategist'
  }

  return 'The Balanced'
}

/**
 * Formats a date to ISO string date portion YYYY-MM-DD
 */
export function toISODateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}
