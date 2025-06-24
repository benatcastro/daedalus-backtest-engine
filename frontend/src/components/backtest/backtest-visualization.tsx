"use client";
import { Separator } from "@/components/ui/separator";
import { Strategy } from "@prisma/client";
import Backtest from "@/types/backtest";
import { Button } from "@/components/ui/button";
import { useCallback, useMemo } from "react";
import { backtestDatesToRange, calculateOptimalInitialViewRange } from "@/utils/sample-data-generator";
import Chart from "@/components/chart/chart";
import { Series } from "@/components/chart/series";
import { useDataFeed } from "@/hooks/use-data-feed";
import { Marker } from "../chart/marker";

interface BacktestVisualizationProps {
  strategy: Strategy;
  backtest: Backtest;
}

import { Order } from "@/types/order";
import { CandlestickData, IRange, SeriesMarker, Time } from "lightweight-charts";

export function BacktestVisualization({
  strategy,
  backtest,
}: BacktestVisualizationProps) {
  // Extract backtest data for chart generation
  const backtestInfo = useMemo(() => {
    const dateRange = backtestDatesToRange(
      backtest.starting_date,
      backtest.ending_date,
    );
    return {
      strategy,
      backtest,
      dateRange: dateRange,
    };
  }, [strategy, backtest]);


  const orderFetcher = useCallback(
    async (range: IRange<Time>) => {
      if (!backtest) return;

      // Create the query params
      const queryParams = new URLSearchParams({
        start: range.from.toString(),
        end: range.to.toString(),
      });

      const toSeriesMarker = (order: Order): SeriesMarker<Time> => ({
        time: (new Date(order.time).getTime() / 1000) as Time,
        position: order.side === "sell" ? 'aboveBar' : 'belowBar',
        color: order.side === "sell" ? '#e91e63' : '#2196F3',
        shape: order.side === "sell" ? 'arrowDown' : 'arrowUp',
        text: order.side === "sell" ? 'Sell' : 'Buy',
      });

      // Form the endpoint
      const endpoint = `${process.env.NEXT_PUBLIC_BACKTEST_BACKEND_URL}/api/v1/backtest/${backtest.id}/orders?${queryParams.toString()}`;
      // Do the fetch
      const response = await fetch(endpoint)
      const data: Order[] = await response.json()
      const markers: SeriesMarker<Time>[] = data.map(toSeriesMarker)
      console.log(`Fetched markers (${range.from} -> ${range.to}): `, markers)
      return markers
    },
    [backtest],
  );

  const candlesticFetcher = useCallback(
    async (range: IRange<Time>) => {
      if (!backtest) return;

      // Create the query params
      const queryParams = new URLSearchParams({
        symbol: "ethusdt",
        start: range.from.toString(),
        end: range.to.toString(),
      });
      interface Entry {
        timestamp: string,
        open: number,
        high: number,
        low: number,
        close: number,
        volume: number
      }

      const toCandleStickData = ({ timestamp, open, high, low, close, volume }: Entry): CandlestickData => ({
        time: (new Date(timestamp).getTime() / 1000) as Time,
        open,
        high,
        low,
        close,
      });

      // Form the endpoint
      const endpoint = `${process.env.NEXT_PUBLIC_BACKTEST_BACKEND_URL}/api/v1/backtest/${backtest.id}/candles?${queryParams.toString()}`;

      // Do the fetch
      const response = await fetch(endpoint)
      const data: Entry[] = await response.json()
      const candles: CandlestickData[] = data.map(toCandleStickData)
      return candles
    },
    [backtest],
  );

  const initialDates = useMemo(() => calculateOptimalInitialViewRange(backtestInfo.dateRange), [backtestInfo.dateRange])

  const [candlesticDataFeed, isCandleStickDataFeedLoading] =
    useDataFeed<CandlestickData>(backtest, candlesticFetcher);

  const [orderDataFeed, isOrderDataFeedLoading] =
    useDataFeed<SeriesMarker<Time>>(backtest, orderFetcher);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header: Backtest Name, Controls, Mobile Menu */}
      <div className="border-b bg-background p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-xl font-bold">
                {strategy.name} - {backtest.name}
              </h1>
              <p className="text-xs text-muted-foreground">
                Backtest ID: {backtest.id} |{" "}
                {backtestInfo.dateRange.start.toLocaleDateString()} -{" "}
                {backtestInfo.dateRange.end.toLocaleDateString()}
              </p>
            </div>
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
          {/* Chart Navigation */}
          <div className="flex-1 bg-background p-4 min-h-0">
            <Chart initialDates={initialDates}>
              {candlesticDataFeed && orderDataFeed? (
                <Series type="candlestick" dataFeed={candlesticDataFeed} main={true}>
                  {/*
                  <Marker
                  type="order"
                  dataFeed={orderDataFeed}
                  />
                  */}
                </Series>
              ) : (
                <h1>Loading candlestick series</h1>
              )}
            </Chart>
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
                  <span className="text-muted-foreground">
                    {Math.ceil(
                      (backtestInfo.dateRange.end.getTime() -
                        backtestInfo.dateRange.start.getTime()) /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current View:</span>
                  <span className="text-muted-foreground text-xs">
                    {backtestInfo.dateRange.start.toLocaleDateString()} -{" "}
                    {backtestInfo.dateRange.end.toLocaleDateString()}
                  </span>
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
                <div className="text-sm text-muted-foreground">
                  No annotations yet
                </div>
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
          <span className="text-muted-foreground">
            Timeline Navigator & Event Markers
          </span>
        </div>
      </div>
    </div>
  );
}
