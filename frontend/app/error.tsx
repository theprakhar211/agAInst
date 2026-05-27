// frontend/app/error.tsx
// Next.js renders this when an unhandled error occurs in any route
// Must be a Client Component

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
          <div className="text-6xl select-none">⚠️</div>

          <div className="space-y-2">
            <p className="text-white font-bold text-xl">Something went wrong</p>
            <p className="text-zinc-500 text-sm leading-relaxed">
              An unexpected error occurred. Your debate progress is saved — you can pick up where you left off.
            </p>
            {error?.digest && (
              <p className="text-zinc-700 text-xs font-mono mt-2">Error ID: {error.digest}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-all"
            >
              Try again
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white rounded-xl text-sm transition-all"
            >
              ← Back to arena
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
