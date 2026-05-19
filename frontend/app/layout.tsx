import type { Metadata } from "next"
import "./globals.css"    // ADD THIS LINE

export const metadata: Metadata = {
  title: "agAInst",
  description: "Most AI agrees with you. This one won't.",
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