"use client"
// frontend/components/MigrationRunner.tsx
// Invisible component that runs once when a user first logs in.
// Pushes any existing localStorage debates to Supabase.

import { useEffect, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { migrateLocalToCloud } from "@/lib/cloudStorage"

export function MigrationRunner() {
  const { user } = useAuth()
  const hasRun = useRef(false)

  useEffect(() => {
    if (user && !hasRun.current) {
      hasRun.current = true
      migrateLocalToCloud(user.id)
    }
  }, [user])

  return null // renders nothing
}
