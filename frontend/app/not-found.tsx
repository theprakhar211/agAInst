// frontend/app/not-found.tsx
"use client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"

export default function NotFound() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#080808] text-white flex flex-col selection:bg-red-500/30">

      {/* BG texture */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-red-600/8 blur-[140px] rounded-full" />
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
          {/* 404 */}
          <div className="relative select-none mb-6">
            <p className="text-[140px] font-black leading-none text-zinc-900 tracking-tighter">404</p>
            <p className="absolute inset-0 flex items-center justify-center text-[140px] font-black leading-none tracking-tighter"
              style={{
                WebkitTextStroke: "1px rgba(220,38,38,0.2)",
                color: "transparent",
              }}>
              404
            </p>
            {/* Horizontal scan line */}
            <motion.div
              className="absolute left-0 right-0 h-px bg-red-600/30"
              initial={{ top: "0%" }}
              animate={{ top: "100%" }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
            />
          </div>

          {/* Label + message */}
          <div className="border border-zinc-800 bg-zinc-900/30 p-6 mb-6 relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-500/30" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-500/30" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-red-500/30" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-500/30" />
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-red-500 mb-3">Signal lost</p>
            <p className="text-white font-black text-lg uppercase tracking-tight mb-2">Page not found</p>
            <p className="text-zinc-500 text-sm leading-relaxed">
              This page doesn't exist or was moved. The debate must go on elsewhere.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button onClick={() => router.push("/")}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-[0.99]">
              ← Back to arena
            </button>
            <button onClick={() => router.push("/history")}
              className="w-full py-3.5 border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 transition-all text-xs font-mono uppercase tracking-widest">
              📚 My debates
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}