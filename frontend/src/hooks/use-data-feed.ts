import Backtest from "@/types/backtest";
import { DataFeed, TimeBasedData } from "@/lib/data-feed";
import {
  backtestDatesToRange,
  calculateOptimalInitialViewRange,
} from "@/utils/sample-data-generator";
import { IRange, Time } from "lightweight-charts";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useDataFeed<T extends TimeBasedData>(
  backtest: Backtest | undefined,
  dataFetcher: (range: IRange<Time>) => T[],
) {
  const [isLoading, setIsLoading] = useState(true);

  // Convert the iso string from the backtest object to Dates
  const [backtestBounds, optimalInitialRange] = useMemo(() => {
    if (backtest) {
      const backtestBounds = backtestDatesToRange(
        backtest.starting_date,
        backtest.ending_date,
      );
      const optimalRange = calculateOptimalInitialViewRange(backtestBounds);
      return [backtestBounds, optimalRange];
    }
    return [null, null];
  }, [backtest, dataFetcher]);

  const dataFeed = useMemo(() => {
    if (!backtestBounds || !backtest) return null;

    return new DataFeed<T>(dataFetcher, {
      from: (backtestBounds.start.getTime() / 1000) as Time,
      to: (backtestBounds.end.getTime() / 1000) as Time,
    });
  }, [backtest]);

  useEffect(() => {
    if (!dataFeed || !optimalInitialRange) return;

    dataFeed.subscribeToInitialDataLoaded(() => {
      setIsLoading(false);
    });

    dataFeed.initialize({
      from: (optimalInitialRange.start.getTime() / 1000) as Time,
      to: (optimalInitialRange.end.getTime() / 1000) as Time,
    });
  }, [dataFeed, optimalInitialRange]);
  return [dataFeed, isLoading] as const;
}
