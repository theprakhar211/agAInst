import type { Metadata } from "next"
import "./globals.css"    // ADD THIS LINE

export const metadata: Metadata = {
  title: "agAInst — Challenge Your Thinking",
  description: "Most AI agrees with you. This one won't.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚔️</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}