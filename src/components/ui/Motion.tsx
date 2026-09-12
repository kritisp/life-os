'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, animate } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedNumber({
  value,
  duration = 0.8,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValueRef = useRef(value)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (shouldReduceMotion) {
      prevValueRef.current = value
      return
    }

    const start = prevValueRef.current
    const end = value

    if (start === end) {
      return
    }

    const controls = animate(start, end, {
      duration,
      ease: [0.16, 1, 0.3, 1], // Custom smooth cubic-bezier easing
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest))
      },
    })

    prevValueRef.current = value

    return () => controls.stop()
  }, [value, duration, shouldReduceMotion])

  const currentValue = shouldReduceMotion ? value : displayValue

  return (
    <span className={className}>
      {prefix}
      {currentValue}
      {suffix}
    </span>
  )
}

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

export const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
}

export function StaggerContainer({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    )
  }

  return (
    <motion.div variants={itemVariants} className={className} onClick={onClick}>
      {children}
    </motion.div>
  )
}

export function PulseGlow({
  children,
  className = '',
  active = true,
}: {
  children: React.ReactNode
  className?: string
  active?: boolean
}) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion || !active) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      animate={{
        opacity: [0.85, 1, 0.85],
        scale: [1, 1.015, 1],
      }}
      transition={{
        duration: 3.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface FloatingRewardProps {
  id: string
  text: string
  type?: 'xp' | 'gold' | 'stat'
  onComplete?: () => void
}

export function FloatingRewardBadge({ text, type = 'xp' }: FloatingRewardProps) {
  const colors = {
    xp: 'text-[#d7a646] border-[#6b5227] bg-[#1a160e]',
    gold: 'text-[#e6b84c] border-[#80652f] bg-[#211c12]',
    stat: 'text-[#5e91b3] border-[#294254] bg-[#111a21]',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: -24, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.95 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
      className={`absolute z-30 pointer-events-none px-2.5 py-1 text-[10px] font-mono font-bold border shadow-lg ${colors[type]}`}
    >
      {text}
    </motion.div>
  )
}
