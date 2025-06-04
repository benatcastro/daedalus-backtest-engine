'use client'
import { prisma } from "@/lib/prisma"
import useSWR from 'swr'
import { Separator } from "@/components/ui/separator"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Strategy } from "@prisma/client"
import Backtest from "@/app/types/backtest"
import BacktestEngine from "@/app/types/backtest-engine"
import { BacktestChooser } from "@/components/backtest-chooser"
import BacktestHistoricalChart from "@/components/backtest-historical-chart"
import { Time } from "lightweight-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface Props {
  params: {
    id: string;
  }
}

const placeholderData = Array.from({ length: 50 }, (_, i) => {
  const time = Date.now() - (i * 60 * 60 * 1000); // Generate time in reverse order
  const open = Math.random() * 100 + 50; // Random open price between 50 and 150
  const high = open + Math.random() * 10; // Random high price slightly above the open
  const low = open - Math.random() * 10; // Random low price slightly below the open
  const close = Math.random() * (high - low) + low; // Random close price between low and high



  return {
    time, // Time in milliseconds
    open: parseFloat(open.toFixed(2)),
    high: parseFloat(high.toFixed(2)),
    low: parseFloat(low.toFixed(2)),
    close: parseFloat(close.toFixed(2)),
  };
}).reverse(); // Reverse the array to ensure ascending order by time


export default function Page({params}: Props) {

  const { id } = useParams()
  const { data, error, isLoading} = useSWR<[Strategy, Backtest[]]>([`/api/strategies/${id}/`, `/backtest/${id}`])

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
      <>
        <div>
          <h2 className="text-4xl font-bold">{strategy.name}</h2>
          <Separator className="my-4"/>
        </div>
        <Card className="w-full h-[64rem]">
          <CardHeader>
            <BacktestChooser />
          </CardHeader>
          <CardContent>
            <div className="h-[56rem] w-full">
              <BacktestHistoricalChart data={placeholderData}/>
            </div>
          </CardContent>
        </Card>
      </>
    )
}
