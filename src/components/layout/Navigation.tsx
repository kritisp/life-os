'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Shield,
  Target,
  Swords,
  Package,
  Trophy,
  ChevronRight,
  CircleDot,
  Menu,
  Gem,
  LogOut,
  X,
} from 'lucide-react'
import { logOut } from '@/features/auth/actions'
import { CharacterRow } from '@/types'
import { AnimatedNumber } from '@/components/ui/Motion'

interface NavigationProps {
  character: CharacterRow | null
  userEmail?: string
}

export function Navigation({ character, userEmail }: NavigationProps) {
  const pathname = usePathname()
  const [showMobileNav, setShowMobileNav] = useState(false)

  const navItems = [
    { label: 'Character', href: '/character', icon: Shield },
    { label: 'Quests', href: '/quests', icon: Target },
    { label: 'Quest Chains', href: '/chains', icon: Swords },
    { label: 'Inventory / Shop', href: '/shop', icon: Package },
    { label: 'Achievements', href: '/achievements', icon: Trophy },
  ]

  const currentNavItem =
    navItems.find((item) => item.href === pathname) ||
    (pathname === '/' ? navItems[1] : navItems[0])

  const displayName = character?.name || userEmail?.split('@')[0] || 'OPERATOR'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <>
      {/* Desktop & Open Mobile Sidebar */}
      <aside className={`sidebar ${showMobileNav ? 'mobile-open' : ''}`}>
        <div className="flex justify-between items-center pr-2 md:block">
          <Link href="/character" className="brand" onClick={() => setShowMobileNav(false)}>
            <span className="brand-mark">L</span>
            <span>
              LIFE<span className="brand-slash">{'//'}</span>OS
            </span>
          </Link>

          <button
            className="md:hidden text-[#7b8586] hover:text-[#e7e8e4] p-1"
            onClick={() => setShowMobileNav(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="side-label">OPERATING SYSTEM</div>

        <nav aria-label="Primary navigation" className="nav-list">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href === '/quests' && pathname === '/')
            return (
              <Link
                key={label}
                href={href}
                className={`nav-item relative group ${isActive ? 'active' : ''}`}
                onClick={() => setShowMobileNav(false)}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-[#181d1e] rounded-[4px] border-l-2 border-[#d7a646] -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  size={17}
                  strokeWidth={1.8}
                  className="transition-transform duration-150 group-hover:scale-110"
                />
                <span className="font-mono">{label}</span>
                {isActive && <ChevronRight size={14} className="nav-arrow" />}
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="side-label">SYSTEM STATUS</div>
          <div className="status-line">
            <CircleDot size={12} className="animate-pulse text-emerald-500" />
            <span>Server Authoritative • Online</span>
          </div>
          <div className="version">
            LIFE//OS v1.4.2 <span>•</span> BETA
          </div>
        </div>
      </aside>

      {/* Top Bar */}
      <header className="topbar">
        <button
          className="mobile-menu"
          aria-label="Toggle navigation"
          onClick={() => setShowMobileNav(!showMobileNav)}
        >
          <Menu size={20} />
        </button>

        <div className="breadcrumb">
          <span>CHARACTER</span>
          <ChevronRight size={13} />
          <strong>{currentNavItem.label.toUpperCase()}</strong>
        </div>

        <div className="top-actions">
          <div className="gold-chip">
            <Gem size={14} className="text-[#d7a646]" />
            <AnimatedNumber
              value={character?.gold ?? 0}
              suffix=" GOLD"
              className="font-mono font-semibold"
            />
          </div>

          <div className="profile-chip">
            <span className="avatar">{initials}</span>
            <span className="profile-name hidden sm:inline">{displayName.toUpperCase()}</span>
            <span className="online-dot" />
          </div>

          <form action={logOut}>
            <button
              type="submit"
              className="icon-button hover:text-[#d7a646] transition-colors"
              title="Sign out of LIFE//OS"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </header>
    </>
  )
}
