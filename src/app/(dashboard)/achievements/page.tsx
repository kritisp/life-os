'use client'

import React, { useEffect, useState } from 'react'
import { Trophy, Flame, Swords, Zap, Award, ShieldAlert, ShoppingBag, CheckCircle } from 'lucide-react'
import { getAchievements } from '@/features/achievements/actions'
import { StaggerContainer, StaggerItem, AnimatedNumber } from '@/components/ui/Motion'

interface AchievementItem {
  id: string
  code: string
  title: string
  description: string
  badge_icon: string
  xp_reward: number
  gold_reward: number
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
  const totalScore = achievements
    .filter((a) => a.isUnlocked)
    .reduce((acc, curr) => acc + (curr.xp_reward || 150), 0)

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
          <div className="quick-add font-mono text-xs">
            <Trophy size={15} /> MILESTONE MATRIX
          </div>
        </div>
      </StaggerItem>

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-[#7b8586] border border-[#293033] bg-[#111416]">
          LOADING MILESTONE DATA...
        </div>
      ) : (
        <div className="achievement-page-grid">
          <section className="achievement-wall">
            {achievements.map((ach) => {
              const IconComponent = getBadgeIcon(ach.badge_icon)

              return (
                <StaggerItem key={ach.id}>
                  <article
                    className={`panel achievement-card relative ${
                      ach.isUnlocked ? 'unlocked border-[#d7a646]/50 bg-[#16140e]' : 'border-[#262d30] opacity-80'
                    }`}
                  >
                    <span
                      className={`achievement-icon ${
                        ach.isUnlocked
                          ? 'text-[#d7a646] bg-[#2a2110] border-[#715423]'
                          : 'text-[#4d5758] bg-[#111416] border-[#293033]'
                      }`}
                    >
                      <IconComponent size={21} />
                    </span>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="eyebrow text-[10px]">
                          {ach.isUnlocked ? 'MILESTONE CLAIMED' : 'LOCKED MILESTONE'}
                        </p>
                        {ach.isUnlocked && (
                          <CheckCircle size={12} className="text-emerald-400 inline" />
                        )}
                      </div>
                      <h2 className="font-mono text-sm">{ach.title.toUpperCase()}</h2>
                      <p className="text-xs text-[#7b8586]">{ach.description}</p>
                    </div>

                    <div className="text-right font-mono text-xs shrink-0">
                      <strong className={ach.isUnlocked ? 'text-amber-400 block' : 'text-[#4d5758] block'}>
                        {ach.isUnlocked ? 'UNLOCKED' : 'IN PROGRESS'}
                      </strong>
                      {ach.isUnlocked && ach.unlockedAt && (
                        <span className="text-[10px] text-[#7b8586] block mt-0.5">
                          {new Date(ach.unlockedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
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
                <AnimatedNumber value={totalScore || unlockedCount * 250} />
              </strong>
              <span className="text-xs font-mono text-[#7b8586]">ACHIEVEMENT XP POINTS</span>

              <div className="aside-rule" />

              <p className="eyebrow">MILESTONE TRACKING</p>
              <h3 className="font-mono text-sm text-[#e7e8e4] my-1">REAL-WORLD PROOF</h3>
              <p className="text-xs font-mono text-[#7b8586] leading-relaxed">
                Achievements are mathematically verified records of sustained operator focus, streaks, and quest execution.
              </p>
            </StaggerItem>
          </aside>
        </div>
      )}
    </StaggerContainer>
  )
}
