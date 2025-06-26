import { IRange, Time } from "lightweight-charts";
import { TimeBasedData } from "@/types/time-based-data";
import { TimeSortedArray } from "./sorted-array";
import { timeToTimestamp } from "./time-utils";

/**
 * Configuration interface for OptimizedDataFeed
 */
export interface DataFeedConfig {
    /** Target number of data points to load per chunk */
    chunk_size: number;
    /** Maximum number of fetch attempts to fill a chunk */
    max_chunk_attempts: number;
    /** Time range to fetch in each attempt (in milliseconds) */
    fetch_attempt_time: number;
}

/**
 * Optimized data feed using TimeSortedArray for efficient time series data management
 * Handles fetching, caching, and providing data to charts for backtest visualization
 *
 * Note: This class does not implement internal concurrency control.
 * Users should ensure thread safety when calling methods from multiple contexts.
 * It's recommended to implement your own locking mechanism when using this class
 * in a multi-threaded or concurrent environment.
 */
export class DataFeed<T extends TimeBasedData> {
    // Core data buffer using TimeSortedArray for efficient time-based operations
    private readonly _buffer: TimeSortedArray;

    // Fetch function that returns data for a given time range
    private readonly _fetchData: (range: IRange<Time>) => Promise<T[]>;

    // Data bounds represent the absolute min/max range of available data
    private readonly _dataBounds: IRange<Time>;

    // Control variables
    private _isLoading: boolean = false;

    // Callbacks
    private _onDataUpdateCallback: ((data: T[]) => void) | null = null;
    private _onNewRangeCallback: (() => void) | null = null;
    private _onLoadingChangeCallback: ((isLoading: boolean) => void) | null = null;

    // Configuration for data loading behavior
    private readonly _config: DataFeedConfig;

    // Default configuration values
    private static readonly DEFAULT_CONFIG: DataFeedConfig = {
        chunk_size: 100,
        max_chunk_attempts: 5,
        fetch_attempt_time: 10000
    };

    /**
     * Creates a new optimized data feed
     *
     * @param fetchData Function that returns data for a given time range
     * @param dataBounds The absolute bounds of available data
     * @param config Optional configuration for the data feed
     */
    constructor(
        fetchData: (range: IRange<Time>) => Promise<T[]>,
        dataBounds: IRange<Time>,
        config: Partial<DataFeedConfig>
    ) {

        this._buffer = new TimeSortedArray();
        this._fetchData = fetchData;
        this._dataBounds = dataBounds;
        // Merge provided config with defaults
        this._config = {
            ...DataFeed.DEFAULT_CONFIG,
            ...config
        };
    }

    /**
     * Sets the buffer to a specific range plus margins
     *
     * @param range The range to set
     * @returns Promise that resolves when the data is loaded
     */
    public async setRange(range: IRange<Time>): Promise<void> {
        // Set loading state
        this._setLoading(true);

        try {
            // Calculate range with margins for data fetching
            const dataRangeToFetch = {
                from: Math.max(
                    timeToTimestamp(range.from) - this._config.chunk_size,
                    timeToTimestamp(this._dataBounds.from),
                ) as Time,
                to: Math.min(
                    timeToTimestamp(range.to) + this._config.chunk_size,
                    timeToTimestamp(this._dataBounds.to),
                ) as Time,
            };

            // Ensure we have data for the new range
            await this._ensureDataForRange(dataRangeToFetch);

            // Notify data update
            this._notifyRangeUpdate();
        } finally {
            // Clear loading state regardless of success or failure
            this._setLoading(false);
        }
    }
    /**
     * Loads data chunk in forward direction (later in time)
     *
     * @returns The number of data points loaded
     * @remarks This method is not thread-safe and should be called from a single thread or with external synchronization
     */
    public async loadChunkForward(): Promise<number> {
        if (this._buffer.length === 0) {
            throw new Error("Cannot load chunk before initialization");
        }

        this._setLoading(true);

        try {
            let totalLoaded = 0;
            let attempts = 0;

            // Get current buffer bounds
            const dataBoundsEnd = timeToTimestamp(this._dataBounds.to);

            // Keep fetching until we've loaded enough data or reached max attempts
            while (totalLoaded < this._config.chunk_size && attempts < this._config.max_chunk_attempts) {
                const bufferBounds = this._buffer.getTimeBounds();
                const bufferTimeEnd = timeToTimestamp(bufferBounds.to);
                attempts++;

                // Calculate end time for this fetch
                const attempTo = Math.min(
                    bufferTimeEnd + this._config.fetch_attempt_time, // Request more than needed
                    dataBoundsEnd,
                );

                const timeRange = {
                    from: bufferTimeEnd as Time,
                    to: attempTo as Time,
                };

                try {
                    const newData = await this._fetchData(timeRange);

                    if (newData.length === 0) {
                        console.log("DataFeed: Loading forwards: no more data available for: ", timeRange)
                        // No more data available
                        break;
                    }

                    // Append to buffer
                    const inserted = this._buffer.append(newData);
                    totalLoaded += inserted;

                } catch (error) {
                    console.error("Error loading forward chunk:", error);
                    break;
                }
            }

            if (totalLoaded > 0) {
                this._notifyDataUpdate();
            }

            return totalLoaded;
        } finally {
            this._setLoading(false);
        }
    }

    /**
     * Gets data for a specific range
     *
     * @param range The time range to get data for
     * @returns Array of data points in the range
     */
    public getDataForRange(range: IRange<Time>): T[] {
        return this._buffer.getRange(range.from, range.to) as T[];
    }

    /**
     * Cleans up resources
     */
    public free(): void {
        this._onDataUpdateCallback = null;
        this._onNewRangeCallback = null;
        this._onLoadingChangeCallback = null;
        this._buffer.free();
    }

    /**
     * Loads data chunk in backward direction (earlier in time)
     *
     * @returns The number of data points loaded
     * @remarks This method is not thread-safe and should be called from a single thread or with external synchronization
     */
    public async loadChunkBackward(): Promise<number> {
        if (this._buffer.length === 0) {
            throw new Error("Cannot load chunk before initialization");
        }

        this._setLoading(true);

        try {
            let totalLoaded = 0;
            let attempts = 0;

            const dataBoundsFrom = timeToTimestamp(this._dataBounds.from);

            // Keep fetching until we've loaded enough data or reached max attempts
            while (totalLoaded < this._config.chunk_size && attempts < this._config.max_chunk_attempts) {
                attempts++;

                const bufferBounds = this._buffer.getTimeBounds();
                const bufferTimeFrom = timeToTimestamp(bufferBounds.from);

                // Calculate start time for this fetch
                const attemptFrom = Math.max(
                    bufferTimeFrom - this._config.fetch_attempt_time, // Request more than needed
                    dataBoundsFrom,
                );

                const timeRange = {
                    from: attemptFrom as Time,
                    to: bufferBounds.from,
                };

                try {
                    const newData = await this._fetchData(timeRange);

                    if (newData.length === 0) {
                        console.log("DataFeed: Loading backwards: no more data available for: ", timeRange)
                        // No more data available
                        break;
                    }

                    // Prepend to buffer
                    const inserted = this._buffer.prepend(newData);
                    totalLoaded += inserted;
                } catch (error) {
                    console.error("Error loading backward chunk:", error);
                    break;
                }
            }

            if (totalLoaded > 0) {
                this._notifyDataUpdate();
            }

            return totalLoaded;
        } finally {
            this._setLoading(false);
        }
    }

    /**
     * Ensures we have data for a specific range
     */
    private async _ensureDataForRange(range: IRange<Time>): Promise<void> {
        // If buffer is empty, fetch the entire range
        if (this._buffer.length === 0) {
            const newData = await this._fetchData(range);
            if (newData.length > 0) {
                // Just use append since buffer is empty
                this._buffer.append(newData);
            }
            return;
        }

        // Get buffer bounds
        const bufferBounds = this._buffer.getTimeBounds();

        // Convert to IRange<number> for comparison
        const bufferTimeRange: IRange<number> = {
            from: timeToTimestamp(bufferBounds.from),
            to: timeToTimestamp(bufferBounds.to),
        };

        const requestTimeRange: IRange<number> = {
            from: timeToTimestamp(range.from),
            to: timeToTimestamp(range.to),
        };

        // Check if we need data before the buffer
        if (requestTimeRange.from < bufferTimeRange.from) {
            const beforeRange = {
                from: range.from,
                to: bufferBounds.from,
            };

            const beforeData = await this._fetchData(beforeRange);
            if (beforeData.length > 0) {
                this._buffer.prepend(beforeData);
            }
        }

        // Check if we need data after the buffer
        if (requestTimeRange.to > bufferTimeRange.to) {
            const afterRange = {
                from: bufferBounds.to,
                to: range.to,
            };

            const afterData = await this._fetchData(afterRange);
            if (afterData.length > 0) {
                this._buffer.append(afterData);
            }
        }
    }

    /**
     * Notifies subscribers of data updates
     */
    private _notifyDataUpdate(): void {
        if (this._onDataUpdateCallback) {
            this._onDataUpdateCallback(this._buffer.data as T[]);
        }
    }

    /**
     * Subscribe to data update events
     *
     * @param callback Function to call when data is updated
     */
    public subscribeToDataUpdates(callback: (data: T[]) => void): void {
        this._onDataUpdateCallback = callback;
    }

    /**
     * Unsubscribe from data update events
     */
    public unsubscribeFromDataUpdate(): void {
        this._onDataUpdateCallback = null;
    }

    /**
     * Subscribe to initialization events
     *
     * @param callback Function to call when initialization is complete
     */
    public subscribeToRangeUpdates(callback: () => void): void {
        this._onNewRangeCallback = callback;
    }

    /**
     * Unsubscribe from initialization events
     */
    public unsubscribeFromRangeUpdates(): void {
        this._onNewRangeCallback = null;
    }

    /**
     * Subscribe to loading state change events
     *
     * @param callback Function to call when loading state changes
     */
    public subscribeToLoadingChanges(callback: (isLoading: boolean) => void): void {
        this._onLoadingChangeCallback = callback;
        // Immediately notify with current state
        if (callback) {
            callback(this._isLoading);
        }
    }

    /**
     * Unsubscribe from loading state change events
     */
    public unsubscribeFromLoadingChanges(): void {
        this._onLoadingChangeCallback = null;
    }

    /**
     * Notifies subscribers of data updates
     */
    private _notifyRangeUpdate(): void {
        if (this._onNewRangeCallback) {
            this._onNewRangeCallback();
        }
    }
    /**
     * Gets all data in the buffer
     */
    public get data(): T[] {
        return this._buffer.data as T[];
    }

    /**
     * Gets the data bounds
     */
    public get dataBounds(): IRange<Time> {
        return this._dataBounds;
    }

    /**
     * Gets the loading state
     */
    public get isLoading(): boolean {
        return this._isLoading;
    }

    /**
     * Sets the loading state and notifies subscribers
     * @private
     */
    private _setLoading(isLoading: boolean): void {
        if (this._isLoading !== isLoading) {
            this._isLoading = isLoading;
            this._notifyLoadingChange();
        }
    }

    /**
     * Notifies subscribers of loading state changes
     * @private
     */
    private _notifyLoadingChange(): void {
        if (this._onLoadingChangeCallback) {
            this._onLoadingChangeCallback(this._isLoading);
        }
    }

    /**
     * Gets the initialization state
     * Now determined by whether the buffer has data
     */
    public get isInitialized(): boolean {
        return this._buffer.length > 0;
    }
}
