'use client'
import { prisma } from "@/lib/prisma"
import useSWR from 'swr'
import { Separator } from "@/components/ui/separator"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Strategy } from "@prisma/client"
import Backtest from "@/app/types/backtest"
import { BacktestChooser } from "@/components/backtest-chooser"
import BacktestHistoricalChart from "@/components/backtest-historical-chart"
import { Time } from "lightweight-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { UploadBacktestButton } from "@/components/upload-backtest-button"

interface Props {
  params: {
    id: string;
  }
}

export default function Page({params}: Props) {

  const { id } = useParams()
  const [search, setSearch] = useState("")
  const { data, error, isLoading} = useSWR<[Strategy, Backtest[]]>([`/api/strategies/${id}/`, `/api/v1/backtest/${id}`])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
      </div>
    );
  }
  if (error) {
    console.error(error)
    return <p>Error loading strategy.</p>;
  }
  const [strategy, backtests] = data!;
  console.log(`loading ${isLoading} error: ${error} fetched data: ${JSON.stringify(strategy)} ${JSON.stringify(backtests)}`)

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="w-full flex flex-row gap-x-4">
        <Input
          placeholder="Search backtests by name, strategy or date..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <UploadBacktestButton strategy={strategy} />
      </div>

      {backtests.length === 0 ? (
        <>
          <a>No backtests found </a>
          <UploadBacktestButton strategy={strategy}/>
        </>
      ) : (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {backtests.map(bt => (
            <Card key={bt.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg">{bt.id}</h3>
                <p className="text-sm text-muted-foreground">Strategy: {bt.strategy_id}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
