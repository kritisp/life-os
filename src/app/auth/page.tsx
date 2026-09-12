'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, logIn, demoLogin } from '@/features/auth/actions'
import { Terminal, ArrowUpRight, Lock, User, Mail, Zap } from 'lucide-react'

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
    <div className="min-h-screen bg-[#0b0d0f] text-[#e7e8e4] flex items-center justify-center p-4 selection:bg-[#d7a646]/30 relative overflow-hidden">
      <div className="scanlines" aria-hidden="true" />

      <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <main className="w-full max-w-md bg-[#111416] border border-[#293033] p-8 shadow-2xl relative z-10">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[#293033]">
          <div className="w-10 h-10 border border-[#d7a646] bg-[#1a160e] flex items-center justify-center text-[#d7a646]">
            <Terminal size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider font-mono text-[#e7e8e4]">
              LIFE<span className="text-[#d7a646]">{'//'}</span>OS
            </h1>
            <p className="text-xs text-[#7b8586] font-mono">Gamify progress. Not guilt.</p>
          </div>
        </div>

        <div className="flex border-b border-[#293033] mb-6">
          <button
            type="button"
            className={`flex-1 py-2.5 text-xs font-mono tracking-wider font-semibold transition-colors ${
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
            className={`flex-1 py-2.5 text-xs font-mono tracking-wider font-semibold transition-colors ${
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
          <div className="mb-6 p-3 bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-mono rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-[#4d5758] mb-1.5 tracking-wider font-semibold">
                DISPLAY NAME / HANDLE
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-3.5 text-[#4d5758]" />
                <input
                  name="displayName"
                  type="text"
                  placeholder="Operator Name (e.g. Jordan)"
                  required
                  className="w-full bg-[#0d1112] border border-[#303a39] text-[#d6d8cf] pl-9 pr-3 py-2.5 outline-none focus:border-[#9f772d] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#4d5758] mb-1.5 tracking-wider font-semibold">
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
            <label className="block text-[#4d5758] mb-1.5 tracking-wider font-semibold">
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
              ? 'AUTHENTICATING...'
              : mode === 'login'
              ? 'AUTHENTICATE OPERATOR'
              : 'INITIALIZE CHARACTER'}
            <ArrowUpRight size={14} />
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-[#293033]">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="w-full py-2.5 px-3 bg-[#171b1d] border border-[#3b4447] hover:border-[#d7a646] hover:bg-[#20272a] text-[#c6cbcd] font-mono text-[11px] tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Zap size={14} className="text-amber-400" />
            <span>DEMO OPERATOR QUICK ACCESS (BYPASS RATE LIMIT)</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-[#293033] text-center text-[10px] text-[#4d5758] font-mono">
          SERVER AUTHORITATIVE SECURITY SYSTEM • NO CLIENT TAMPERING
        </div>
      </main>
    </div>
  )
}
