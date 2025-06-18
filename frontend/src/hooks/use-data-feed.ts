import Backtest from "@/app/types/backtest";
import { DataFeed, TimeBasedData } from "@/lib/data-feed";
import { backtestDatesToRange, calculateOptimalInitialViewRange } from "@/utils/sample-data-generator";
import { IRange, Time } from "lightweight-charts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { boolean } from "zod";


export function useDataFeed<T extends TimeBasedData>(backtest: Backtest | undefined, dataFetcher?: (range: IRange<Time>) => Promise<T[]>) {
  const [isLoading, setIsLoading] = useState(true)

  // Convert the iso string from the backtest object to Dates
  const [backtestBounds, optimalInitialRange] = (useMemo(() => {
      if (backtest) {
        const backtestBounds = backtestDatesToRange(backtest.starting_date, backtest.ending_date)
        const optimalRange = calculateOptimalInitialViewRange(backtestBounds)
        return [backtestBounds, optimalRange]
      }
      return [null, null]
    },
    [backtest]))

  const fetcher = dataFetcher ? dataFetcher : useCallback(async (range: IRange<Time>) => {
    if (!backtest) return
        // Create the query params
        const queryParams = new URLSearchParams({
          symbol: "ethusdt",
          start: range.from.toString(),
          end: range.to.toString(),
        })

        // Form the endpoint
        const endpoint = `${process.env.NEXT_PUBLIC_BACKTEST_BACKEND_URL}/api/v1/backtest/${backtest.id}/candles?${queryParams.toString()}`

        // Do the fetch
        return fetch(endpoint)
          .then(res => res.ok ? res.json() : Promise.reject(`HTTP ${res.status}: ${res.statusText}`))
          .then(data => data.map((candle: any) => ({
            time: new Date(candle.timestamp).getTime() / 1000 as Time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close
          })));
        }, [backtest])

  const dataFeed = useMemo(() => {
    if (!backtestBounds || !backtest) return null

    return (new DataFeed<T>(
                fetcher,
                {
                  from: (backtestBounds.start.getTime() / 1000) as Time,
                  to: (backtestBounds.end.getTime() / 1000) as Time
                }
              ))
  }, [backtest])

  useEffect(() => {
    if (!dataFeed || !optimalInitialRange) return;

    dataFeed.subscribeToInitialDataLoaded(() => {
      setIsLoading(false)
    })

    dataFeed.initialize(
          {
            from: (optimalInitialRange.start.getTime() / 1000) as Time,
            to: (optimalInitialRange.end.getTime() / 1000) as Time
        })

  }, [dataFeed, optimalInitialRange])
  return [dataFeed, isLoading] as const;

}
