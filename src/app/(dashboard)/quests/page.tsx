'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Target,
  Check,
  Zap,
  Gem,
  Swords,
  Brain,
  Dumbbell,
  Shield,
  Sparkles,
  HeartPulse,
  Flame,
  ArrowRight,
} from 'lucide-react'
import { getTasks, completeQuest } from '@/features/quests/actions'
import { getCharacterTelemetry, ProgressProofData } from '@/features/character/actions'
import { TaskRow, QuestCompletionResult } from '@/types'
import { DIFFICULTY_CONFIG } from '@/lib/constants'
import { CreateQuestModal, CompletionModal, LevelUpModal } from '@/components/ui/Modals'
import { StaggerContainer, StaggerItem, AnimatedNumber, FloatingRewardBadge } from '@/components/ui/Motion'
import { QuestBoardSkeleton } from '@/components/ui/Skeletons'
import { useToast } from '@/components/ui/Toast'

export default function QuestBoardPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [telemetry, setTelemetry] = useState<ProgressProofData | null>(null)
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [completionResult, setCompletionResult] = useState<QuestCompletionResult | null>(null)
  const [levelUpState, setLevelUpState] = useState<{ prev: number; next: number } | null>(null)
  const [activeRewards, setActiveRewards] = useState<{ id: string; taskId: string; text: string; type: 'xp' | 'gold' | 'stat' }[]>([])
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const { addToast } = useToast()

  const reloadData = () => {
    Promise.all([getTasks('all'), getCharacterTelemetry()]).then(([taskList, teleData]) => {
      setTasks(taskList)
      setTelemetry(teleData)
      setLoading(false)
    })
  }

  useEffect(() => {
    let isMounted = true
    Promise.all([getTasks('all'), getCharacterTelemetry()]).then(([taskList, teleData]) => {
      if (isMounted) {
        setTasks(taskList)
        setTelemetry(teleData)
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const handleComplete = async (taskId: string) => {
    const targetQuest = tasks.find((t) => t.id === taskId)
    if (!targetQuest) return

    setCompletingId(taskId)

    // Instant optimistic visual feedback
    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
    )

    try {
      const res = await completeQuest(taskId)
      setCompletionResult(res)

      // Add floating reward badge
      const rewardId = `${taskId}-reward`
      setActiveRewards((prev) => [
        ...prev,
        {
          id: rewardId,
          taskId,
          text: `+${res.xpGained} XP • +${res.goldGained} GOLD`,
          type: 'xp',
        },
      ])

      setTimeout(() => {
        setActiveRewards((prev) => prev.filter((r) => r.id !== rewardId))
      }, 1400)

      // Notification toast
      addToast({
        title: 'QUEST COMPLETE',
        description: `${targetQuest.title} resolved. +${res.xpGained} XP, +${res.goldGained} Gold gained.`,
        type: 'quest_completed',
      })

      if (res.didLevelUp) {
        setLevelUpState({ prev: res.previousLevel, next: res.newLevel })
        addToast({
          title: 'LEVEL UP!',
          description: `You reached Level ${res.newLevel}! Character evolving.`,
          type: 'level_up',
        })
      }

      // Reload telemetry
      getCharacterTelemetry().then((tele) => {
        if (tele) setTelemetry(tele)
      })
    } catch (err) {
      reloadData()
      addToast({
        title: 'EXECUTION ERROR',
        description: err instanceof Error ? err.message : 'Could not resolve quest completion.',
        type: 'error',
      })
    } finally {
      setCompletingId(null)
    }
  }

  const getAttributeIcon = (attr: string) => {
    switch (attr) {
      case 'strength':
        return Dumbbell
      case 'intellect':
        return Brain
      case 'discipline':
        return Shield
      case 'vitality':
        return HeartPulse
      case 'creativity':
        return Sparkles
      default:
        return Target
    }
  }

  const getAttributeTone = (attr: string) => {
    switch (attr) {
      case 'strength':
        return 'red'
      case 'intellect':
        return 'blue'
      case 'discipline':
        return 'amber'
      case 'vitality':
        return 'green'
      case 'creativity':
        return 'purple'
      default:
        return 'amber'
    }
  }

  const activeQuests = tasks.filter((t) => t.status === 'active')
  const completedQuests = tasks.filter((t) => t.status === 'completed')

  const filteredQuests = tasks.filter((t) => {
    if (filterCategory === 'all') return true
    if (filterCategory === 'active') return t.status === 'active'
    if (filterCategory === 'completed') return t.status === 'completed'
    return t.category === filterCategory
  })

  if (loading) {
    return <QuestBoardSkeleton />
  }

  return (
    <StaggerContainer className="space-y-6">
      {/* Recovery without punishment banner (PART F) */}
      {telemetry?.recoveryStatus.isReturning && (
        <StaggerItem>
          <div className="p-4 bg-[#181610] border border-[#d7a646]/40 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Flame size={17} />
              </div>
              <div>
                <strong className="text-amber-400 block text-xs tracking-wider">
                  WELCOME BACK, OPERATOR · READY FOR THE NEXT QUEST?
                </strong>
                <span className="text-[#96a0a2] text-[11px] block mt-0.5">
                  Level {telemetry.character.level} · {telemetry.character.archetype} · {telemetry.recoveryStatus.message}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-[#2a2213] border border-[#715423] hover:border-[#d7a646] text-amber-300 font-semibold text-[11px] flex items-center gap-1.5 shrink-0 transition-colors"
            >
              START NEXT QUEST <ArrowRight size={13} />
            </button>
          </div>
        </StaggerItem>
      )}

      {/* Hero Header */}
      <StaggerItem>
        <div className="hero-heading">
          <div>
            <p className="eyebrow">ACTIVE MISSIONS · {activeQuests.length} AVAILABLE</p>
            <h1>
              TODAY&apos;S <em>ADVENTURE.</em>
            </h1>
          </div>
          <button className="quick-add group" onClick={() => setShowCreateModal(true)}>
            <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
            FORGE QUEST
          </button>
        </div>
      </StaggerItem>

      {/* Filter Tabs */}
      <StaggerItem>
        <div className="flex flex-wrap gap-2 pt-1">
          {['all', 'active', 'completed', 'coding', 'exercise', 'routine', 'creative'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-xs font-mono tracking-wider transition-all border ${
                filterCategory === cat
                  ? 'border-[#d7a646] bg-[#211a0f] text-[#d7a646] font-semibold'
                  : 'border-[#293033] bg-[#111416] text-[#7b8586] hover:text-[#d6d8cf] hover:border-[#404c50]'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </StaggerItem>

      <div className="quest-page-grid">
        <section>
          <StaggerItem>
            <div className="section-heading">
              <div>
                <p className="eyebrow">TACTICAL QUEUE</p>
                <h2>
                  MISSIONS <span>({activeQuests.length} ACTIVE / {completedQuests.length} COMPLETED)</span>
                </h2>
              </div>
            </div>
          </StaggerItem>

          {filteredQuests.length === 0 ? (
            <StaggerItem>
              <div className="p-12 text-center border border-[#293033] bg-[#111416] space-y-4 my-4">
                <Swords size={32} className="mx-auto text-[#d7a646]" />
                <p className="text-sm font-mono text-[#e7e8e4]">NO QUESTS IN QUEUE</p>
                <p className="text-xs font-mono text-[#7b8586] max-w-sm mx-auto">
                  The board is quiet. Create your first quest to begin your run and convert actions into RPG growth.
                </p>
                <button className="quick-add mx-auto" onClick={() => setShowCreateModal(true)}>
                  <Plus size={15} /> FORGE FIRST QUEST
                </button>
              </div>
            </StaggerItem>
          ) : (
            <div className="quest-list">
              <AnimatePresence mode="popLayout">
                {filteredQuests.map((quest) => {
                  const isCompleted = quest.status === 'completed'
                  const IconComponent = getAttributeIcon(quest.attribute)
                  const tone = getAttributeTone(quest.attribute)
                  const rewardBadge = activeRewards.find((r) => r.taskId === quest.id)
                  const diffConfig = DIFFICULTY_CONFIG[quest.difficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medium

                  return (
                    <motion.article
                      key={quest.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={isCompleted ? {} : { y: -2 }}
                      className={`quest-card relative group ${isCompleted ? 'completed' : ''}`}
                    >
                      {rewardBadge && (
                        <FloatingRewardBadge
                          id={rewardBadge.id}
                          text={rewardBadge.text}
                          type={rewardBadge.type}
                        />
                      )}

                      <span className={`quest-icon ${tone} shrink-0`}>
                        <IconComponent size={19} />
                      </span>

                      <div className="quest-main">
                        <div className="quest-meta flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-[#d7a646]">
                            {quest.attribute.toUpperCase()}
                          </span>
                          <i className="w-1 h-1 rounded-full bg-[#4d5758]" />
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${diffConfig.badgeClass}`}>
                            {quest.difficulty.toUpperCase()}
                          </span>
                          <i className="w-1 h-1 rounded-full bg-[#4d5758]" />
                          <span className="text-[10px] font-mono text-[#7b8586]">
                            {quest.category.toUpperCase()}
                          </span>
                        </div>

                        <h3 className="group-hover:text-amber-300 transition-colors font-mono font-medium text-sm">
                          {quest.title}
                        </h3>
                        {quest.description && (
                          <p className="quest-detail text-xs text-[#7b8586]">{quest.description}</p>
                        )}

                        <div className="rewards flex items-center gap-3 pt-1 text-xs font-mono">
                          <span className="text-amber-400 flex items-center gap-1 font-semibold">
                            <Zap size={13} /> +{quest.base_xp} XP
                          </span>
                          <span className="text-amber-400 flex items-center gap-1 font-semibold">
                            <Gem size={13} /> +{quest.base_gold} GOLD
                          </span>
                          <span className="text-cyan-400 text-[11px]">
                            +{diffConfig.statPoints} {quest.attribute.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <button
                        className={`complete-button ${isCompleted ? 'done' : ''}`}
                        disabled={isCompleted || completingId === quest.id}
                        onClick={() => handleComplete(quest.id)}
                      >
                        {isCompleted ? (
                          <>
                            <Check size={13} /> COMPLETED
                          </>
                        ) : completingId === quest.id ? (
                          <span className="animate-pulse">AUTHORIZING...</span>
                        ) : (
                          'COMPLETE'
                        )}
                      </button>
                    </motion.article>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        <aside className="mission-aside panel">
          <StaggerItem>
            <p className="eyebrow">QUEST LOG TELEMETRY</p>
            <h2>THE NEXT RIGHT THING</h2>
            <p className="text-xs text-[#8e9799] leading-relaxed">
              Small evidence compounds. Choose one quest, complete it, and let the reward remind you
              who you are becoming.
            </p>

            <div className="aside-rule" />

            <span className="eyebrow">DAILY COMPLETION RATIO</span>
            <strong className="big-number font-mono text-2xl text-[#e7e8e4] block my-1">
              <AnimatedNumber value={completedQuests.length} /> / {tasks.length}
            </strong>

            <div className="mini-track overflow-hidden mt-3">
              <motion.div
                className="h-full bg-[#d7a646]"
                initial={{ width: '0%' }}
                animate={{
                  width: `${
                    tasks.length > 0 ? (completedQuests.length / tasks.length) * 100 : 0
                  }%`,
                }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            {telemetry && (
              <div className="mt-6 pt-4 border-t border-[#293033] font-mono text-xs space-y-2">
                <div className="flex justify-between text-[#8e9799]">
                  <span>7-DAY MOMENTUM</span>
                  <b className="text-amber-400">{telemetry.momentum}%</b>
                </div>
                <div className="flex justify-between text-[#8e9799]">
                  <span>CURRENT STREAK</span>
                  <b className="text-amber-400">{telemetry.currentStreak} DAYS</b>
                </div>
                <div className="flex justify-between text-[#8e9799]">
                  <span>TOP ATTRIBUTE</span>
                  <b className="text-cyan-400">{telemetry.topAttribute.name}</b>
                </div>
              </div>
            )}
          </StaggerItem>
        </aside>
      </div>

      {showCreateModal && (
        <CreateQuestModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            reloadData()
            addToast({
              title: 'QUEST FORGED',
              description: 'New quest added to your Board.',
              type: 'info',
            })
          }}
        />
      )}

      {completionResult && (
        <CompletionModal
          result={completionResult}
          onClose={() => setCompletionResult(null)}
          onLevelUpTrigger={() => {
            if (completionResult.didLevelUp) {
              setLevelUpState({ prev: completionResult.previousLevel, next: completionResult.newLevel })
            }
          }}
        />
      )}

      {levelUpState && (
        <LevelUpModal
          previousLevel={levelUpState.prev}
          newLevel={levelUpState.next}
          onClose={() => setLevelUpState(null)}
        />
      )}
    </StaggerContainer>
  )
}
