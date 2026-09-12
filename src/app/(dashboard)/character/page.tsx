'use client'

import React, { useEffect, useState } from 'react'
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
    return (
      <div className="p-12 text-center text-xs font-mono text-[#7b8586] border border-[#293033] bg-[#111416]">
        LOADING CHARACTER COMMAND CENTER...
      </div>
    )
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
    <>
      <div className="hero-heading">
        <div>
          <p className="eyebrow">CHARACTER PROGRESSION · TODAY</p>
          <h1>
            SEE WHO YOU&apos;RE <em>BECOMING.</em>
          </h1>
        </div>
        <button className="quick-add" onClick={() => setShowReflection(true)}>
          <Sparkles size={15} /> REFLECT ON THIS BUILD
        </button>
      </div>

      {/* Level Banner */}
      <section className="level-banner panel" aria-labelledby="level-title">
        <div className="level-orbit" aria-hidden="true">
          <span>{xpProgress.level}</span>
          <i />
          <i />
          <i />
        </div>

        <div className="level-copy">
          <p className="eyebrow">CURRENT LEVEL</p>
          <h2 id="level-title">LEVEL {xpProgress.level}</h2>
          <p>Every completed quest becomes part of your character evolution.</p>

          <div className="xp-line">
            <span>{xpProgress.currentLevelXp} XP</span>
            <span>{xpProgress.nextLevelXp} XP</span>
          </div>

          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={xpProgress.progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress-fill"
              style={{ width: `${xpProgress.progressPercentage}%` }}
            />
          </div>

          <small>
            {xpProgress.nextLevelXp - xpProgress.currentLevelXp} XP TO LEVEL{' '}
            {xpProgress.level + 1}
          </small>
        </div>

        <div className="build-stamp">
          <span>CURRENT BUILD</span>
          <strong>{character.archetype.toUpperCase()}</strong>
          <em>
            Determined by real-world
            <br />
            attribute distribution
          </em>
        </div>
      </section>

      {/* Progression Grid */}
      <div className="progression-grid">
        <section className="panel attributes-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR CAPABILITIES</p>
              <h2>ATTRIBUTES</h2>
            </div>
            <span className="panel-code">STAT MATRIX</span>
          </div>

          <div className="attribute-list">
            {attributes.map(({ short, name, val, detail }) => (
              <div className="progression-attribute" key={short}>
                <div className="attribute-top">
                  <span className="attribute-name">{short}</span>
                  <div className="attribute-label">
                    <strong>{name}</strong>
                    <small>{detail}</small>
                  </div>
                  <b>{val} STATS</b>
                </div>
                <div className="attribute-track">
                  <div style={{ width: `${Math.min(100, (val / 100) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="side-progression">
          <section className="panel rhythm-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR RHYTHM</p>
                <h2>MOMENTUM</h2>
              </div>
              <Zap size={18} className="amber-icon" />
            </div>

            <div className="rhythm-stats">
              <div>
                <strong>{character.current_streak}</strong>
                <span>
                  CURRENT
                  <br />
                  STREAK
                </span>
              </div>
              <div>
                <strong>{character.longest_streak}</strong>
                <span>
                  LONGEST
                  <br />
                  STREAK
                </span>
              </div>
              <div>
                <strong>
                  {character.momentum}
                  <small>%</small>
                </strong>
                <span>
                  MOMENTUM
                  <br />
                  INDEX
                </span>
              </div>
            </div>

            <div className="rhythm-note">
              <Flame size={15} /> You&apos;re building a pattern worth keeping.
            </div>
          </section>

          <section className="panel title-panel">
            <Award size={18} />
            <div>
              <p className="eyebrow">ACTIVE TITLE</p>
              <h3>ARCHITECT OF MOMENTUM</h3>
              <span>Level {xpProgress.level} Operator</span>
            </div>
          </section>
        </aside>
      </div>

      {/* Lower Grid */}
      <div className="lower-grid progression-lower">
        <section className="lower-panel panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">RECENT PROOF</p>
              <h2>ACHIEVEMENTS ({unlockedAchievements.length} UNLOCKED)</h2>
            </div>
            <a href="/achievements" className="text-button">
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
                <b>{ach.isUnlocked ? 'UNLOCKED' : 'LOCKED'}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="lower-panel panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ACTIVE PATH</p>
              <h2>QUEST CHAINS</h2>
            </div>
            <a href="/chains" className="text-button">
              EXPLORE <ArrowUpRight size={14} />
            </a>
          </div>

          {activeChain ? (
            <div className="chain-row">
              <div className="chain-badge">
                <Swords size={19} />
              </div>
              <div className="chain-info">
                <h3>{activeChain.title.toUpperCase()}</h3>
                <p>
                  {activeChain.description || 'Campaign Path'} · {activeChain.completedSteps} of{' '}
                  {activeChain.totalSteps} complete
                </p>
                <div className="mini-track">
                  <div
                    style={{
                      width: `${
                        activeChain.totalSteps > 0
                          ? (activeChain.completedSteps / activeChain.totalSteps) * 100
                          : 0
                      }%`,
                    }}
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
      </div>

      {showReflection && (
        <BuildReflectionModal
          character={character}
          onClose={() => setShowReflection(false)}
        />
      )}
    </>
  )
}
