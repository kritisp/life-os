'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Zap,
  Flame,
  Award,
  Swords,
  ArrowUpRight,
  Trophy,
} from 'lucide-react'
import { getCharacter } from '@/features/auth/actions'
import { getAchievements } from '@/features/achievements/actions'
import { getQuestChains } from '@/features/chains/actions'
import { CharacterRow, AchievementRow, QuestChainWithDetails } from '@/types'
import { getXpProgress } from '@/lib/engine/progression'
import { BuildReflectionModal } from '@/components/ui/Modals'
import { AnimatedNumber, StaggerContainer, StaggerItem, PulseGlow } from '@/components/ui/Motion'
import { CharacterSkeleton } from '@/components/ui/Skeletons'

interface AchievementItem extends AchievementRow {
  isUnlocked: boolean
  unlockedAt: string | null
}

export default function CharacterPage() {
  const [character, setCharacter] = useState<CharacterRow | null>(null)
  const [achievements, setAchievements] = useState<AchievementItem[]>([])
  const [chains, setChains] = useState<QuestChainWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showReflection, setShowReflection] = useState(false)
  const [hoveredAttr, setHoveredAttr] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    Promise.all([getCharacter(), getAchievements(), getQuestChains()]).then(
      ([charData, achData, chainData]) => {
        if (isMounted) {
          setCharacter(charData)
          setAchievements(achData)
          setChains(chainData)
          setLoading(false)
        }
      }
    )
    return () => {
      isMounted = false
    }
  }, [])

  if (loading || !character) {
    return <CharacterSkeleton />
  }

  const xpProgress = getXpProgress(character.xp)

  const attributes = [
    {
      short: 'STR',
      name: 'Strength',
      val: character.strength,
      detail: 'Gym, resistance training, physical power',
    },
    {
      short: 'INT',
      name: 'Intellect',
      val: character.intellect,
      detail: 'Coding, studying, technical reading, logic',
    },
    {
      short: 'DISC',
      name: 'Discipline',
      val: character.discipline,
      detail: 'Meditation, morning routines, order',
    },
    {
      short: 'VIT',
      name: 'Vitality',
      val: character.vitality,
      detail: 'Running, movement, hydration, recovery',
    },
    {
      short: 'CRE',
      name: 'Creativity',
      val: character.creativity,
      detail: 'Writing, UI design, music, crafting',
    },
  ]

  const unlockedAchievements = achievements.filter((a) => a.isUnlocked)
  const activeChain = chains[0]

  return (
    <StaggerContainer className="space-y-6">
      {/* Hero Header */}
      <StaggerItem>
        <div className="hero-heading">
          <div>
            <p className="eyebrow">CHARACTER PROGRESSION · TODAY</p>
            <h1>
              SEE WHO YOU&apos;RE <em>BECOMING.</em>
            </h1>
          </div>
          <button className="quick-add group" onClick={() => setShowReflection(true)}>
            <Sparkles size={15} className="group-hover:rotate-12 transition-transform duration-200" />
            REFLECT ON THIS BUILD
          </button>
        </div>
      </StaggerItem>

      {/* Level Banner */}
      <StaggerItem>
        <section className="level-banner panel relative overflow-hidden" aria-labelledby="level-title">
          <PulseGlow className="level-orbit shrink-0" aria-hidden="true">
            <AnimatedNumber value={xpProgress.level} className="font-mono text-4xl" />
            <i />
            <i />
            <i />
          </PulseGlow>

          <div className="level-copy flex-1">
            <p className="eyebrow">CURRENT LEVEL</p>
            <h2 id="level-title">
              LEVEL <AnimatedNumber value={xpProgress.level} />
            </h2>
            <p>Every completed quest becomes part of your character evolution.</p>

            <div className="xp-line font-mono text-xs">
              <span>
                <AnimatedNumber value={xpProgress.currentLevelXp} suffix=" XP" />
              </span>
              <span>{xpProgress.nextLevelXp} XP</span>
            </div>

            <div
              className="progress-track overflow-hidden relative"
              role="progressbar"
              aria-valuenow={xpProgress.progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div
                className="progress-fill h-full bg-[#d7a646]"
                initial={{ width: '0%' }}
                animate={{ width: `${xpProgress.progressPercentage}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            <small className="font-mono text-[10px]">
              <AnimatedNumber value={xpProgress.nextLevelXp - xpProgress.currentLevelXp} /> XP TO LEVEL{' '}
              {xpProgress.level + 1}
            </small>
          </div>

          <div className="build-stamp group cursor-pointer" onClick={() => setShowReflection(true)}>
            <div className="flex items-center gap-1.5">
              <span>CURRENT BUILD</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#d7a646] animate-pulse" />
            </div>
            <strong className="group-hover:text-amber-300 transition-colors">
              {character.archetype.toUpperCase()}
            </strong>
            <em>
              Determined by real-world
              <br />
              attribute distribution
            </em>
          </div>
        </section>
      </StaggerItem>

      {/* Progression Grid */}
      <div className="progression-grid">
        <StaggerItem>
          <section className="panel attributes-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR CAPABILITIES</p>
                <h2>ATTRIBUTES</h2>
              </div>
              <span className="panel-code">STAT MATRIX</span>
            </div>

            <div className="attribute-list">
              {attributes.map(({ short, name, val, detail }) => {
                const isHovered = hoveredAttr === short
                return (
                  <div
                    className={`progression-attribute transition-colors duration-150 p-2.5 -mx-2.5 rounded ${
                      isHovered ? 'bg-[#171b1d]' : ''
                    }`}
                    key={short}
                    onMouseEnter={() => setHoveredAttr(short)}
                    onMouseLeave={() => setHoveredAttr(null)}
                  >
                    <div className="attribute-top">
                      <span
                        className={`attribute-name font-mono font-bold transition-colors ${
                          isHovered ? 'text-amber-300 scale-105' : 'text-[#d7a646]'
                        }`}
                      >
                        {short}
                      </span>
                      <div className="attribute-label">
                        <strong className="text-[#cfd1c7]">{name}</strong>
                        <small className="text-[#697373]">{detail}</small>
                      </div>
                      <b className="font-mono text-[#d7a646]">
                        <AnimatedNumber value={val} suffix=" STATS" />
                      </b>
                    </div>
                    <div className="attribute-track">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${Math.min(100, (val / 100) * 100)}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full ${
                          isHovered
                            ? 'bg-gradient-to-r from-[#83652c] to-[#e6b84c]'
                            : 'bg-gradient-to-r from-[#83652c] to-[#d7a646]'
                        }`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </StaggerItem>

        <aside className="side-progression">
          <StaggerItem>
            <section className="panel rhythm-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">YOUR RHYTHM</p>
                  <h2>MOMENTUM</h2>
                </div>
                <PulseGlow>
                  <Zap size={18} className="amber-icon" />
                </PulseGlow>
              </div>

              <div className="rhythm-stats">
                <div>
                  <strong>
                    <AnimatedNumber value={character.current_streak} />
                  </strong>
                  <span>
                    CURRENT
                    <br />
                    STREAK
                  </span>
                </div>
                <div>
                  <strong>
                    <AnimatedNumber value={character.longest_streak} />
                  </strong>
                  <span>
                    LONGEST
                    <br />
                    STREAK
                  </span>
                </div>
                <div>
                  <strong>
                    <AnimatedNumber value={character.momentum} suffix="%" />
                  </strong>
                  <span>
                    MOMENTUM
                    <br />
                    INDEX
                  </span>
                </div>
              </div>

              <div className="rhythm-note">
                <Flame size={15} className="animate-bounce" /> You&apos;re building a pattern worth keeping.
              </div>
            </section>
          </StaggerItem>

          <StaggerItem>
            <section className="panel title-panel">
              <Award size={18} className="shrink-0" />
              <div>
                <p className="eyebrow">ACTIVE TITLE</p>
                <h3 className="font-mono text-sm">ARCHITECT OF MOMENTUM</h3>
                <span className="font-mono text-xs">Level {xpProgress.level} Operator</span>
              </div>
            </section>
          </StaggerItem>
        </aside>
      </div>

      {/* Lower Grid */}
      <div className="lower-grid progression-lower">
        <StaggerItem>
          <section className="lower-panel panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">RECENT PROOF</p>
                <h2>ACHIEVEMENTS ({unlockedAchievements.length} UNLOCKED)</h2>
              </div>
              <a href="/achievements" className="text-button flex items-center gap-1 text-xs">
                VIEW ALL <ArrowUpRight size={14} />
              </a>
            </div>

            <div className="achievement-list">
              {achievements.slice(0, 3).map((ach) => (
                <div className="achievement-row" key={ach.id}>
                  <span className="achievement-icon">
                    <Trophy size={16} />
                  </span>
                  <div>
                    <strong>{ach.title}</strong>
                    <span>{ach.description}</span>
                  </div>
                  <b className={ach.isUnlocked ? 'text-amber-400' : 'text-[#4d5758]'}>
                    {ach.isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                  </b>
                </div>
              ))}
            </div>
          </section>
        </StaggerItem>

        <StaggerItem>
          <section className="lower-panel panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">ACTIVE PATH</p>
                <h2>QUEST CHAINS</h2>
              </div>
              <a href="/chains" className="text-button flex items-center gap-1 text-xs">
                EXPLORE <ArrowUpRight size={14} />
              </a>
            </div>

            {activeChain ? (
              <div className="chain-row mt-4">
                <div className="chain-badge">
                  <Swords size={19} />
                </div>
                <div className="chain-info">
                  <h3>{activeChain.title.toUpperCase()}</h3>
                  <p>
                    {activeChain.description || 'Campaign Path'} · {activeChain.completedSteps} of{' '}
                    {activeChain.totalSteps} complete
                  </p>
                  <div className="mini-track overflow-hidden mt-2">
                    <motion.div
                      className="h-full bg-[#d7a646]"
                      initial={{ width: '0%' }}
                      animate={{
                        width: `${
                          activeChain.totalSteps > 0
                            ? (activeChain.completedSteps / activeChain.totalSteps) * 100
                            : 0
                        }%`,
                      }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs font-mono text-[#7b8586]">
                No active quest chain. Join a campaign in the Quest Chains hub.
              </div>
            )}
          </section>
        </StaggerItem>
      </div>

      {showReflection && (
        <BuildReflectionModal
          character={character}
          onClose={() => setShowReflection(false)}
        />
      )}
    </StaggerContainer>
  )
}
