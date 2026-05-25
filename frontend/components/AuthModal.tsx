"use client"
// frontend/components/AuthModal.tsx
// Matches agAInst's existing dark aesthetic: bg-[#080808], zinc palette, red accents

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/context/AuthContext"

export function AuthModal() {
  const {
    authModalOpen, authModalMode, closeAuthModal,
    signInWithGoogle, signInWithEmail, signUpWithEmail,
  } = useAuth()

  const [mode, setMode] = useState<"login" | "signup">(authModalMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authModalOpen) {
      setMode(authModalMode)
      setError(null)
      setEmailSent(false)
      setEmail("")
      setPassword("")
      setTimeout(() => emailRef.current?.focus(), 120)
    }
  }, [authModalOpen, authModalMode])

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) { setError("Please fill in all fields."); return }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return }
    setSubmitting(true)
    setError(null)
    const fn = mode === "login" ? signInWithEmail : signUpWithEmail
    const { error } = await fn(email, password)
    setSubmitting(false)
    if (error) { setError(error) }
    else if (mode === "signup") { setEmailSent(true) }
    else { closeAuthModal() }
  }

  async function handleGoogle() {
    setSubmitting(true)
    await signInWithGoogle()
    // redirect happens — no need to setSubmitting(false)
  }

  if (!authModalOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && closeAuthModal()}
      >
        <motion.div
          key="modal"
          className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-8 relative"
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
        >
          {/* Close */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 transition-colors text-lg leading-none"
          >
            ✕
          </button>

          {/* Logo text */}
          <div className="mb-7 text-center select-none">
            <div className="text-xl font-black tracking-tight mb-1">
              <span className="text-red-500">ag</span>
              <span className="text-white">AI</span>
              <span className="text-red-500">nst</span>
            </div>
            <p className="text-zinc-500 text-xs">
              {mode === "login" ? "Welcome back, debater." : "Join the arena."}
            </p>
          </div>

          {emailSent ? (
            <div className="text-center py-4 space-y-3">
              <div className="text-4xl">📬</div>
              <p className="text-white font-semibold text-sm">Check your email</p>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Confirmation link sent to <span className="text-zinc-300">{email}</span>
              </p>
              <button
                onClick={closeAuthModal}
                className="mt-4 w-full py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white rounded-xl text-sm transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-3 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-700 hover:border-zinc-500 rounded-xl text-sm text-zinc-300 hover:text-white transition-all mb-4"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-zinc-600 text-xs">or</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              {/* Fields */}
              <div className="space-y-3 mb-4">
                <input
                  ref={emailRef}
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null) }}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none transition-colors"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none transition-colors"
                />
              </div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mb-3 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all"
              >
                {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              </button>

              {/* Toggle */}
              <p className="text-center text-xs text-zinc-600 mt-4">
                {mode === "login" ? "No account? " : "Already have one? "}
                <button
                  onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null) }}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="flex-shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
