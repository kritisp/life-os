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
} from 'lucide-react'
import { getTasks, completeQuest } from '@/features/quests/actions'
import { TaskRow, QuestCompletionResult } from '@/types'
import { CreateQuestModal, CompletionModal, LevelUpModal } from '@/components/ui/Modals'
import { StaggerContainer, StaggerItem, AnimatedNumber, FloatingRewardBadge } from '@/components/ui/Motion'
import { QuestBoardSkeleton } from '@/components/ui/Skeletons'
import { useToast } from '@/components/ui/Toast'

export default function QuestBoardPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [completionResult, setCompletionResult] = useState<QuestCompletionResult | null>(null)
  const [levelUpState, setLevelUpState] = useState<{ prev: number; next: number } | null>(null)
  const [activeRewards, setActiveRewards] = useState<{ id: string; taskId: string; text: string; type: 'xp' | 'gold' | 'stat' }[]>([])
  
  const { addToast } = useToast()

  const reloadTasks = () => {
    getTasks('all').then((list) => {
      setTasks(list)
      setLoading(false)
    })
  }

  useEffect(() => {
    let isMounted = true
    getTasks('all').then((list) => {
      if (isMounted) {
        setTasks(list)
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

    // Mark as completed locally for instant UI responsiveness
    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
    )

    try {
      const res = await completeQuest(taskId)
      setCompletionResult(res)

      // Add floating reward badge over completed quest
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
      }, 1200)

      // Add notification toast
      addToast({
        title: 'QUEST COMPLETE',
        description: `${targetQuest.title} completed! +${res.xpGained} XP, +${res.goldGained} GOLD gained.`,
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
    } catch (err) {
      reloadTasks()
      addToast({
        title: 'SYSTEM ERROR',
        description: 'Could not resolve quest completion on server. Retrying...',
        type: 'error',
      })
      console.error('Quest completion failed:', err)
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

  if (loading) {
    return <QuestBoardSkeleton />
  }

  return (
    <StaggerContainer className="space-y-6">
      {/* Hero Header */}
      <StaggerItem>
        <div className="hero-heading">
          <div>
            <p className="eyebrow">ACTIVE MISSIONS · {activeQuests.length} AVAILABLE</p>
            <h1>
              MAKE TODAY <em>COUNT.</em>
            </h1>
          </div>
          <button className="quick-add group" onClick={() => setShowCreateModal(true)}>
            <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
            CREATE QUEST
          </button>
        </div>
      </StaggerItem>

      <div className="quest-page-grid">
        <section>
          <StaggerItem>
            <div className="section-heading">
              <div>
                <p className="eyebrow">TODAY Board</p>
                <h2>
                  QUESTS <span>({activeQuests.length} REMAINING)</span>
                </h2>
              </div>
            </div>
          </StaggerItem>

          {tasks.length === 0 ? (
            <StaggerItem>
              <div className="p-12 text-center border border-[#293033] bg-[#111416] space-y-4 my-4">
                <Swords size={32} className="mx-auto text-[#d7a646]" />
                <p className="text-sm font-mono text-[#e7e8e4]">NO ACTIVE QUESTS FORGED</p>
                <p className="text-xs font-mono text-[#7b8586] max-w-sm mx-auto">
                  The board is quiet. Forge your first quest to start building real-world character progression.
                </p>
                <button className="quick-add mx-auto" onClick={() => setShowCreateModal(true)}>
                  <Plus size={15} /> CREATE INITIAL QUEST
                </button>
              </div>
            </StaggerItem>
          ) : (
            <div className="quest-list">
              <AnimatePresence mode="popLayout">
                {tasks.map((quest) => {
                  const isCompleted = quest.status === 'completed'
                  const IconComponent = getAttributeIcon(quest.attribute)
                  const tone = getAttributeTone(quest.attribute)
                  const rewardBadge = activeRewards.find((r) => r.taskId === quest.id)

                  return (
                    <motion.article
                      key={quest.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={isCompleted ? {} : { y: -2 }}
                      whileTap={isCompleted ? {} : { scale: 0.99 }}
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
                        <div className="quest-meta">
                          <span>{quest.attribute.toUpperCase()}</span>
                          <i />
                          <span className="quest-time">{quest.difficulty.toUpperCase()}</span>
                        </div>

                        <h3 className="group-hover:text-amber-300 transition-colors">
                          {quest.title}
                        </h3>
                        {quest.description && (
                          <p className="quest-detail">{quest.description}</p>
                        )}

                        <div className="rewards">
                          <span>
                            <Zap size={13} /> +{quest.base_xp} XP
                          </span>
                          <span>
                            <Gem size={13} /> +{quest.base_gold} GOLD
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
                          <span className="animate-pulse">CLAIMING...</span>
                        ) : (
                          'COMPLETE QUEST'
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
            <p className="eyebrow">QUEST LOG</p>
            <h2>THE NEXT RIGHT THING</h2>
            <p>
              Small evidence compounds. Choose one quest, complete it, and let the reward remind you
              who you are becoming.
            </p>

            <div className="aside-rule" />

            <span className="eyebrow">DAILY COMPLETIONS</span>
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
          </StaggerItem>
        </aside>
      </div>

      {showCreateModal && (
        <CreateQuestModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            reloadTasks()
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
