import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"
import { AuthModal } from "@/components/AuthModal"
import { MigrationRunner } from "@/components/MigrationRunner"

export const metadata: Metadata = {
  title: "agAInst — Challenge Your Thinking",
  description: "Most AI agrees with you. This one won't.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚔️</text></svg>",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <AuthModal />         {/* global modal, triggered via useAuth().openAuthModal() */}
          <MigrationRunner />   {/* runs once on first login to push localStorage → cloud */}
        </AuthProvider>
      </body>
    </html>
  )
}