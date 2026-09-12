import { BuildInfo } from '@/types'
import { getXpRequiredForLevel } from '@/lib/constants'

export { getXpRequiredForLevel }

/**
 * Returns level number for a given total XP amount.
 */
export function getLevelFromTotalXp(totalXp: number): number {
  let level = 1
  while (totalXp >= getXpRequiredForLevel(level + 1)) {
    level++
  }
  return level
}

/**
 * Returns detailed XP progress breakdown for rendering progress bars.
 */
export function getXpProgress(totalXp: number): {
  level: number
  currentLevelXp: number
  nextLevelXp: number
  progressPercentage: number
} {
  const level = getLevelFromTotalXp(totalXp)
  const prevLevelXp = getXpRequiredForLevel(level)
  const nextLevelXp = getXpRequiredForLevel(level + 1)
  
  const currentLevelXp = Math.max(0, totalXp - prevLevelXp)
  const xpNeededForNextLevel = nextLevelXp - prevLevelXp
  
  const progressPercentage = xpNeededForNextLevel > 0
    ? Math.min(100, Math.max(0, Math.round((currentLevelXp / xpNeededForNextLevel) * 100)))
    : 100

  return {
    level,
    currentLevelXp,
    nextLevelXp: xpNeededForNextLevel,
    progressPercentage,
  }
}

/**
 * Deterministically classifies character build archetype based on attribute distribution.
 */
export function calculateArchetype(stats: {
  strength: number
  intellect: number
  discipline: number
  vitality: number
  creativity: number
}): BuildInfo {
  const { strength, intellect, discipline, vitality, creativity } = stats

  if (intellect >= 30 && creativity >= 30 && intellect >= strength) {
    return {
      name: 'The Builder',
      description: 'Master of technical architecture and creative systems',
    }
  }
  if (intellect >= 30 && discipline >= 30) {
    return {
      name: 'The Scholar',
      description: 'Relentless seeker of deep knowledge and systematic mastery',
    }
  }
  if (strength >= 30 && vitality >= 30) {
    return {
      name: 'The Warrior',
      description: 'Unstoppable physical titan powered by endurance and strength',
    }
  }
  if (creativity >= 30 && discipline >= 25) {
    return {
      name: 'The Creator',
      description: 'Prolific artisan transforming ideas into disciplined output',
    }
  }
  if (discipline >= 40) {
    return {
      name: 'The Disciplined',
      description: 'Monk-like operator defined by unwavering habit adherence',
    }
  }
  if (intellect >= 25 && strength >= 25 && discipline >= 25) {
    return {
      name: 'The Strategist',
      description: 'Tactical polymath balancing mental acuity with physical force',
    }
  }

  return {
    name: 'The Balanced',
    description: 'Versatile operator developing across all core attributes',
  }
}

/**
 * Timezone-conscious calendar date streak calculator.
 */
export function calculateStreak(
  lastActiveDateStr: string | null,
  currentStreak: number,
  longestStreak: number,
  now: Date = new Date()
): { currentStreak: number; longestStreak: number; isFirstToday: boolean } {
  const todayStr = now.toISOString().split('T')[0]

  if (!lastActiveDateStr) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(longestStreak, 1),
      isFirstToday: true,
    }
  }

  const lastActiveDate = new Date(lastActiveDateStr)
  const todayDate = new Date(todayStr)

  // Difference in calendar days
  const diffTime = todayDate.getTime() - lastActiveDate.getTime()
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24))

  if (diffDays === 0) {
    // Completed another quest on the same day -> streak does not increment
    return {
      currentStreak,
      longestStreak,
      isFirstToday: false,
    }
  } else if (diffDays === 1) {
    // Completed on consecutive day -> increment streak
    const newStreak = currentStreak + 1
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
      isFirstToday: true,
    }
  } else {
    // Missed 1 or more days -> reset active streak to 1
    return {
      currentStreak: 1,
      longestStreak: Math.max(longestStreak, 1),
      isFirstToday: true,
    }
  }
}

/**
 * Calculates a rolling momentum index (bounded 0 to 100).
 */
export function calculateMomentum(recentCompletionsInLast7Days: number): number {
  // Base scale: 1 completion/day average (7 completions) = 70% momentum
  // 10+ completions in 7 days = 100% momentum
  return Math.min(100, Math.max(0, recentCompletionsInLast7Days * 12))
}
