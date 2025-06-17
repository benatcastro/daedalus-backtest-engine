import { IRange, Time } from "lightweight-charts";

export interface TimeBasedData {
    time: Time
}

interface bufferData<T extends TimeBasedData> {
    data: T[]
    range: IRange<Time>
}

export class SeriesDataBuffer<T extends TimeBasedData> {
    private _viewRange!: IRange<Time>;
    private readonly _fetchData: (range: IRange<Time>) => Promise<T[]>;
    private readonly _data: bufferData<T>;
    private readonly _dataBounds: IRange<Time>;
    private _onDataUpdateCallback: ((data: T[]) => void) | null = null
    private _onDataAppendCallback: ((data: T[]) => void) | null = null
    private _onInitialDataLoadedCallback: (() => void) | null = null
    private _isLoading: boolean = false
    private _updateTimeout: NodeJS.Timeout | null = null
    private _initialDataLoaded: boolean = false
    private _isSilentUpdate: boolean = false
    private readonly CHUNK_SIZE = 30000
    private readonly INITIAL_CHUNKS = 1

    constructor(
        dataFetcher: (range: IRange<Time>) => Promise<T[]>,
        maxDataRange: IRange<Time>
    ) {
        this._fetchData = dataFetcher
        this._dataBounds = maxDataRange
        this._data = {
            data: [],
            range: {from: 0, to: 0} as IRange<Time>
        }

    }

    /**
     *
     * @param data
     */
    public onDataUpdate() {
        if (this._onDataUpdateCallback)
            this._onDataUpdateCallback(this._data.data)
    }

    /**
     * Notify listeners that new data has been appended
     */
    public onDataAppend(newData: T[]) {
        if (this._onDataAppendCallback)
            this._onDataAppendCallback(newData)
    }

    /**
     *
     * @param initialRange
     */
    public async initialize(initialRange: IRange<Time>) {
        this._viewRange = initialRange
        await this.updateData()
    }


    private setData(newData: T[]) {
        this._data.data = newData
        this._data.range.from = this._data.data[0].time
        this._data.range.to = this._data.data[this._data.data.length - 1].time
        this.onDataUpdate()

        // Trigger initial data loaded callback if this is the first data load
        if (!this._initialDataLoaded && newData.length > 0) {
            this._initialDataLoaded = true
            if (this._onInitialDataLoadedCallback) {
                this._onInitialDataLoadedCallback()
            }
        }

        console.log(`Data has been updated Length: ${this._data.data.length} Range: ${this.data.range.from} -> ${this.data.range.to}`)
    }

    private appendData(newData: T[]) {
        if (newData.length === 0) return

        // Double-check for duplicates - remove any data that already exists
        const currentEndTime = this._data.data.length > 0 ? this._data.data[this._data.data.length - 1].time as number : 0
        const filteredNewData = newData.filter(item => (item.time as number) > currentEndTime)

        if (filteredNewData.length === 0) {
            console.log("No new data to append - all data points already exist")
            return
        }

        // Append the new data
        this._data.data = [...this._data.data, ...filteredNewData]
        this._data.range.to = this._data.data[this._data.data.length - 1].time

        // Trim data if it gets too large (keep last 2 chunks worth of data)
        this.trimDataToChunkLimit()

        // Notify that new data was appended (not replaced)
        this.onDataUpdate()

        console.log(`Data appended: ${filteredNewData.length} new items. Total: ${this._data.data.length}`)
    }

    private trimDataToChunkLimit() {
        const maxChunks = 2;
        const maxDataPoints = this.CHUNK_SIZE * maxChunks;

        if (this._data.data.length > maxDataPoints) {
            // Keep the most recent data points
            const trimAmount = this._data.data.length - maxDataPoints;
            this._data.data = this._data.data.slice(trimAmount);

            // Update the range
            if (this._data.data.length > 0) {
                this._data.range.from = this._data.data[0].time;
            }

            console.log(`Trimmed ${trimAmount} data points. Remaining: ${this._data.data.length}`);
        }
    }

    private async getInitialData() {
        console.log("Initializing data for view range: ", this._viewRange)

        const dataRange: IRange<Time> = {
            from: Math.max(this._viewRange.from as number - (this.CHUNK_SIZE * this.INITIAL_CHUNKS), this._dataBounds.from as number) as Time,
            to: Math.min((this._viewRange.to as number + (this.CHUNK_SIZE * this.INITIAL_CHUNKS)), this._dataBounds.to as number) as Time
        }

        console.log("Data Range: ", dataRange)
        const fetchedData = await this._fetchData(dataRange)

        if (fetchedData.length === 0) {
            console.warn("Couldnt get more data")
            return
        }

        console.log(`Fetched ${fetchedData.length} data entries for view range ${dataRange.from} -> ${dataRange.to}`)
        this.setData(fetchedData)

    }

    /**
     * Fetches data to keep up with the view range
     */
    private async updateData(diff?: number) {
        if (this._isLoading === true) return
        this._isLoading = true

        try {
            let margin = 15000
            const chunkSize = 30000
            console.log("Start Data Length: ", this._data.data.length)

            if (this._data.data.length === 0) {
                await this.getInitialData()
                return
            }

            // Check if we need to load data to the right
            const rightDiff = (this._data.range.to as number) - (this._viewRange.to as number)
            console.log("Diff to the right: ", rightDiff)

            // Check if we're already at the right boundary
            if ((this._data.range.to as number) >= (this._dataBounds.to as number)) {
                console.log("Already at right boundary, no more data to load")
                return
            }

            if (rightDiff < margin) {
                console.log("Loading ONE chunk to the right")
                const newData = await this._fetchData({
                    from: this.data.range.to,
                    to: Math.min(this.data.range.to as number + chunkSize, this._dataBounds.to as number) as Time
                })

                console.log(`Fetched ${newData.length} data entries for ${this.data.range.to} -> ${Math.min(this.data.range.to as number + chunkSize, this._dataBounds.to as number)}`)

                if (newData.length === 0) {
                    console.log("No more data available from API")
                    return
                }

                // Remove duplicates before appending
                const dataEndTime = this._data.data[this._data.data.length - 1].time as number
                const filteredData = newData.filter(item => (item.time as number) > dataEndTime)

                if (filteredData.length > 0) {
                    this.appendData(filteredData)
                    console.log("AFTER Diff to the right: ", (this._data.range.to as number) - (this._viewRange.to as number))
                } else {
                    console.log("No new data to append after filtering duplicates")
                }
            }

            // TODO: Implement left side loading when needed
            /*
            const leftDiff = (this._viewRange.from as number) - (this._data.range.from as number)
            if (leftDiff < margin) {
                // Load data to the left
            }
            */

        } finally {
            this._isLoading = false
        }
    }

    /**
     * Function executed when the data is updated, place to update the series data
     */
    public subscribeToDataUpdates(onNewDataHandler: (data: T[]) => void) {
        if (this._onDataUpdateCallback == null) {
            console.log("Subscribed to new data events on buffer")
            this._onDataUpdateCallback = onNewDataHandler
        }
        else {
            console.warn("On new data was already setted up")
        }
    }

    /**
     * Subscribe to data append events (for incremental updates)
     */
    public subscribeToDataAppends(onDataAppendHandler: (newData: T[]) => void) {
        if (this._onDataAppendCallback == null) {
            console.log("Subscribed to data append events on buffer")
            this._onDataAppendCallback = onDataAppendHandler
        }
        else {
            console.warn("Data append callback was already set up")
        }
    }

    /**
     * Subscribe to be notified when initial data is loaded
     */
    public subscribeToInitialDataLoaded(callback: () => void) {
        if (this._onInitialDataLoadedCallback == null) {
            console.log("Subscribed to initial data loaded events")
            this._onInitialDataLoadedCallback = callback
        }
        else {
            console.warn("Initial data loaded callback was already set up")
        }
    }

    /**
     * Function used to
     * @param newRange
     */
    public async updateDataRange(newRange: IRange<Time>, diff?: number) {
        // Always update the view range, even if we're loading
        this._viewRange = newRange

        // Clear existing timeout
        if (this._updateTimeout) {
            clearTimeout(this._updateTimeout)
        }

        // If already loading, schedule a delayed update instead of running concurrently
        /*
        if (this._isLoading) {
            console.log("Already loading data, scheduling delayed update")
            this._updateTimeout = setTimeout(() => {
                this._updateTimeout = null
                this.updateDataRange(newRange, diff)
            }, 200)
            return
        }*/

        console.log("ViewRange: ", this._viewRange)
        await this.updateData(diff)

        // Set timeout after update completes to prevent rapid successive calls
        this._updateTimeout = setTimeout(() => {
            this._updateTimeout = null
        }, 100)
    }

    public get currentViewRange() {
        return this._viewRange;
    }

    public get data() {
        return this._data
    }

    public get isInitialDataLoaded() {
        return this._initialDataLoaded
    }

    public get isLoading() {
        return this._isLoading;
    }

}
