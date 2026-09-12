'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, logIn, demoLogin } from '@/features/auth/actions'
import { Terminal, ArrowUpRight, Lock, User, Mail, Zap, ArrowRight, ShieldCheck } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleDemoLogin() {
    setIsSubmitting(true)
    setErrorMsg(null)
    const res = await demoLogin()
    setIsSubmitting(false)
    if (res?.error) {
      setErrorMsg(res.error)
    } else {
      router.push('/quests')
      router.refresh()
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)
    const action = mode === 'login' ? logIn : signUp

    const res = await action(formData)

    setIsSubmitting(false)
    if (res?.error) {
      setErrorMsg(res.error)
    } else {
      router.push('/quests')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0d0f] text-[#e7e8e4] flex flex-col items-center justify-center p-4 selection:bg-[#d7a646]/30 relative overflow-hidden">
      <div className="scanlines" aria-hidden="true" />

      <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <main className="w-full max-w-xl bg-[#111416] border border-[#293033] p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="flex items-center gap-3 pb-5 border-b border-[#293033]">
          <div className="w-10 h-10 border border-[#d7a646] bg-[#1a160e] flex items-center justify-center text-[#d7a646] shrink-0">
            <Terminal size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider font-mono text-[#e7e8e4]">
              LIFE<span className="text-[#d7a646]">{'//'}</span>OS
            </h1>
            <p className="text-xs text-[#d7a646] font-mono font-medium tracking-wide">GAMIFY PROGRESS. NOT GUILT.</p>
          </div>
        </div>

        {/* Core Concept Loop Visualization (PART V) */}
        <div className="p-3.5 bg-[#0e1112] border border-[#222a2c] rounded font-mono">
          <p className="text-[10px] text-[#7b8586] tracking-widest uppercase mb-2">THE PROGRESSION ENGINE</p>
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-[#aeb6b8]">
            <span className="px-2 py-1 bg-[#161a1c] border border-[#2d3638] rounded text-[#d6d8cf]">REAL ACTION</span>
            <ArrowRight size={11} className="text-[#d7a646]" />
            <span className="px-2 py-1 bg-[#161a1c] border border-[#2d3638] rounded text-[#d6d8cf]">QUEST</span>
            <ArrowRight size={11} className="text-[#d7a646]" />
            <span className="px-2 py-1 bg-[#161a1c] border border-[#2d3638] rounded text-amber-300">XP & STATS</span>
            <ArrowRight size={11} className="text-[#d7a646]" />
            <span className="px-2 py-1 bg-[#1e1910] border border-[#715423] rounded text-amber-400 font-semibold">
              BUILD EVOLUTION
            </span>
          </div>
          <p className="text-[10px] text-[#6e7779] mt-2">
            No streak shaming or negative XP. Your real-world effort directly shapes a deterministic RPG identity.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-[#293033]">
          <button
            type="button"
            className={`flex-1 py-2.5 text-xs font-mono tracking-wider font-semibold transition-colors cursor-pointer ${
              mode === 'login'
                ? 'text-[#d7a646] border-b-2 border-[#d7a646] bg-[#181d1e]/50'
                : 'text-[#7b8586] hover:text-[#e7e8e4]'
            }`}
            onClick={() => {
              setMode('login')
              setErrorMsg(null)
            }}
          >
            ACCESS OPERATOR
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-xs font-mono tracking-wider font-semibold transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'text-[#d7a646] border-b-2 border-[#d7a646] bg-[#181d1e]/50'
                : 'text-[#7b8586] hover:text-[#e7e8e4]'
            }`}
            onClick={() => {
              setMode('signup')
              setErrorMsg(null)
            }}
          >
            REGISTER OPERATOR
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-mono rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-[#7b8586] mb-1.5 tracking-wider font-semibold">
                DISPLAY NAME / CALLSIGN
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-3.5 text-[#4d5758]" />
                <input
                  name="displayName"
                  type="text"
                  placeholder="Operator Handle (e.g. Jordan)"
                  required
                  className="w-full bg-[#0d1112] border border-[#303a39] text-[#d6d8cf] pl-9 pr-3 py-2.5 outline-none focus:border-[#9f772d] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#7b8586] mb-1.5 tracking-wider font-semibold">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3.5 text-[#4d5758]" />
              <input
                name="email"
                type="email"
                placeholder="operator@life-os.net"
                required
                className="w-full bg-[#0d1112] border border-[#303a39] text-[#d6d8cf] pl-9 pr-3 py-2.5 outline-none focus:border-[#9f772d] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#7b8586] mb-1.5 tracking-wider font-semibold">
              SECURITY KEY (PASSWORD)
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-3.5 text-[#4d5758]" />
              <input
                name="password"
                type="password"
                placeholder="••••••••••••"
                required
                className="w-full bg-[#0d1112] border border-[#303a39] text-[#d6d8cf] pl-9 pr-3 py-2.5 outline-none focus:border-[#9f772d] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 py-3 px-4 bg-[#241e12] border border-[#705728] hover:border-[#d7a646] hover:bg-[#382a15] text-[#dbad50] font-mono font-semibold text-xs tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isSubmitting
              ? 'AUTHORIZING...'
              : mode === 'login'
              ? 'AUTHENTICATE OPERATOR'
              : 'INITIALIZE CHARACTER PROFILE'}
            <ArrowUpRight size={14} />
          </button>
        </form>

        <div className="pt-2 border-t border-[#293033]">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="w-full py-2.5 px-3 bg-[#171b1d] border border-[#3b4447] hover:border-[#d7a646] hover:bg-[#20272a] text-[#c6cbcd] font-mono text-[11px] tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Zap size={14} className="text-amber-400" />
            <span>DEMO OPERATOR INSTANT ACCESS</span>
          </button>
        </div>

        <div className="pt-2 border-t border-[#293033] flex items-center justify-center gap-1.5 text-[10px] text-[#4d5758] font-mono">
          <ShieldCheck size={12} className="text-[#647274]" />
          <span>SERVER AUTHORITATIVE SECURITY · SCRYPT HASHING · FAIL-CLOSED SESSIONS</span>
        </div>
      </main>
    </div>
  )
}
