'use client'
import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export default function ModeToggle() {
  const { setTheme } = useTheme()

  return (
      <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4">
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
