'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Swords,
  ArrowUpRight,
  Check,
  Sparkles,
  Shield,
  Brain,
  Dumbbell,
  HeartPulse,
  Flame,
  Zap,
  HelpCircle,
} from 'lucide-react'
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
          <p className="modal-copy">Every completed quest shapes your character build and attribute momentum.</p>

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
                  <option value="easy">EASY (50 XP · 20 GOLD)</option>
                  <option value="medium">MEDIUM (100 XP · 45 GOLD)</option>
                  <option value="hard">HARD (200 XP · 100 GOLD)</option>
                  <option value="epic">EPIC (500 XP · 250 GOLD)</option>
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
                <option value="intellect">INTELLECT (INT) — Logic, Coding, Technical Reading</option>
                <option value="strength">STRENGTH (STR) — Resistance Training, Physical Power</option>
                <option value="discipline">DISCIPLINE (DISC) — Morning Routine, Meditation, Order</option>
                <option value="vitality">VITALITY (VIT) — Running, Hydration, Movement</option>
                <option value="creativity">CREATIVITY (CRE) — Design, Writing, Music, Craft</option>
              </select>
            </label>

            <div className="reward-preview">
              <p className="eyebrow">AUTHORITATIVE REWARD ESTIMATE</p>
              <strong>
                +{diffConfig.xp} XP <span>·</span> +{diffConfig.gold} GOLD
              </strong>
              <span>
                {attribute.toUpperCase()} +{diffConfig.statPoints} STAT POINT{diffConfig.statPoints > 1 ? 'S' : ''}
              </span>
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
  onLevelUpTrigger?: () => void
}

export function CompletionModal({ result, onClose, onLevelUpTrigger }: CompletionModalProps) {
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
    <div
      className="modal-backdrop completion-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="completion-modal panel max-w-md w-full relative text-center border-[#3c4a4e] bg-[#111416]"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={17} />
        </button>

        <div className="completion-mark mx-auto mb-3 w-12 h-12 rounded-full border border-emerald-600/60 bg-emerald-950/40 grid place-items-center text-emerald-400">
          <Check size={24} />
        </div>

        <p className="eyebrow text-emerald-400">QUEST COMPLETE</p>
        <h2 className="text-xl font-mono text-[#e7e8e4] my-1">AUTHORITATIVE REWARD CLAIMED</h2>

        <div className="reward-burst flex justify-center items-center gap-3 my-4 p-3 bg-[#171b1d] border border-[#293033] rounded font-mono">
          <strong className="text-amber-400 text-sm">
            +<AnimatedNumber value={result.xpGained} /> XP
          </strong>
          <span className="text-[#4d5758]">·</span>
          <strong className="text-amber-400 text-sm">
            +<AnimatedNumber value={result.goldGained} /> GOLD
          </strong>
          <span className="text-[#4d5758]">·</span>
          <span className="text-cyan-400 text-xs font-semibold">
            {result.attributeName.toUpperCase()} +{result.attributeGained}
          </span>
        </div>

        {/* Telemetry updates */}
        <div className="grid grid-cols-2 gap-2 my-3 font-mono text-xs">
          <div className="p-2 bg-[#14181a] border border-[#293033] rounded text-left">
            <span className="text-[10px] text-[#7b8586] block">MOMENTUM INDEX</span>
            <strong className="text-[#d7a646] flex items-center gap-1 mt-0.5">
              <Zap size={13} /> {result.momentum}%
            </strong>
          </div>
          <div className="p-2 bg-[#14181a] border border-[#293033] rounded text-left">
            <span className="text-[10px] text-[#7b8586] block">ACTIVE STREAK</span>
            <strong className="text-amber-400 flex items-center gap-1 mt-0.5">
              <Flame size={13} /> {result.currentStreak} DAYS
            </strong>
          </div>
        </div>

        {/* Build Evolution Badge if changed */}
        {result.build && (
          <div className="p-2.5 my-3 bg-[#191610] border border-[#715423] rounded text-left font-mono">
            <span className="text-[10px] text-amber-500/80 tracking-widest block">CURRENT BUILD PROFILE</span>
            <strong className="text-amber-400 text-xs block mt-0.5">{result.build.name.toUpperCase()}</strong>
            <p className="text-[11px] text-[#8e9799] mt-0.5 leading-snug">{result.build.description}</p>
          </div>
        )}

        {result.didLevelUp && (
          <div className="level-shift my-3 flex items-center justify-between p-2.5 border border-amber-600/40 bg-amber-950/30 rounded font-mono">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <b className="text-amber-400 text-xs">LEVEL {result.newLevel} ASCENDANCE</b>
            </div>
            <button
              onClick={() => {
                onClose()
                if (onLevelUpTrigger) onLevelUpTrigger()
              }}
              className="text-[11px] text-amber-300 underline font-semibold cursor-pointer"
            >
              VIEW EVOLUTION
            </button>
          </div>
        )}

        <button className="quick-add modal-submit w-full justify-center mt-2" onClick={onClose} autoFocus>
          CONTINUE OPERATING <ArrowUpRight size={14} />
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
    <div
      className="levelup-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="levelup-modal relative text-center max-w-md w-full p-8 border border-amber-600/50 bg-[#14120e] shadow-[0_0_50px_rgba(215,166,70,0.15)]"
      >
        <button
          className="levelup-close absolute top-4 right-4 text-[#7b8586] hover:text-[#e7e8e4]"
          onClick={onClose}
          aria-label="Close celebration"
        >
          <X size={18} />
        </button>

        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="levelup-mark flex items-center justify-center gap-3 my-4 font-mono"
        >
          <span className="text-base text-slate-400">LEVEL {previousLevel}</span>
          <ArrowUpRight size={28} className="text-amber-400" />
          <strong className="text-4xl text-amber-400 font-bold">{newLevel}</strong>
        </motion.div>

        <h2 className="text-2xl font-mono text-[#e7e8e4] tracking-wider my-2">LEVEL UP</h2>
        <p className="levelup-copy text-xs text-[#7b8586] font-mono leading-relaxed max-w-xs mx-auto">
          You reached <b className="text-amber-400">LEVEL {newLevel}</b>. Your real-world actions are creating true character growth.
        </p>

        <div className="levelup-reward my-5 p-4 border border-[#80652f] bg-[#211c12] font-mono text-left space-y-1">
          <span className="text-[10px] text-amber-500/80 tracking-widest block">CHARACTER ASCENDANCE UNLOCKED</span>
          <strong className="text-sm text-amber-400 block">LEVEL {newLevel} OPERATOR PROFILE</strong>
          <span className="text-xs text-[#8e9799] block">+XP capacity and expanded armory eligibility unlocked.</span>
        </div>

        <button className="levelup-button w-full justify-center" onClick={onClose} autoFocus>
          <Sparkles size={16} /> CLAIM CHARACTER EVOLUTION
        </button>
      </motion.div>
    </div>
  )
}

interface WhyThisBuildModalProps {
  character: CharacterRow
  onClose: () => void
}

export function WhyThisBuildModal({ character, onClose }: WhyThisBuildModalProps) {
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
    { label: 'INTELLECT', code: 'intellect', val: character.intellect, icon: Brain, detail: 'Coding, studying, technical reading' },
    { label: 'STRENGTH', code: 'strength', val: character.strength, icon: Dumbbell, detail: 'Gym, resistance, physical endurance' },
    { label: 'DISCIPLINE', code: 'discipline', val: character.discipline, icon: Shield, detail: 'Morning routine, meditation, order' },
    { label: 'VITALITY', code: 'vitality', val: character.vitality, icon: HeartPulse, detail: 'Running, hydration, cardio' },
    { label: 'CREATIVITY', code: 'creativity', val: character.creativity, icon: Sparkles, detail: 'UI design, writing, digital music' },
  ].sort((a, b) => b.val - a.val)

  const top1 = stats[0]
  const top2 = stats[1]

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="quest-modal panel max-w-xl w-full relative max-h-[90vh] overflow-y-auto"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close why this build modal">
          <X size={17} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <HelpCircle size={16} className="text-[#d7a646]" />
          <p className="eyebrow text-[#d7a646]">DETERMINISTIC CLASSIFIER LOG</p>
        </div>
        <h2 className="text-xl font-mono text-[#e7e8e4] my-1">WHY THIS BUILD: {character.archetype.toUpperCase()}</h2>

        <div className="my-4 p-4 border border-[#504426] bg-[#181813] rounded font-mono">
          <p className="eyebrow mb-1">PRIMARY DRIVERS OF YOUR ARCHETYPE</p>
          <strong className="text-amber-400 text-base font-medium block">
            {top1.label} ({top1.val} PTS) + {top2.label} ({top2.val} PTS)
          </strong>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            You became <b className="text-amber-300">{character.archetype}</b> because your completed quests contributed
            most directly to {top1.label} and {top2.label}. Every point is mathematically accounted for from real completed tasks.
          </p>
        </div>

        {/* Current Stat Points */}
        <div className="space-y-2 mb-4 font-mono">
          <p className="eyebrow">YOUR ATTRIBUTE DISTRIBUTION</p>
          {stats.map((s) => {
            const Icon = s.icon
            const isDominant = s.code === top1.code || s.code === top2.code
            return (
              <div
                key={s.label}
                className={`flex justify-between items-center text-xs p-2.5 border rounded ${
                  isDominant
                    ? 'border-amber-500/40 bg-[#1c1912] text-amber-300'
                    : 'border-[#293033] bg-[#111416] text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={15} className={isDominant ? 'text-amber-400' : 'text-[#7b8586]'} />
                  <div>
                    <span className="font-semibold">{s.label}</span>
                    <span className="text-[10px] text-[#7b8586] block">{s.detail}</span>
                  </div>
                </div>
                <span className="font-mono font-bold">{s.val} PTS</span>
              </div>
            )
          })}
        </div>

        {/* What changes your build? */}
        <div className="p-3.5 border border-[#2b3538] bg-[#101416] rounded font-mono text-xs mb-6 space-y-2">
          <p className="eyebrow text-cyan-400">WHAT SHAPES YOUR BUILD?</p>
          <ul className="space-y-1.5 text-[#a4afb2] text-[11px] leading-relaxed">
            <li>• Complete <b>Intellect</b> quests → Shifts archetype toward <i>The Scholar</i> or <i>The Builder</i></li>
            <li>• Complete <b>Discipline</b> quests → Shifts archetype toward <i>The Disciplined</i> or <i>The Strategist</i></li>
            <li>• Complete <b>Strength / Vitality</b> quests → Shifts archetype toward <i>The Warrior</i></li>
            <li>• Complete <b>Creativity</b> quests → Shifts archetype toward <i>The Creator</i></li>
            <li>• Maintain equal focus across all 5 stats → Preserves <i>The Balanced</i></li>
          </ul>
        </div>

        <button className="quick-add modal-submit w-full justify-center" onClick={onClose} autoFocus>
          ACKNOWLEDGE TRAJECTORY <ArrowUpRight size={14} />
        </button>
      </motion.div>
    </div>
  )
}

// Alias for backwards-compatibility
export { WhyThisBuildModal as BuildReflectionModal }
