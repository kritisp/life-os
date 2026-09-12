'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Zap,
  Flame,
  Swords,
  ArrowUpRight,
  Trophy,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import { getAchievements } from '@/features/achievements/actions'
import { getQuestChains } from '@/features/chains/actions'
import { getCharacterTelemetry, ProgressProofData } from '@/features/character/actions'
import { AchievementRow, QuestChainWithDetails } from '@/types'
import { getXpProgress } from '@/lib/engine/progression'
import { WhyThisBuildModal } from '@/components/ui/Modals'
import { AnimatedNumber, StaggerContainer, StaggerItem, PulseGlow } from '@/components/ui/Motion'
import { CharacterSkeleton } from '@/components/ui/Skeletons'

interface AchievementItem extends AchievementRow {
  isUnlocked: boolean
  unlockedAt: string | null
}

export default function CharacterPage() {
  const [telemetry, setTelemetry] = useState<ProgressProofData | null>(null)
  const [achievements, setAchievements] = useState<AchievementItem[]>([])
  const [chains, setChains] = useState<QuestChainWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showWhyBuildModal, setShowWhyBuildModal] = useState(false)
  const [hoveredAttr, setHoveredAttr] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    Promise.all([getCharacterTelemetry(), getAchievements(), getQuestChains()]).then(
      ([teleData, achData, chainData]) => {
        if (isMounted) {
          setTelemetry(teleData)
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

  if (loading || !telemetry) {
    return <CharacterSkeleton />
  }

  const { character } = telemetry
  const xpProgress = getXpProgress(character.xp)

  const attributes = [
    {
      short: 'STR',
      code: 'strength',
      name: 'Strength',
      val: character.strength,
      gained: Math.max(0, character.strength - 10),
      detail: 'Gym, resistance training, physical power',
    },
    {
      short: 'INT',
      code: 'intellect',
      name: 'Intellect',
      val: character.intellect,
      gained: Math.max(0, character.intellect - 10),
      detail: 'Coding, studying, technical reading, logic',
    },
    {
      short: 'DISC',
      code: 'discipline',
      name: 'Discipline',
      val: character.discipline,
      gained: Math.max(0, character.discipline - 10),
      detail: 'Meditation, morning routines, order',
    },
    {
      short: 'VIT',
      code: 'vitality',
      name: 'Vitality',
      val: character.vitality,
      gained: Math.max(0, character.vitality - 10),
      detail: 'Running, movement, hydration, recovery',
    },
    {
      short: 'CRE',
      code: 'creativity',
      name: 'Creativity',
      val: character.creativity,
      gained: Math.max(0, character.creativity - 10),
      detail: 'Writing, UI design, music, crafting',
    },
  ]

  const maxAttrVal = Math.max(...attributes.map((a) => a.val))
  const unlockedAchievements = achievements.filter((a) => a.isUnlocked)
  const activeChain = chains[0]

  return (
    <StaggerContainer className="space-y-6">
      {/* Hero Header */}
      <StaggerItem>
        <div className="hero-heading">
          <div>
            <p className="eyebrow">IDENTITY & PROGRESS PROOF · OPERATOR TELEMETRY</p>
            <h1>
              SEE WHO YOU&apos;RE <em>BECOMING.</em>
            </h1>
          </div>
          <button className="quick-add group" onClick={() => setShowWhyBuildModal(true)}>
            <HelpCircle size={15} className="group-hover:rotate-12 transition-transform duration-200" />
            WHY THIS BUILD?
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
            <p className="eyebrow">AUTHORITATIVE LEVEL PROGRESSION</p>
            <h2 id="level-title">
              LEVEL <AnimatedNumber value={xpProgress.level} /> OPERATOR
            </h2>
            <p>Every completed quest transforms real effort into deterministic character stats.</p>

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

          <div className="build-stamp group cursor-pointer" onClick={() => setShowWhyBuildModal(true)}>
            <div className="flex items-center gap-1.5">
              <span>CURRENT BUILD</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#d7a646] animate-pulse" />
            </div>
            <strong className="group-hover:text-amber-300 transition-colors">
              {character.archetype.toUpperCase()}
            </strong>
            <em>
              Weighted toward {telemetry.topAttribute.name} & {telemetry.secondaryAttribute.name}
            </em>
          </div>
        </section>
      </StaggerItem>

      {/* PART D: PROGRESS PROOF SECTION */}
      <StaggerItem>
        <section className="panel p-5 bg-[#111416] border border-[#293033]">
          <div className="section-heading mb-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#d7a646]" />
                <p className="eyebrow text-[#d7a646]">EVIDENCE MATRIX</p>
              </div>
              <h2>PROGRESS PROOF</h2>
            </div>
            <span className="panel-code">DETERMINISTIC LOG</span>
          </div>

          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 bg-[#15191b] border border-[#2b3336] rounded">
              <span className="text-[10px] text-[#7b8586] block">QUESTS COMPLETED</span>
              <strong className="text-xl text-[#e7e8e4] block mt-1">
                <AnimatedNumber value={telemetry.totalQuestsCompleted} />
              </strong>
            </div>

            <div className="p-3 bg-[#15191b] border border-[#2b3336] rounded">
              <span className="text-[10px] text-[#7b8586] block">TOTAL XP EARNED</span>
              <strong className="text-xl text-amber-400 block mt-1">
                <AnimatedNumber value={telemetry.totalXp} />
              </strong>
            </div>

            <div className="p-3 bg-[#15191b] border border-[#2b3336] rounded">
              <span className="text-[10px] text-[#7b8586] block">ACTIVE STREAK</span>
              <strong className="text-xl text-amber-400 block mt-1">
                <AnimatedNumber value={telemetry.currentStreak} suffix="d" />
              </strong>
            </div>

            <div className="p-3 bg-[#15191b] border border-[#2b3336] rounded">
              <span className="text-[10px] text-[#7b8586] block">7-DAY MOMENTUM</span>
              <strong className="text-xl text-[#d7a646] block mt-1">
                <AnimatedNumber value={telemetry.momentum} suffix="%" />
              </strong>
            </div>
          </div>

          {/* Build Evolution Comparison */}
          <div className="mt-4 p-4 bg-[#161a1c] border border-[#2e373a] rounded font-mono">
            <p className="eyebrow text-cyan-400 mb-2">BUILD EVOLUTION TRACKER</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#0e1112] border border-[#262f31] rounded">
                <span className="text-[10px] text-[#6e787a] block">ORIGIN STATE</span>
                <b className="text-slate-300 text-sm block mt-0.5">THE BALANCED</b>
                <span className="text-[11px] text-[#7b8586] block mt-1">
                  STR 10 · INT 10 · DISC 10 · VIT 10 · CRE 10
                </span>
              </div>

              <div className="p-3 bg-[#19160f] border border-[#715423] rounded">
                <span className="text-[10px] text-amber-500/80 block">CURRENT STATE</span>
                <b className="text-amber-400 text-sm block mt-0.5">{character.archetype.toUpperCase()}</b>
                <span className="text-[11px] text-amber-300/80 block mt-1">
                  STR {character.strength} · INT {character.intellect} · DISC {character.discipline} · VIT {character.vitality} · CRE {character.creativity}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#96a0a2] mt-3 leading-relaxed">
              {telemetry.buildExplanation}
            </p>
          </div>
        </section>
      </StaggerItem>

      {/* Progression Grid */}
      <div className="progression-grid">
        <StaggerItem>
          <section className="panel attributes-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">CAPABILITY DISTRIBUTION</p>
                <h2>ATTRIBUTES</h2>
              </div>
              <span className="panel-code">STAT MATRIX</span>
            </div>

            <div className="attribute-list">
              {attributes.map(({ short, name, val, gained, detail }) => {
                const isHovered = hoveredAttr === short
                const isTop = val === maxAttrVal && val > 10

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
                        <strong className="text-[#cfd1c7] flex items-center gap-1.5">
                          {name}
                          {isTop && (
                            <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded font-mono">
                              DOMINANT
                            </span>
                          )}
                        </strong>
                        <small className="text-[#697373]">{detail}</small>
                      </div>
                      <b className="font-mono text-[#d7a646] text-right">
                        <AnimatedNumber value={val} suffix=" STATS" />
                        {gained > 0 && (
                          <span className="text-[10px] text-cyan-400 block font-normal">
                            +{gained} GAINED
                          </span>
                        )}
                      </b>
                    </div>
                    <div className="attribute-track">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${Math.min(100, (val / 100) * 100)}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full ${
                          isTop
                            ? 'bg-gradient-to-r from-[#d7a646] to-[#ffd778]'
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

        <aside className="side-progression space-y-4">
          {/* PART K: ATTRIBUTE MOMENTUM */}
          <StaggerItem>
            <section className="panel rhythm-panel">
              <div className="section-heading">
                <div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={15} className="text-cyan-400" />
                    <p className="eyebrow text-cyan-400">VELOCITY</p>
                  </div>
                  <h2>ATTRIBUTE MOMENTUM</h2>
                </div>
              </div>

              <p className="text-xs text-[#7b8586] font-mono mb-3">
                Relative completion density across attributes:
              </p>

              <div className="space-y-2 font-mono text-xs">
                {telemetry.attributeMomentum.map((item) => (
                  <div key={item.attribute} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#a6b1b3]">{item.label.toUpperCase()}</span>
                      <span className="text-amber-400 font-semibold">{item.pointsGained} PTS GAINED</span>
                    </div>
                    <div className="h-1.5 bg-[#171b1d] rounded overflow-hidden">
                      <motion.div
                        className="h-full bg-cyan-500/80"
                        initial={{ width: '0%' }}
                        animate={{ width: `${Math.max(5, item.percentage)}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </StaggerItem>

          <StaggerItem>
            <section className="panel rhythm-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">YOUR RHYTHM</p>
                  <h2>MOMENTUM & STREAK</h2>
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
                <Flame size={15} className="animate-bounce" /> Real actions shaping a real operating persona.
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

      {showWhyBuildModal && (
        <WhyThisBuildModal
          character={character}
          onClose={() => setShowWhyBuildModal(false)}
        />
      )}
    </StaggerContainer>
  )
}
