// frontend/app/not-found.tsx
// Next.js catches all unmatched routes and renders this automatically

"use client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"

export default function NotFound() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#080808] text-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
          <Image src="/logo3.png" alt="agAInst logo" width={102} height={102} priority className="rounded-lg" />
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6 max-w-sm"
        >
          {/* Big 404 */}
          <div className="relative select-none">
            <p className="text-[120px] font-black leading-none text-zinc-900">404</p>
            <p className="absolute inset-0 flex items-center justify-center text-[120px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-zinc-600 to-zinc-900">
              404
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-white font-bold text-xl">Page not found</p>
            <p className="text-zinc-500 text-sm leading-relaxed">
              This page doesn't exist or was moved. The debate must go on elsewhere.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/")}
              className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-all"
            >
              ← Back to arena
            </button>
            <button
              onClick={() => router.push("/history")}
              className="w-full py-3 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white rounded-xl text-sm transition-all"
            >
              📚 My debates
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
