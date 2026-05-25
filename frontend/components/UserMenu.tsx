"use client"
// frontend/components/UserMenu.tsx
// Drop this next to your existing "📚 Past debates" button in every nav.
// Matches the exact button style already in your nav.

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/context/AuthContext"

export function UserMenu() {
  const { user, loading, signOut, openAuthModal } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // While session loads, show a ghost button so nav doesn't shift
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-400 border border-zinc-800 px-4 py-2 rounded-lg opacity-0">
        ···
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => openAuthModal("login")}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2 rounded-lg transition-all"
        >
          Sign in
        </button>
        <button
          onClick={() => openAuthModal("signup")}
          className="flex items-center gap-2 text-xs text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-all font-medium"
        >
          Sign up
        </button>
      </div>
    )
  }

  // Logged-in state
  const displayName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Debater"
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 text-xs border px-3 py-2 rounded-lg transition-all ${
          open
            ? "text-white border-zinc-600 bg-zinc-800"
            : "text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-600"
        }`}
      >
        {/* Avatar */}
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 overflow-hidden">
          {user.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          ) : initials}
        </div>
        <span className="max-w-[100px] truncate">{displayName}</span>
        <span className="text-zinc-600">{open ? "▲" : "▼"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-[calc(100%+6px)] w-48 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden z-50 shadow-xl"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-white text-xs font-semibold truncate">{displayName}</p>
              <p className="text-zinc-500 text-[11px] truncate">{user.email}</p>
            </div>

            {/* Nav items */}
            <div className="p-1">
              <DropdownItem href="/history" icon="📚" label="Past debates" onClick={() => setOpen(false)} />
              <DropdownItem href="/profile" icon="👤" label="Profile" onClick={() => setOpen(false)} />
            </div>

            {/* Sign out */}
            <div className="p-1 border-t border-zinc-800">
              <button
                onClick={async () => { setOpen(false); await signOut() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all text-left"
              >
                <span>↩</span> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DropdownItem({ href, icon, label, onClick }: {
  href: string; icon: string; label: string; onClick: () => void
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
    >
      <span>{icon}</span> {label}
    </a>
  )
}
