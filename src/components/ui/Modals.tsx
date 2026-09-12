'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Swords, ArrowUpRight, Check, Sparkles, Shield, Brain, Dumbbell, HeartPulse } from 'lucide-react'
import { createTask } from '@/features/quests/actions'
import { QuestDifficulty, AttributeType, QuestCompletionResult, CharacterRow } from '@/types'
import { DIFFICULTY_CONFIG } from '@/lib/constants'
import { AnimatedNumber } from '@/components/ui/Motion'

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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

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
    <AnimatePresence>
      <div
        className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-quest-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="quest-modal panel max-w-lg w-full relative"
        >
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

            <button type="submit" disabled={isSubmitting} className="quick-add modal-submit w-full justify-center">
              <Swords size={15} />
              {isSubmitting ? 'FORGING QUEST...' : 'ADD TO QUEST BOARD'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

interface CompletionModalProps {
  result: QuestCompletionResult
  onClose: () => void
}

export function CompletionModal({ result, onClose }: CompletionModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="modal-backdrop completion-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="completion-modal panel max-w-md w-full relative text-center"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={17} />
        </button>

        <div className="completion-mark mx-auto mb-4 w-12 h-12 rounded-full border border-emerald-600/60 bg-emerald-950/40 grid place-items-center text-emerald-400">
          <Check size={24} />
        </div>

        <p className="eyebrow">QUEST COMPLETE</p>
        <h2 className="text-xl font-mono text-[#e7e8e4] my-2">AUTHORITATIVE REWARD CLAIMED</h2>

        <div className="reward-burst flex justify-center items-center gap-4 my-5 p-3.5 bg-[#171b1d] border border-[#293033] rounded font-mono">
          <strong className="text-amber-400 text-sm">
            +<AnimatedNumber value={result.xpGained} /> XP
          </strong>
          <span className="text-[#4d5758]">·</span>
          <strong className="text-amber-400 text-sm">
            +<AnimatedNumber value={result.goldGained} /> GOLD
          </strong>
          <span className="text-[#4d5758]">·</span>
          <span className="text-sky-400 text-xs font-semibold">
            {result.attributeName.toUpperCase()} +{result.attributeGained}
          </span>
        </div>

        {result.didLevelUp && (
          <div className="level-shift my-4 flex items-center justify-center gap-2 p-2 border border-amber-600/40 bg-amber-950/30 rounded font-mono">
            <span className="text-xs text-slate-400">LEVEL {result.previousLevel}</span>
            <ArrowUpRight size={16} className="text-amber-400" />
            <b className="text-amber-400 font-bold text-sm">LEVEL {result.newLevel}</b>
          </div>
        )}

        <p className="modal-copy text-xs text-[#7b8586] font-mono mb-6">
          The evidence is real. Streak: {result.currentStreak} days • Momentum: {result.momentum}%.
        </p>

        <button className="quick-add modal-submit w-full justify-center" onClick={onClose} autoFocus>
          CONTINUE <ArrowUpRight size={14} />
        </button>
      </motion.div>
    </div>
  )
}

interface LevelUpModalProps {
  previousLevel: number
  newLevel: number
  onClose: () => void
}

export function LevelUpModal({ previousLevel, newLevel, onClose }: LevelUpModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="levelup-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="levelup-modal relative text-center max-w-md w-full p-8 border border-amber-600/50 bg-[#14120e] shadow-[0_0_50px_rgba(215,166,70,0.15)]"
      >
        <button className="levelup-close absolute top-4 right-4 text-[#7b8586] hover:text-[#e7e8e4]" onClick={onClose} aria-label="Close celebration">
          <X size={18} />
        </button>

        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="levelup-mark flex items-center justify-center gap-3 my-4"
        >
          <span className="text-sm font-mono text-slate-400">LEVEL {previousLevel}</span>
          <ArrowUpRight size={28} className="text-amber-400" />
          <strong className="text-4xl font-mono text-amber-400 font-bold">{newLevel}</strong>
        </motion.div>

        <h2 className="text-2xl font-mono text-[#e7e8e4] tracking-wider my-2">LEVEL UP</h2>
        <p className="levelup-copy text-xs text-[#7b8586] font-mono leading-relaxed max-w-xs mx-auto">
          You reached <b className="text-amber-400">LEVEL {newLevel}</b>. Your real-world choices are shaping an extraordinary character build.
        </p>

        <div className="levelup-reward my-6 p-4 border border-[#80652f] bg-[#211c12] font-mono">
          <span className="text-[10px] text-amber-500/80 tracking-widest block">CHARACTER ASCENDANCE</span>
          <strong className="text-sm text-amber-400 block mt-1">LEVEL {newLevel} OPERATOR UNLOCKED</strong>
        </div>

        <button className="levelup-button w-full justify-center" onClick={onClose} autoFocus>
          <Sparkles size={16} /> CLAIM CHARACTER EVOLUTION
        </button>
      </motion.div>
    </div>
  )
}

interface BuildReflectionModalProps {
  character: CharacterRow
  onClose: () => void
}

export function BuildReflectionModal({ character, onClose }: BuildReflectionModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const stats = [
    { label: 'INTELLECT', val: character.intellect, icon: Brain },
    { label: 'STRENGTH', val: character.strength, icon: Dumbbell },
    { label: 'DISCIPLINE', val: character.discipline, icon: Shield },
    { label: 'VITALITY', val: character.vitality, icon: HeartPulse },
    { label: 'CREATIVITY', val: character.creativity, icon: Sparkles },
  ].sort((a, b) => b.val - a.val)

  const topTwo = `${stats[0].label} + ${stats[1].label}`

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="quest-modal panel max-w-lg w-full relative"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close reflection">
          <X size={17} />
        </button>

        <p className="eyebrow">CHARACTER REFLECTION LOG</p>
        <h2 className="text-xl font-mono text-[#e7e8e4] my-1">YOUR BUILD: {character.archetype.toUpperCase()}</h2>

        <div className="my-4 p-4 border border-[#504426] bg-[#181813] rounded font-mono">
          <p className="eyebrow mb-1">PRIMARY ATTRIBUTE TRAJECTORY</p>
          <strong className="text-amber-400 text-base font-medium block">
            {topTwo}
          </strong>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your recent completed actions demonstrate consistent investment in high-impact domains.
            You are operating as <b className="text-amber-300">{character.archetype}</b>.
          </p>
        </div>

        <div className="space-y-2.5 mb-6 font-mono">
          <p className="eyebrow">STAT POINT ALLOCATIONS</p>
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="flex justify-between items-center text-xs p-2 border border-[#293033] bg-[#111416]">
                <div className="flex items-center gap-2 text-slate-300">
                  <Icon size={14} className="text-amber-400" />
                  <span>{s.label}</span>
                </div>
                <span className="text-amber-400 font-medium">{s.val} STAT POINTS</span>
              </div>
            )
          })}
        </div>

        <button className="quick-add modal-submit w-full justify-center" onClick={onClose} autoFocus>
          ACKNOWLEDGE TRAJECTORY
        </button>
      </motion.div>
    </div>
  )
}

