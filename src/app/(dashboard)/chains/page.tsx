'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Swords, Plus, X } from 'lucide-react'
import { getQuestChains, createQuestChain } from '@/features/chains/actions'
import { QuestChainWithDetails } from '@/types'
import { StaggerContainer, StaggerItem, AnimatedNumber } from '@/components/ui/Motion'
import { useToast } from '@/components/ui/Toast'

export default function QuestChainsPage() {
  const [chains, setChains] = useState<QuestChainWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { addToast } = useToast()

  const reloadChains = () => {
    getQuestChains().then((list) => {
      setChains(list)
      setLoading(false)
    })
  }

  useEffect(() => {
    let isMounted = true
    getQuestChains().then((list) => {
      if (isMounted) {
        setChains(list)
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  async function handleCreateChain(formData: FormData) {
    setIsSubmitting(true)
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    const res = await createQuestChain(title, description)
    setIsSubmitting(false)

    if (res.error) {
      addToast({
        title: 'CREATION FAILED',
        description: res.error,
        type: 'error',
      })
    } else {
      setShowModal(false)
      reloadChains()
      addToast({
        title: 'CAMPAIGN FORGED',
        description: `Quest chain "${title}" activated.`,
        type: 'info',
      })
    }
  }

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <div className="hero-heading">
          <div>
            <p className="eyebrow">LONG-TERM PROGRESSION · {chains.length} ACTIVE CAMPAIGNS</p>
            <h1>
              FOLLOW THE <em>THREAD.</em>
            </h1>
          </div>
          <button className="quick-add group" onClick={() => setShowModal(true)}>
            <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
            FORGE CAMPAIGN
          </button>
        </div>
      </StaggerItem>

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-[#7b8586] border border-[#293033] bg-[#111416]">
          INITIALIZING CAMPAIGN DATA...
        </div>
      ) : chains.length === 0 ? (
        <StaggerItem>
          <div className="p-12 text-center border border-[#293033] bg-[#111416] space-y-4">
            <Swords size={32} className="mx-auto text-[#d7a646]" />
            <p className="text-sm font-mono text-[#e7e8e4]">NO ACTIVE QUEST CHAINS</p>
            <p className="text-xs font-mono text-[#7b8586] max-w-sm mx-auto">
              Create an ordered campaign path (e.g. THE DEVELOPER&apos;S PATH) to group multi-stage objectives and track deep momentum.
            </p>
            <button className="quick-add mx-auto" onClick={() => setShowModal(true)}>
              <Plus size={15} /> FORGE FIRST QUEST CHAIN
            </button>
          </div>
        </StaggerItem>
      ) : (
        <div className="chains-grid">
          {chains.map((chain) => {
            const percentage =
              chain.totalSteps > 0
                ? Math.round((chain.completedSteps / chain.totalSteps) * 100)
                : 0

            return (
              <StaggerItem key={chain.id}>
                <article className="panel chain-card">
                  <div className="chain-card-top">
                    <span className="chain-badge">
                      <Swords size={19} />
                    </span>
                    <span className="eyebrow">ACTIVE PATH</span>
                    <b className="font-mono text-xs">
                      {chain.isCompleted ? 'CAMPAIGN COMPLETE' : `STAGE ${chain.currentStage}`}
                    </b>
                  </div>

                  <h2 className="font-mono text-base mt-2">{chain.title.toUpperCase()}</h2>
                  <p className="text-xs text-[#7b8586] mt-1">{chain.description || 'Ordered multi-step progression chain'}</p>

                  <div className="chain-progress-row font-mono text-xs mt-4">
                    <span className="text-[#8e9799]">
                      <AnimatedNumber value={chain.completedSteps} /> / {chain.totalSteps} QUESTS COMPLETE
                    </span>
                    <strong className="text-amber-400">{percentage}%</strong>
                  </div>

                  <div className="progress-track overflow-hidden mt-1.5">
                    <motion.div
                      className="progress-fill h-full bg-[#d7a646]"
                      initial={{ width: '0%' }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </article>
              </StaggerItem>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="quest-modal panel max-w-lg w-full relative"
          >
            <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close modal">
              <X size={17} />
            </button>

            <p className="eyebrow">CAMPAIGN FORGING · NEW ENTRY</p>
            <h2>FORGE QUEST CHAIN</h2>
            <p className="modal-copy">Define an ordered multi-stage quest line for complex goals.</p>

            <form action={handleCreateChain} className="quest-form">
              <label>
                CAMPAIGN TITLE
                <input
                  name="title"
                  placeholder="e.g. THE DEVELOPER'S PATH"
                  required
                  autoFocus
                />
              </label>

              <label>
                DESCRIPTION
                <textarea
                  name="description"
                  placeholder="Describe the long-term milestone sequence..."
                  rows={3}
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="quick-add modal-submit mt-4 w-full justify-center"
              >
                <Swords size={15} />
                {isSubmitting ? 'FORGING CHAIN...' : 'FORGE QUEST CHAIN'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </StaggerContainer>
  )
}
