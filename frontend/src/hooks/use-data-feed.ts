import { TimeBasedData } from "@/types/time-based-data";
import { DataFeed, DataFeedConfig } from "@/lib/data-feed";
import { IRange, Time } from "lightweight-charts";
import { useMemo, useState } from "react";

/**
 * Custom hook for managing time series data for backtests visualization.
 *
 * This hook handles the lifecycle of an OptimizedDataFeed, including:
 * - Converting backtest date ranges to the appropriate format
 * - Initializing the data feed with optimal view ranges
 * - Managing loading states
 * - Setting up event subscriptions
 *
 * @template T - The type of time-based data being managed (must extend TimeBasedData)
 * @param backtest - The backtest object containing start/end dates and other metadata
 * @param dataFetcher - Async function that fetches data for a given time range
 * @returns A tuple containing [dataFeed, isLoading] where dataFeed is the OptimizedDataFeed instance
 *          and isLoading indicates whether initial data is still being loaded
 */
export function useDataFeed<T extends TimeBasedData>(dataBounds: IRange<Time>, dataFetcher: (range: IRange<Time>) => Promise<T[]>) {
  const [isLoading, setIsLoading] = useState(true)

  // Convert the iso string from the backtest object to Dates
  /**
   * Memoized calculation of backtest date ranges and optimal view range
   * Converts ISO date strings to Date objects and calculates the optimal
   * range for initial view display
   */

  const dataFeed = useMemo(() => {
    // Define a custom configuration for the data feed
    const config: Partial<DataFeedConfig> = {
      chunk_size: 1000,
      max_chunk_attempts: 5,
      fetch_attempt_time: 30000
    };

    return (new DataFeed<T>(
                dataFetcher,
				dataBounds,
                config
              ))
  }, [dataFetcher, dataBounds])

  return [dataFeed, isLoading] as const;

}
