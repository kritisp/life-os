'use client'

import React, { useEffect, useState } from 'react'
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

export default function QuestBoardPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [completionResult, setCompletionResult] = useState<QuestCompletionResult | null>(null)
  const [levelUpState, setLevelUpState] = useState<{ prev: number; next: number } | null>(null)

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
    setCompletingId(taskId)

    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
    )

    try {
      const res = await completeQuest(taskId)
      setCompletionResult(res)

      if (res.didLevelUp) {
        setLevelUpState({ prev: res.previousLevel, next: res.newLevel })
      }
    } catch (err) {
      reloadTasks()
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

  return (
    <>
      <div className="hero-heading">
        <div>
          <p className="eyebrow">ACTIVE MISSIONS · {activeQuests.length} AVAILABLE</p>
          <h1>
            MAKE TODAY <em>COUNT.</em>
          </h1>
        </div>
        <button className="quick-add" onClick={() => setShowCreateModal(true)}>
          <Plus size={15} /> CREATE QUEST
        </button>
      </div>

      <div className="quest-page-grid">
        <section>
          <div className="section-heading">
            <div>
              <p className="eyebrow">TODAY&apos;S BOARD</p>
              <h2>
                QUESTS <span>({activeQuests.length} REMAINING)</span>
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-[#7b8586] border border-[#293033] bg-[#111416]">
              LOADING QUEST BOARD...
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center border border-[#293033] bg-[#111416] space-y-4">
              <Swords size={32} className="mx-auto text-[#d7a646]" />
              <p className="text-sm font-mono text-[#e7e8e4]">NO ACTIVE QUESTS FORGED</p>
              <p className="text-xs font-mono text-[#7b8586] max-w-sm mx-auto">
                Forge your first quest to start building real-world character progression.
              </p>
              <button className="quick-add mx-auto" onClick={() => setShowCreateModal(true)}>
                <Plus size={15} /> CREATE INITIAL QUEST
              </button>
            </div>
          ) : (
            <div className="quest-list">
              {tasks.map((quest) => {
                const isCompleted = quest.status === 'completed'
                const IconComponent = getAttributeIcon(quest.attribute)
                const tone = getAttributeTone(quest.attribute)

                return (
                  <article
                    key={quest.id}
                    className={`quest-card ${isCompleted ? 'completed' : ''}`}
                  >
                    <span className={`quest-icon ${tone}`}>
                      <IconComponent size={19} />
                    </span>

                    <div className="quest-main">
                      <div className="quest-meta">
                        <span>{quest.attribute.toUpperCase()}</span>
                        <i />
                        <span className="quest-time">{quest.difficulty.toUpperCase()}</span>
                      </div>

                      <h3>{quest.title}</h3>
                      {quest.description && <p className="quest-detail">{quest.description}</p>}

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
                        'CLAIMING...'
                      ) : (
                        'COMPLETE QUEST'
                      )}
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <aside className="mission-aside panel">
          <p className="eyebrow">QUEST LOG</p>
          <h2>THE NEXT RIGHT THING</h2>
          <p>
            Small evidence compounds. Choose one quest, complete it, and let the reward remind you
            who you are becoming.
          </p>

          <div className="aside-rule" />

          <span className="eyebrow">DAILY COMPLETIONS</span>
          <strong className="big-number">
            {completedQuests.length} / {tasks.length}
          </strong>

          <div className="mini-track">
            <div
              style={{
                width: `${tasks.length > 0 ? (completedQuests.length / tasks.length) * 100 : 0}%`,
              }}
            />
          </div>
        </aside>
      </div>

      {showCreateModal && (
        <CreateQuestModal
          onClose={() => setShowCreateModal(false)}
          onCreated={reloadTasks}
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
    </>
  )
}
