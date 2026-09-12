'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'
import { logOut } from '@/features/auth/actions'
import { CharacterRow } from '@/types'

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
      <aside className={`sidebar ${showMobileNav ? 'mobile-open' : ''}`}>
        <Link href="/character" className="brand" onClick={() => setShowMobileNav(false)}>
          <span className="brand-mark">L</span>
          <span>
            LIFE<span className="brand-slash">{'//'}</span>OS
          </span>
        </Link>

        <div className="side-label">OPERATING SYSTEM</div>

        <nav aria-label="Primary navigation" className="nav-list">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href === '/quests' && pathname === '/')
            return (
              <Link
                key={label}
                href={href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setShowMobileNav(false)}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
                {isActive && <ChevronRight size={14} className="nav-arrow" />}
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="side-label">SYSTEM STATUS</div>
          <div className="status-line">
            <CircleDot size={12} />
            <span>Server Authoritative • Online</span>
          </div>
          <div className="version">
            LIFE//OS v1.4.2 <span>•</span> BETA
          </div>
        </div>
      </aside>

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
            <Gem size={14} />
            <span>{character?.gold ?? 0} GOLD</span>
          </div>

          <div className="profile-chip">
            <span className="avatar">{initials}</span>
            <span className="profile-name">{displayName.toUpperCase()}</span>
            <span className="online-dot" />
          </div>

          <form action={logOut}>
            <button
              type="submit"
              className="icon-button"
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
