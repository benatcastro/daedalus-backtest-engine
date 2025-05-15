'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Strategy } from "@prisma/client"

// type Strategy = {
//   id: number
//   name: string
//   description: string
//   engine: "LEAN" | "BACKTESTING"
// }



export default function StrategyCard({ strategy }: { strategy: Strategy }) {
  return (
    <div className="flex flex-col gap-4 p-4 w-full">
        <Card key={strategy.id}>
          <CardHeader>
            <CardTitle>{strategy.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{strategy.description}</p>
            <p className="text-xs font-medium text-accent-foreground mt-2">Engine: {strategy.engine}</p>
          </CardContent>
        </Card>
    </div>
  )
}
