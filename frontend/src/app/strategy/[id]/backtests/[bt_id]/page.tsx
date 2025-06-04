'use client'
import useSWR from 'swr'
import { Separator } from "@/components/ui/separator"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Strategy } from "@prisma/client"
import Backtest from "@/app/types/backtest"
import { BacktestChooser } from "@/components/backtest-chooser"
import { Time } from "lightweight-charts"
import { Button } from "@/components/ui/button"
import BacktestChart from "@/components/backtest-chart"
import { CandlestickData } from "lightweight-charts"
import { useMemo } from "react"
import { generateSampleCandlestickData } from "@/utils/sample-data-generator"

interface Props {
  params: {
    id: string;
  }
}

export default function Page({params}: Props) {

  const { id } = useParams()
  const { data, error, isLoading} = useSWR<[Strategy, Backtest[]]>([`/api/strategies/${id}/`, `/api/v1/backtest/${id}`])

  // Generate sample data for chart demonstration (memoized to prevent regeneration)
  const candlestickData = useMemo(() => {
    // Create a date range for the last 3 months
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 3)

    return generateSampleCandlestickData({ start: startDate, end: endDate })

  }, []) // Empty dependency array means this only runs once

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
    <div className="h-full flex flex-col bg-background">
      {/* Header: Backtest Name, Controls, Mobile Menu */}
      <div className="border-b bg-background p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{strategy.name} - Backtest</h1>
            <p className="text-xs text-muted-foreground">Backtest ID: {id}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex overflow-hidden flex-1">
        {/* Left Toolbar */}
        <div className="w-16 border-r bg-muted/30 flex flex-col items-center py-4 gap-2">
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs">
            Tool
          </div>
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs">
            Line
          </div>
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs">
            Rect
          </div>
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs">
            Text
          </div>
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs">
            Arrow
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 bg-background p-4 min-h-0">
            <BacktestChart
              candlestickData={candlestickData}
              className="w-full h-full border rounded"
            />
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="w-80 border-l bg-muted/30 p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Backtest Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Engine:</span>
                  <span className="text-muted-foreground">LEAN</span>
                </div>
                <div className="flex justify-between">
                  <span>Period:</span>
                  <span className="text-muted-foreground">1Y</span>
                </div>
                <div className="flex justify-between">
                  <span>Return:</span>
                  <span className="text-green-600">+12.5%</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Performance</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sharpe Ratio:</span>
                  <span className="text-muted-foreground">1.42</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Drawdown:</span>
                  <span className="text-red-600">-8.3%</span>
                </div>
                <div className="flex justify-between">
                  <span>Win Rate:</span>
                  <span className="text-muted-foreground">68%</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Annotations</h3>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">No annotations yet</div>
                <Button variant="outline" size="sm" className="w-full">
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Timeline Navigator & Event Markers */}
      <div className="h-32 border-t bg-muted/30 p-4 flex-shrink-0">
        <div className="h-full border rounded bg-background flex items-center justify-center">
          <span className="text-muted-foreground">Timeline Navigator & Event Markers</span>
        </div>
      </div>
    </div>
  )
}
