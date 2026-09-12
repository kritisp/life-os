'use client'

import React, { useEffect, useState } from 'react'
import { Swords, Plus, X } from 'lucide-react'
import { getQuestChains, createQuestChain } from '@/features/chains/actions'
import { QuestChainWithDetails } from '@/types'

export default function QuestChainsPage() {
  const [chains, setChains] = useState<QuestChainWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    await createQuestChain(title, description)
    setIsSubmitting(false)
    setShowModal(false)
    reloadChains()
  }

  return (
    <>
      <div className="hero-heading">
        <div>
          <p className="eyebrow">LONG-TERM PROGRESSION · {chains.length} PATHS</p>
          <h1>
            FOLLOW THE <em>THREAD.</em>
          </h1>
        </div>
        <button className="quick-add" onClick={() => setShowModal(true)}>
          <Swords size={15} /> NEW CHAIN
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-[#7b8586] border border-[#293033] bg-[#111416]">
          LOADING QUEST CHAINS...
        </div>
      ) : chains.length === 0 ? (
        <div className="p-12 text-center border border-[#293033] bg-[#111416] space-y-4">
          <Swords size={32} className="mx-auto text-[#d7a646]" />
          <p className="text-sm font-mono text-[#e7e8e4]">NO ACTIVE QUEST CHAINS</p>
          <p className="text-xs font-mono text-[#7b8586] max-w-sm mx-auto">
            Create an ordered quest chain (e.g. THE DEVELOPER&apos;S PATH) to group complex multi-stage objectives.
          </p>
          <button className="quick-add mx-auto" onClick={() => setShowModal(true)}>
            <Plus size={15} /> FORGE FIRST QUEST CHAIN
          </button>
        </div>
      ) : (
        <div className="chains-grid">
          {chains.map((chain) => {
            const percentage =
              chain.totalSteps > 0
                ? Math.round((chain.completedSteps / chain.totalSteps) * 100)
                : 0

            return (
              <article className="panel chain-card" key={chain.id}>
                <div className="chain-card-top">
                  <span className="chain-badge">
                    <Swords size={19} />
                  </span>
                  <span className="eyebrow">ACTIVE PATH</span>
                  <b>{chain.isCompleted ? 'CAMPAIGN COMPLETE' : `STAGE ${chain.currentStage}`}</b>
                </div>

                <h2>{chain.title.toUpperCase()}</h2>
                <p>{chain.description || 'Ordered multi-step progression chain'}</p>

                <div className="chain-progress-row">
                  <span>
                    {chain.completedSteps} / {chain.totalSteps} QUESTS
                  </span>
                  <strong>{percentage}%</strong>
                </div>

                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${percentage}%` }} />
                </div>
              </article>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="quest-modal panel">
            <button className="modal-close" onClick={() => setShowModal(false)}>
              <X size={17} />
            </button>

            <p className="eyebrow">CAMPAIGN FORGING · NEW ENTRY</p>
            <h2>CREATE QUEST CHAIN</h2>
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
                className="quick-add modal-submit mt-4"
              >
                <Swords size={15} />
                {isSubmitting ? 'FORGING CHAIN...' : 'CREATE QUEST CHAIN'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
