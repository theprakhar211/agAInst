// frontend/app/error.tsx
"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error("[agAInst error boundary]", error)
  }, [error])

  return (
    <main className="min-h-screen bg-[#080808] text-white flex flex-col selection:bg-red-500/30">

      {/* BG texture */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-red-600/10 blur-[140px] rounded-full" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-zinc-900 px-6 py-4">
        <div className="flex items-center gap-3 cursor-pointer w-fit" onClick={() => router.push("/")}>
          <Image src="/logo3.png" alt="agAInst logo" width={56} height={56} priority className="rounded-md" />
          <span className="text-xl font-black tracking-tighter uppercase hidden sm:block">
            ag<span className="text-red-600">AIN</span>st
          </span>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-sm w-full"
        >
          {/* Glitchy warning icon */}
          <div className="relative w-20 h-20 mx-auto mb-8 flex items-center justify-center">
            {/* Outer ring */}
            <div className="absolute inset-0 border border-red-500/20 rotate-45" />
            <div className="absolute inset-2 border border-red-500/10 rotate-45" />
            {/* Pulsing glow */}
            <motion.div
              className="absolute inset-0 bg-red-500/5"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-3xl relative z-10">⚠</span>
          </div>

          {/* Error card */}
          <div className="border border-red-500/20 bg-red-500/5 p-6 mb-4 relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-500/40" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-500/40" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-red-500/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-500/40" />

            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-red-500 mb-3">System error</p>
            <p className="text-white font-black text-lg uppercase tracking-tight mb-2">Something went wrong</p>
            <p className="text-zinc-500 text-sm leading-relaxed">
              An unexpected error occurred. Your debate progress is saved — you can pick up where you left off.
            </p>

            {error?.digest && (
              <div className="mt-4 pt-4 border-t border-red-500/10">
                <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">
                  Error ID: <span className="text-zinc-600">{error.digest}</span>
                </p>
              </div>
            )}
          </div>

          {/* Error message if available */}
          {error?.message && (
            <div className="border border-zinc-800 bg-zinc-900/40 px-4 py-3 mb-4 text-left relative">
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700" />
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Details</p>
              <p className="text-xs font-mono text-zinc-500 truncate">{error.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button onClick={reset}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-[0.99]">
              🔄 Try again
            </button>
            <button onClick={() => router.push("/")}
              className="w-full py-3.5 border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 transition-all text-xs font-mono uppercase tracking-widest">
              ← Back to arena
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}