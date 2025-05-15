'use client'
import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect } from "react"

export default function ModeToggle() {
  const { setTheme } = useTheme()
  const router = useRouter();
  const { data: session, status } = useSession()

  // Redirect to the strategy view page (Placheholder for logged home view)
  useEffect(() => {
    if (status == 'authenticated' && session.user?.name) {
      router.push(`/users/${session.user.name}/strategies`)
    }
  })


  return (
      <main className="h-full bg-background text-foreground flex flex-col items-center justify-center px-3">
      <section className="text-center max-w-xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Backtest Analyzer
        </h1>
        <p className="mt-4 text-muted-foreground">
          Visualize and analyze your algorithmic trading strategy results with interactive charts and insights.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button>Get Started</Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </section>
    </main>
  )
}
