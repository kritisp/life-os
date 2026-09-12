import {
  getLevelFromTotalXp,
  getXpRequiredForLevel,
  getXpProgress,
  calculateArchetype,
  calculateStreak,
  calculateMomentum,
} from './engine/progression'

export function runBackendTestSuite() {
  const results: { test: string; passed: boolean; details?: string }[] = []

  // 1. Leveling Formula Tests
  try {
    const level1Xp = getXpRequiredForLevel(1) // 0
    const level2Xp = getXpRequiredForLevel(2) // 100 * 2^1.5 = 282.84 -> 282
    const level3Xp = getXpRequiredForLevel(3) // 100 * 3^1.5 = 519.6 -> 519

    const derivedLevel0 = getLevelFromTotalXp(0)
    const derivedLevel50 = getLevelFromTotalXp(50)
    const derivedLevel290 = getLevelFromTotalXp(290)

    const passed =
      level1Xp === 0 &&
      level2Xp === 282 &&
      level3Xp === 519 &&
      derivedLevel0 === 1 &&
      derivedLevel50 === 1 &&
      derivedLevel290 === 2

    results.push({
      test: 'Nonlinear Level Formula (100 * N^1.5)',
      passed,
      details: `L1: ${level1Xp}, L2: ${level2Xp}, XP 290 -> Level ${derivedLevel290}`,
    })
  } catch (err: unknown) {
    results.push({
      test: 'Nonlinear Level Formula',
      passed: false,
      details: String(err),
    })
  }

  // 2. XP Progress Percentage Tests
  try {
    const progress = getXpProgress(141) // Halfway to level 2
    const passed = progress.level === 1 && progress.currentLevelXp === 141 && progress.progressPercentage === 50

    results.push({
      test: 'XP Progress Breakdown & Percentage',
      passed,
      details: `Progress: ${progress.progressPercentage}% (${progress.currentLevelXp}/${progress.nextLevelXp})`,
    })
  } catch (err: unknown) {
    results.push({
      test: 'XP Progress Breakdown',
      passed: false,
      details: String(err),
    })
  }

  // 3. Build Archetype Classification Tests
  try {
    const builderBuild = calculateArchetype({
      strength: 10,
      intellect: 35,
      discipline: 15,
      vitality: 10,
      creativity: 35,
    })

    const warriorBuild = calculateArchetype({
      strength: 35,
      intellect: 10,
      discipline: 15,
      vitality: 35,
      creativity: 10,
    })

    const passed = builderBuild.name === 'The Builder' && warriorBuild.name === 'The Warrior'

    results.push({
      test: 'Deterministic Build Archetype Classification',
      passed,
      details: `Stats INT 35 + CRE 35 -> ${builderBuild.name}; STR 35 + VIT 35 -> ${warriorBuild.name}`,
    })
  } catch (err: unknown) {
    results.push({
      test: 'Build Classification',
      passed: false,
      details: String(err),
    })
  }

  // 4. Streak Calculation Tests
  try {
    const today = new Date('2026-09-12')
    const streakConsecutive = calculateStreak('2026-09-11', 5, 5, today)
    const streakSameDay = calculateStreak('2026-09-12', 5, 5, today)
    const streakBroken = calculateStreak('2026-09-09', 5, 5, today)

    const passed =
      streakConsecutive.currentStreak === 6 &&
      streakSameDay.currentStreak === 5 &&
      streakBroken.currentStreak === 1

    results.push({
      test: 'Timezone-Conscious Streak Engine',
      passed,
      details: `Consecutive: ${streakConsecutive.currentStreak}, Same Day: ${streakSameDay.currentStreak}, Missed: ${streakBroken.currentStreak}`,
    })
  } catch (err: unknown) {
    results.push({
      test: 'Streak Engine',
      passed: false,
      details: String(err),
    })
  }

  // 5. Momentum Index Tests
  try {
    const momentum0 = calculateMomentum(0)
    const momentum5 = calculateMomentum(5)
    const momentum10 = calculateMomentum(10)

    const passed = momentum0 === 0 && momentum5 === 60 && momentum10 === 100

    results.push({
      test: 'Bounded Recent Momentum Score (0-100%)',
      passed,
      details: `0 comps: ${momentum0}%, 5 comps: ${momentum5}%, 10 comps: ${momentum10}%`,
    })
  } catch (err: unknown) {
    results.push({
      test: 'Momentum Score',
      passed: false,
      details: String(err),
    })
  }

  return results
}
