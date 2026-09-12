'use client'

import React, { useEffect, useState } from 'react'
import { Trophy, Flame, Swords, Zap, Award, ShieldAlert, ShoppingBag } from 'lucide-react'
import { getAchievements } from '@/features/achievements/actions'
import { StaggerContainer, StaggerItem, AnimatedNumber } from '@/components/ui/Motion'

interface AchievementItem {
  id: string
  code: string
  title: string
  description: string
  badge_icon: string
  isUnlocked: boolean
  unlockedAt: string | null
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    getAchievements().then((list) => {
      if (isMounted) {
        setAchievements(list as unknown as AchievementItem[])
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Swords':
        return Swords
      case 'Zap':
        return Zap
      case 'Flame':
        return Flame
      case 'Trophy':
        return Trophy
      case 'ShieldAlert':
        return ShieldAlert
      case 'ShoppingBag':
        return ShoppingBag
      default:
        return Award
    }
  }

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <div className="hero-heading">
          <div>
            <p className="eyebrow">
              PROOF OF WORK · {unlockedCount} / {achievements.length} UNLOCKED
            </p>
            <h1>
              LEAVE A <em>TRACE.</em>
            </h1>
          </div>
          <div className="quick-add">
            <Trophy size={15} /> MILESTONE MATRIX
          </div>
        </div>
      </StaggerItem>

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-[#7b8586] border border-[#293033] bg-[#111416]">
          LOADING ACHIEVEMENTS...
        </div>
      ) : (
        <div className="achievement-page-grid">
          <section className="achievement-wall">
            {achievements.map((ach) => {
              const IconComponent = getBadgeIcon(ach.badge_icon)

              return (
                <StaggerItem key={ach.id}>
                  <article
                    className={`panel achievement-card ${ach.isUnlocked ? 'unlocked' : ''}`}
                  >
                    <span className="achievement-icon">
                      <IconComponent size={21} />
                    </span>

                    <div>
                      <p className="eyebrow">{ach.isUnlocked ? 'UNLOCKED' : 'LOCKED'}</p>
                      <h2>{ach.title.toUpperCase()}</h2>
                      <p>{ach.description}</p>
                    </div>

                    <strong>
                      {ach.isUnlocked && ach.unlockedAt
                        ? `UNLOCKED ON ${new Date(ach.unlockedAt).toLocaleDateString()}`
                        : 'IN PROGRESS'}
                    </strong>
                  </article>
                </StaggerItem>
              )
            })}
          </section>

          <aside className="achievement-score panel">
            <StaggerItem>
              <Trophy size={25} className="text-[#d7a646]" />
              <p className="eyebrow mt-3">TOTAL UNLOCKED SCORE</p>
              <strong className="text-3xl font-mono text-[#e7e8e4] block my-1">
                <AnimatedNumber value={unlockedCount * 250} />
              </strong>
              <span className="text-xs font-mono text-[#7b8586]">ACHIEVEMENT XP POINTS</span>

              <div className="aside-rule" />

              <p className="eyebrow">NEXT MILESTONE UNLOCK</p>
              <h3 className="font-mono text-sm text-[#e7e8e4] my-1">STREAK ENGINE</h3>
              <p className="text-xs font-mono text-[#7b8586]">
                Maintain an active quest streak for 7 consecutive days to claim Unstoppable Force.
              </p>
            </StaggerItem>
          </aside>
        </div>
      )}
    </StaggerContainer>
  )
}
