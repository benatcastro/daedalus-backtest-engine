import { IRange, Time } from "lightweight-charts";
import { TimeBasedData } from "@/types/time-based-data";
import { TimeSortedArray } from "./sorted-array";
import { timeToTimestamp } from "./time-utils";

/**
 * Configuration interface for DataFeed
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
 * DataFeed class for efficient time series data management
 *
 * This class provides functionality for fetching, caching, and providing time-based data to charts
 * for backtest visualization. It implements efficient data loading strategies including:
 * - Chunk-based loading to minimize unnecessary data fetching
 * - Directional loading (forward/backward in time)
 * - Range-based querying with automatic data fetching when needed
 * - Event notification system for data updates, range changes, and loading states
 *
 * @template T - Type extending TimeBasedData, must include a time property
 *
 * @remarks
 * This class does not implement internal concurrency control.
 * Users should ensure thread safety when calling methods from multiple contexts.
 * It's recommended to implement your own locking mechanism when using this class
 * in a multi-threaded or concurrent environment.
 */
export class DataFeed<T extends TimeBasedData> {
    /** Core data buffer using TimeSortedArray for efficient time-based operations */
    private readonly _buffer: TimeSortedArray;

    /** Fetch function that returns data for a given time range */
    private readonly _fetchData: (start?: Time, end?: Time, entries?: number) => Promise<T[]>;

    /** Data bounds represent the absolute min/max range of available data */
    private readonly _dataBounds: IRange<Time>;

    /** Flag indicating whether data is currently being loaded */
    private _isLoading: boolean = false;

    /** Callback triggered when data is updated */
    private _onDataUpdateCallback: ((data: T[]) => void) | null = null;

    /** Callback triggered when a new range is set */
    private _onNewRangeCallback: (() => void) | null = null;

    /** Callback triggered when loading state changes */
    private _onLoadingChangeCallback: ((isLoading: boolean) => void) | null = null;

    /** Configuration for data loading behavior */
    private readonly _config: DataFeedConfig;

    /** Default configuration values */
    private static readonly DEFAULT_CONFIG: DataFeedConfig = {
        chunk_size: 100,
        max_chunk_attempts: 5,
        fetch_attempt_time: 10000,
    };

    /**
     * Creates a new DataFeed instance
     *
     * @param fetchData - Function that returns data for a given time range
     * @param dataBounds - The absolute bounds of available data
     * @param config - Optional configuration for the data feed behavior
     *
     * @example
     * ```typescript
     * const dataFeed = new DataFeed(
     *   async (range) => { return await api.fetchData(range.from, range.to) },
     *   { from: startTime, to: endTime },
     *   { chunk_size: 500, max_chunk_attempts: 3 }
     * );
     * ```
     */
    constructor(
        fetchData: (start?: Time, end?: Time, entries?: number) => Promise<T[]>,
        dataBounds: IRange<Time>,
        config?: Partial<DataFeedConfig>,
    ) {
        this._buffer = new TimeSortedArray();
        this._fetchData = fetchData;
        this._dataBounds = dataBounds;
        // Merge provided config with defaults
        this._config = {
            ...DataFeed.DEFAULT_CONFIG,
            ...config,
        };
    }

    /**
     * Sets the buffer to a specific range plus margins
     *
     * This method is used to initialize or reset the data feed's range. It fetches
     * data for the specified range plus a buffer on both ends to allow for smoother
     * panning and zooming operations.
     *
     * @param range - The time range to set
     * @returns Promise that resolves when the data is loaded
     *
     * @throws Will throw an error if the fetch operation fails
     *
     * @example
     * ```typescript
     * await dataFeed.setRange({ from: startTime, to: endTime });
     * ```
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
     * This method fetches additional data points that occur after the current buffer's
     * end time. It attempts to load up to chunk_size data points, making multiple
     * fetch attempts if necessary.
     *
     * @returns The number of data points loaded
     *
     * @throws Will throw an error if the buffer is empty
     *
     * @remarks
     * This method is not thread-safe and should be called from a single thread
     * or with external synchronization
     *
     * @example
     * ```typescript
     * const pointsLoaded = await dataFeed.loadChunkForward();
     * console.log(`Loaded ${pointsLoaded} new data points`);
     * ```
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
            while (
                totalLoaded < this._config.chunk_size &&
                attempts < this._config.max_chunk_attempts
            ) {
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
                    const newData = await this._fetchData(timeRange.from, timeRange.to);

                    if (newData.length === 0) {
                        console.log(
                            "DataFeed: Loading forwards: no more data available for: ",
                            timeRange,
                        );
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
     * Gets data for a specific time range from the buffer
     *
     * This method retrieves data points that fall within the specified time range
     * from the internal buffer. It does not trigger any data fetching operations.
     *
     * @param range - The time range to get data for
     * @returns Array of data points in the range
     *
     * @example
     * ```typescript
     * const visibleData = dataFeed.getDataForRange({ from: viewStart, to: viewEnd });
     * ```
     */
    public getDataForRange(range: IRange<Time>): T[] {
        return this._buffer.getRange(range.from, range.to) as T[];
    }

    /**
     * Cleans up resources and removes all event listeners
     *
     * This method should be called when the data feed is no longer needed
     * to prevent memory leaks and ensure proper cleanup.
     *
     * @example
     * ```typescript
     * // When component unmounts or data feed is no longer needed
     * dataFeed.free();
     * ```
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
     * This method fetches additional data points that occur before the current buffer's
     * start time. It attempts to load up to chunk_size data points, making multiple
     * fetch attempts if necessary.
     *
     * @returns The number of data points loaded
     *
     * @throws Will throw an error if the buffer is empty
     *
     * @remarks
     * This method is not thread-safe and should be called from a single thread
     * or with external synchronization
     *
     * @example
     * ```typescript
     * const pointsLoaded = await dataFeed.loadChunkBackward();
     * console.log(`Loaded ${pointsLoaded} historical data points`);
     * ```
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
            const dataBoundsTo = timeToTimestamp(this._dataBounds.from);

            // Keep fetching until we've loaded enough data or reached max attempts
            let lastRange: IRange<Time> | undefined;
            while (
                totalLoaded < this._config.chunk_size &&
                attempts < this._config.max_chunk_attempts
            ) {
                attempts++;

                const bufferBounds = this._buffer.getTimeBounds();
                const bufferTimeFrom = timeToTimestamp(bufferBounds.from);

                // Calculate start time for this fetch
                const attemptFrom = Math.max(
                    lastRange
                        ? timeToTimestamp(lastRange.from) - this._config.fetch_attempt_time
                        : bufferTimeFrom - this._config.fetch_attempt_time,
                    dataBoundsFrom,
                );

                const attemptTo = Math.min(
                    lastRange
                        ? timeToTimestamp(lastRange.from)
                        : bufferTimeFrom - this._config.fetch_attempt_time,
                    dataBoundsTo,
                );

                const timeRange = {
                    from: attemptFrom as Time,
                    to: attemptTo as Time,
                };

                try {
                    const newData = await this._fetchData(
                        undefined,
                        this._buffer.getTimeBounds().from,
                        this._config.chunk_size,
                    );

                    if (newData.length === 0) {
                        console.log(
                            "DataFeed: Loading backwards: no more data available for: ",
                            timeRange,
                        );
                        // No more data available
                        break;
                    }

                    // Prepend to buffer
                    const inserted = this._buffer.prepend(newData);
                    lastRange = timeRange;
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
     *
     * This method checks if the internal buffer contains data for the entire
     * specified range. If not, it fetches the missing data for portions of the
     * range that are not currently in the buffer.
     *
     * @param range - The time range to ensure data for
     * @private
     */
    private async _ensureDataForRange(range: IRange<Time>): Promise<void> {
        // If buffer is empty, fetch the entire range
        if (this._buffer.length === 0) {
            const newData = await this._fetchData(range.from, range.to);
            if (newData.length > 0) {
                // Just use append since buffer is empty
                this._buffer.append(newData);
            }
            return;
        }
    }

    /**
     * Notifies subscribers of data updates
     *
     * @private
     */
    private _notifyDataUpdate(): void {
        if (this._onDataUpdateCallback) {
            this._onDataUpdateCallback(this._buffer.data as T[]);
        }
    }

    /**
     * Subscribe to data update events
     *
     * Sets up a callback function that will be called whenever the internal
     * data buffer is updated with new data points.
     *
     * @param callback - Function to call when data is updated
     *
     * @example
     * ```typescript
     * dataFeed.subscribeToDataUpdates((data) => {
     *   console.log(`Received ${data.length} data points`);
     *   updateChart(data);
     * });
     * ```
     */
    public subscribeToDataUpdates(callback: (data: T[]) => void): void {
        this._onDataUpdateCallback = callback;
    }

    /**
     * Unsubscribe from data update events
     *
     * Removes the previously set callback for data updates.
     *
     * @example
     * ```typescript
     * // When you no longer need to receive updates
     * dataFeed.unsubscribeFromDataUpdate();
     * ```
     */
    public unsubscribeFromDataUpdates(): void {
        this._onDataUpdateCallback = null;
    }

    /**
     * Notifies subscribers of range updates
     *
     * @private
     */
    private _notifyRangeUpdate(): void {
        if (this._onNewRangeCallback) {
            this._onNewRangeCallback();
        }
    }

    /**
     * Subscribe to range update events
     *
     * Sets up a callback function that will be called whenever the data feed's
     * range is updated via the setRange method.
     *
     * @param callback - Function to call when range is updated
     *
     * @example
     * ```typescript
     * dataFeed.subscribeToRangeUpdates(() => {
     *   console.log('Range has been updated');
     *   updateViewport();
     * });
     * ```
     */
    public subscribeToRangeUpdates(callback: () => void): void {
        this._onNewRangeCallback = callback;
    }

    /**
     * Unsubscribe from range update events
     *
     * Removes the previously set callback for range updates.
     *
     * @example
     * ```typescript
     * dataFeed.unsubscribeFromRangeUpdates();
     * ```
     */
    public unsubscribeFromRangeUpdates(): void {
        this._onNewRangeCallback = null;
    }

    /**
     * Notifies subscribers of loading state changes
     *
     * @private
     */
    private _notifyLoadingChange(): void {
        if (this._onLoadingChangeCallback) {
            this._onLoadingChangeCallback(this._isLoading);
        }
    }

    /**
     * Subscribe to loading state change events
     *
     * Sets up a callback function that will be called whenever the loading state
     * changes. The callback is immediately called with the current loading state.
     *
     * @param callback - Function to call when loading state changes
     *
     * @example
     * ```typescript
     * dataFeed.subscribeToLoadingChanges((isLoading) => {
     *   setLoadingIndicator(isLoading);
     *   if (isLoading) {
     *     showProgressBar();
     *   } else {
     *     hideProgressBar();
     *   }
     * });
     * ```
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
     *
     * Removes the previously set callback for loading state changes.
     *
     * @example
     * ```typescript
     * dataFeed.unsubscribeFromLoadingChanges();
     * ```
     */
    public unsubscribeFromLoadingChanges(): void {
        this._onLoadingChangeCallback = null;
    }

    /**
     * Gets all data in the buffer
     *
     * @returns All data points currently in the buffer
     *
     * @example
     * ```typescript
     * const allData = dataFeed.data;
     * console.log(`Buffer contains ${allData.length} data points`);
     * ```
     */
    public get data(): T[] {
        return this._buffer.data as T[];
    }

    /**
     * Gets the data bounds
     *
     * @returns The absolute min/max time range of available data
     *
     * @example
     * ```typescript
     * const bounds = dataFeed.dataBounds;
     * console.log(`Data available from ${bounds.from} to ${bounds.to}`);
     * ```
     */
    public get dataBounds(): IRange<Time> {
        return this._dataBounds;
    }

    /**
     * Gets the loading state
     *
     * @returns Boolean indicating whether data is currently being loaded
     *
     * @example
     * ```typescript
     * if (dataFeed.isLoading) {
     *   showLoadingIndicator();
     * }
     * ```
     */
    public get isLoading(): boolean {
        return this._isLoading;
    }

    /**
     * Sets the loading state and notifies subscribers
     *
     * @param isLoading - New loading state
     * @private
     */
    private _setLoading(isLoading: boolean): void {
        if (this._isLoading !== isLoading) {
            this._isLoading = isLoading;
            this._notifyLoadingChange();
        }
    }

    /**
     * Gets the initialization state
     *
     * @returns Boolean indicating whether the data feed has been initialized with data
     *
     * @example
     * ```typescript
     * if (!dataFeed.isInitialized) {
     *   await dataFeed.setRange(initialRange);
     * }
     * ```
     */
    public get isInitialized(): boolean {
        return this._buffer.length > 0;
    }
}
