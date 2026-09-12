'use client'

import React, { useState } from 'react'
import { X, Swords, ArrowUpRight, Check, Sparkles, Shield, Brain, Dumbbell, HeartPulse } from 'lucide-react'
import { createTask } from '@/features/quests/actions'
import { QuestDifficulty, AttributeType, QuestCompletionResult, CharacterRow } from '@/types'
import { DIFFICULTY_CONFIG } from '@/lib/constants'

interface CreateQuestModalProps {
  onClose: () => void
  onCreated: () => void
}

export function CreateQuestModal({ onClose, onCreated }: CreateQuestModalProps) {
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('medium')
  const [attribute, setAttribute] = useState<AttributeType>('intellect')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const diffConfig = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setErrorMsg(null)

    formData.set('difficulty', difficulty)
    formData.set('attribute', attribute)

    const res = await createTask(formData)

    setIsSubmitting(false)
    if (res.error) {
      setErrorMsg(res.error)
    } else {
      onCreated()
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-quest-title">
      <div className="quest-modal panel">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={17} />
        </button>

        <p className="eyebrow">QUEST FORGING · NEW ENTRY</p>
        <h2 id="create-quest-title">CREATE NEW QUEST</h2>
        <p className="modal-copy">Every completed quest becomes part of your character build.</p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800/60 text-red-300 text-xs font-mono rounded">
            {errorMsg}
          </div>
        )}

        <form action={handleSubmit} className="quest-form">
          <label>
            TITLE
            <input name="title" placeholder="Name the mission (e.g. Build Login API)" required autoFocus />
          </label>

          <label>
            DESCRIPTION
            <textarea name="description" placeholder="What does completion look like?" rows={3} />
          </label>

          <div className="form-row">
            <label>
              CATEGORY
              <select name="category" defaultValue="coding">
                <option value="coding">CODING</option>
                <option value="studying">STUDYING</option>
                <option value="exercise">EXERCISE</option>
                <option value="routine">ROUTINE</option>
                <option value="creative">CREATIVE</option>
              </select>
            </label>

            <label>
              DIFFICULTY
              <select
                name="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestDifficulty)}
              >
                <option value="easy">EASY (50 XP)</option>
                <option value="medium">MEDIUM (90 XP)</option>
                <option value="hard">HARD (140 XP)</option>
                <option value="epic">EPIC (220 XP)</option>
              </select>
            </label>
          </div>

          <label>
            ASSOCIATED ATTRIBUTE
            <select
              name="attribute"
              value={attribute}
              onChange={(e) => setAttribute(e.target.value as AttributeType)}
            >
              <option value="intellect">INTELLECT (INT)</option>
              <option value="strength">STRENGTH (STR)</option>
              <option value="discipline">DISCIPLINE (DISC)</option>
              <option value="vitality">VITALITY (VIT)</option>
              <option value="creativity">CREATIVITY (CRE)</option>
            </select>
          </label>

          <div className="reward-preview">
            <p className="eyebrow">SERVER REWARD ESTIMATE</p>
            <strong>
              +{diffConfig.xp} XP <span>·</span> +{diffConfig.gold} GOLD
            </strong>
            <span>{attribute.toUpperCase()} +{diffConfig.statPoints}</span>
          </div>

          <button type="submit" disabled={isSubmitting} className="quick-add modal-submit">
            <Swords size={15} />
            {isSubmitting ? 'FORGING QUEST...' : 'ADD TO QUEST BOARD'}
          </button>
        </form>
      </div>
    </div>
  )
}

interface CompletionModalProps {
  result: QuestCompletionResult
  onClose: () => void
}

export function CompletionModal({ result, onClose }: CompletionModalProps) {
  return (
    <div className="modal-backdrop completion-backdrop" role="dialog" aria-modal="true">
      <div className="completion-modal panel">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={17} />
        </button>

        <span className="completion-mark">
          <Check size={24} />
        </span>

        <p className="eyebrow">QUEST COMPLETE</p>
        <h2>AUTHORITATIVE REWARD CLAIMED</h2>

        <div className="reward-burst">
          <strong>+{result.xpGained} XP</strong>
          <strong>+{result.goldGained} GOLD</strong>
          <span>{result.attributeName.toUpperCase()} +{result.attributeGained}</span>
        </div>

        {result.didLevelUp && (
          <div className="level-shift my-3">
            <span>LEVEL {result.previousLevel}</span>
            <ArrowUpRight size={16} className="text-amber-400" />
            <b className="text-amber-400 font-bold">LEVEL {result.newLevel}</b>
          </div>
        )}

        <p className="modal-copy">
          The evidence is real. Streak: {result.currentStreak} days • Momentum: {result.momentum}%.
        </p>

        <button className="quick-add modal-submit" onClick={onClose}>
          CONTINUE <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  )
}

interface LevelUpModalProps {
  previousLevel: number
  newLevel: number
  onClose: () => void
}

export function LevelUpModal({ previousLevel, newLevel, onClose }: LevelUpModalProps) {
  return (
    <div className="levelup-overlay" role="dialog" aria-modal="true">
      <div className="levelup-modal">
        <button className="levelup-close" onClick={onClose} aria-label="Close celebration">
          <X size={18} />
        </button>

        <div className="levelup-mark">
          <span>LEVEL {previousLevel}</span>
          <ArrowUpRight size={24} className="text-amber-400" />
          <strong>{newLevel}</strong>
        </div>

        <h2>LEVEL UP</h2>
        <p className="levelup-copy">
          You reached <b>LEVEL {newLevel}</b>. Your real-world choices are shaping an extraordinary character build.
        </p>

        <div className="levelup-reward">
          <span>CHARACTER ASCENDANCE</span>
          <strong>LEVEL {newLevel} OPERATOR UNLOCKED</strong>
        </div>

        <button className="levelup-button" onClick={onClose}>
          <Sparkles size={16} /> CLAIM CHARACTER EVOLUTION
        </button>
      </div>
    </div>
  )
}

interface BuildReflectionModalProps {
  character: CharacterRow
  onClose: () => void
}

export function BuildReflectionModal({ character, onClose }: BuildReflectionModalProps) {
  const stats = [
    { label: 'INTELLECT', val: character.intellect, icon: Brain },
    { label: 'STRENGTH', val: character.strength, icon: Dumbbell },
    { label: 'DISCIPLINE', val: character.discipline, icon: Shield },
    { label: 'VITALITY', val: character.vitality, icon: HeartPulse },
    { label: 'CREATIVITY', val: character.creativity, icon: Sparkles },
  ].sort((a, b) => b.val - a.val)

  const topTwo = `${stats[0].label} + ${stats[1].label}`

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="quest-modal panel max-w-lg">
        <button className="modal-close" onClick={onClose} aria-label="Close reflection">
          <X size={17} />
        </button>

        <p className="eyebrow">CHARACTER REFLECTION LOG</p>
        <h2>YOUR BUILD: {character.archetype.toUpperCase()}</h2>

        <div className="my-4 p-4 border border-[#504426] bg-[#181813] rounded">
          <p className="eyebrow mb-1">PRIMARY ATTRIBUTE TRAJECTORY</p>
          <strong className="text-amber-400 text-base font-mono font-medium block">
            {topTwo}
          </strong>
          <p className="text-xs text-slate-400 font-mono mt-2 leading-relaxed">
            Your recent completed actions demonstrate consistent investment in high-impact domains.
            You are operating as <b>{character.archetype}</b>.
          </p>
        </div>

        <div className="space-y-2 mb-6">
          <p className="eyebrow">STAT POINT ALLOCATIONS</p>
          {stats.map((s) => (
            <div key={s.label} className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">{s.label}</span>
              <span className="text-amber-400 font-medium">{s.val} STAT POINTS</span>
            </div>
          ))}
        </div>

        <button className="quick-add modal-submit" onClick={onClose}>
          ACKNOWLEDGE TRAJECTORY
        </button>
      </div>
    </div>
  )
}
