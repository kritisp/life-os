import { APP_NAME, TAGLINE } from "@/lib/constants";
import { Terminal, Shield, Zap, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-cyan-500/30">
      <main className="w-full max-w-2xl border border-slate-800 bg-slate-950/80 rounded-xl p-8 shadow-2xl backdrop-blur relative overflow-hidden">
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-slate-100 font-mono">
              {APP_NAME}
            </h1>
            <p className="text-sm text-slate-400 font-medium">{TAGLINE}</p>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-6 space-y-4 text-sm text-slate-300">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="flex items-center gap-2 text-slate-400 font-mono">
              <Shield className="w-4 h-4 text-cyan-400" /> System Status
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              FOUNDATION ONLINE
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="flex items-center gap-2 text-slate-400 font-mono">
              <Zap className="w-4 h-4 text-amber-400" /> Architecture
            </span>
            <span className="text-xs font-mono text-slate-300">
              Next.js 16 App Router + Supabase SSR
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="flex items-center gap-2 text-slate-400 font-mono">
              <Sparkles className="w-4 h-4 text-purple-400" /> Security Layer
            </span>
            <span className="text-xs font-mono text-slate-300">
              Server-Authoritative RLS Engine
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-xs text-slate-500 font-mono text-center">
          LIFE//OS v0.1.0-alpha • Phase 0-9 Initialization Complete
        </div>
      </main>
    </div>
  );
}
