import { TimeBasedData } from "@/types/time-based-data";
import { DataFeed, DataFeedConfig } from "@/lib/data-feed";
import { IRange, Time } from "lightweight-charts";
import { useEffect, useMemo, useState } from "react";

/**
 * Custom React hook for managing time series data for backtests visualization.
 *
 * This hook creates and manages a DataFeed instance throughout a component's lifecycle,
 * handling initialization, data loading, and cleanup. It provides a convenient way to
 * use the DataFeed class within React components while maintaining proper state management.
 *
 * Features:
 * - Lazily initializes a DataFeed instance with optimal configuration
 * - Manages loading state and provides it to the component
 * - Sets up event subscriptions for loading state changes
 * - Handles cleanup when the component unmounts
 *
 * @template T - The type of time-based data being managed (must extend TimeBasedData)
 * @param dataBounds - The absolute time bounds for available data
 * @param dataFetcher - Async function that fetches data for a given time range
 * @returns A tuple containing [dataFeed, isLoading] where:
 *          - dataFeed: The DataFeed instance for data management
 *          - isLoading: Boolean indicating whether data is currently being loaded
 *
 * @example
 * ```tsx
 * // In a React component
 * const [dataFeed, isLoading] = useDataFeed<CandleData>(
 *   { from: startTime, to: endTime },
 *   async (range) => await api.fetchCandleData(symbol, range.from, range.to)
 * );
 *
 * useEffect(() => {
 *   if (dataFeed) {
 *     dataFeed.setRange(viewRange);
 *   }
 * }, [dataFeed, viewRange]);
 *
 * // Show loading indicator
 * if (isLoading) {
 *   return <LoadingSpinner />;
 * }
 *
 * // Render chart with data
 * return <CandleChart data={dataFeed.data} />;
 * ```
 */
export function useDataFeed<T extends TimeBasedData>(
    dataBounds: IRange<Time>,
    dataFetcher: (start?: Time, end?: Time, entries?: Number) => Promise<T[]>,
    config?: Partial<DataFeedConfig>,
) {
    // State to track the loading status of the data feed
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Create the data feed instance with memoization to ensure it's only
     * created once for the same dataBounds and dataFetcher
     */
    const dataFeed = useMemo(() => {
        // Define a custom configuration for the data feed with larger chunk size
        // and longer fetch attempt time than the defaults

        // Create and return a new DataFeed instance
        return new DataFeed<T>(dataFetcher, dataBounds, config);
    }, [dataFetcher, dataBounds]);

    /**
     * Set up an effect to subscribe to loading state changes from the data feed
     * This will update our local loading state whenever the data feed's loading state changes
     */
    useEffect(() => {
        if (!dataFeed) return;

        // Subscribe to loading state changes
        dataFeed.subscribeToLoadingChanges(setIsLoading);

        // Cleanup function to unsubscribe when the component unmounts
        return () => {
            dataFeed.unsubscribeFromLoadingChanges();
        };
    }, [dataFeed]); // Re-run effect if dataFeed changes

    // Return the data feed instance and loading state as a tuple
    return [dataFeed, isLoading] as const;
}
