'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Check, Gem, Zap, AlertTriangle, Info, X } from 'lucide-react'

export interface ToastItem {
  id: string
  title: string
  description?: string
  type?: 'quest_completed' | 'gold' | 'achievement' | 'level_up' | 'error' | 'info'
}

interface ToastContextType {
  addToast: (toast: Omit<ToastItem, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast = { ...toast, id }
      setToasts((prev) => [...prev, newToast])

      setTimeout(() => {
        removeToast(id)
      }, 4000)
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const getIcon = () => {
    switch (toast.type) {
      case 'achievement':
        return <Trophy size={16} className="text-amber-400" />
      case 'quest_completed':
        return <Check size={16} className="text-emerald-400" />
      case 'gold':
        return <Gem size={16} className="text-amber-400" />
      case 'level_up':
        return <Zap size={16} className="text-amber-400" />
      case 'error':
        return <AlertTriangle size={16} className="text-red-400" />
      default:
        return <Info size={16} className="text-sky-400" />
    }
  }

  const getBorderColor = () => {
    switch (toast.type) {
      case 'achievement':
      case 'level_up':
        return 'border-[#80652f] bg-[#1a1711]'
      case 'quest_completed':
        return 'border-[#38543a] bg-[#111a13]'
      case 'error':
        return 'border-[#612826] bg-[#1a1111]'
      default:
        return 'border-[#293033] bg-[#111416]'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`pointer-events-auto flex items-start gap-3 p-3.5 border shadow-xl ${getBorderColor()}`}
    >
      <div className="mt-0.5 shrink-0">{getIcon()}</div>
      <div className="flex-1 min-w-0 font-mono">
        <strong className="text-xs font-semibold uppercase tracking-wider text-[#e7e8e4] block">
          {toast.title}
        </strong>
        {toast.description && (
          <p className="text-[11px] text-[#7b8586] mt-0.5 leading-snug">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-[#4d5758] hover:text-[#e7e8e4] transition-colors p-0.5"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}
