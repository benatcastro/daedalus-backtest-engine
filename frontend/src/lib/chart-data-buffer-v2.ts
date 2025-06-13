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
    private _isLoading: boolean = false
    private _updateTimeout: NodeJS.Timeout | null = null
    private readonly CHUNK_SIZE = 30000

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
        console.log(`Data has been updated Lenght: ${this._data.data.length} Range: ${this.data.range.from} -> ${this.data.range.to}`)
    }

    private async getInitialData() {
        console.log("Initializing data for view range: ", this._viewRange)

        const dataRange: IRange<Time> = {
            from: Math.max(this._viewRange.from as number - (this.CHUNK_SIZE * 2), this._dataBounds.from as number) as Time,
            to: Math.min((this._viewRange.to as number + (this.CHUNK_SIZE * 2)), this._dataBounds.to as number) as Time
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

        let margin = 15000
        const chunkSize = 30000
        console.log("Start Data Length: ", this._data.data.length)

        if (this._data.data.length === 0) {
            await this.getInitialData()
        }

        // Obtain missing data to the left
        /*
        if (rangeWithMargin.from < this.data.range.from) {
            console.log("prev data")
            const newData = await this._fetchData(
                    {
                        from: rangeWithMargin.from,
                        to: this.data.range.from
                    })
            console.log(`Fetched ${newData.length} data entries for view range ${this._viewRange.from.toString()} -> ${this._viewRange.to.toString()}`)
            const dataStartTime = this._data.data[0].time as number
            while (newData.length > 0 && (newData[newData.length - 1].time as number) >= dataStartTime) {
                const elem = newData.pop()
                console.log("Popped: ", elem, ` elem time: ${elem?.time} end time: ${dataStartTime}`)
            }
            // Update the data
            this._data.data = [...newData, ...this._data.data];
            this._data.range.from = this._data.data[0].time
            this._data.range.to = this._data.data[this._data.data.length - 1].time
        } */

        console.log("Diff to the right: ", (this._data.range.to as number) - (this._viewRange.to as number))
        while (((this._data.range.to as number) - (this._viewRange.to as number)) < margin) {
            console.log("Loading Chunk to the right")
            const newData = await this._fetchData(
                    {
                        from: this.data.range.to,
                        to: Math.min(this.data.range.to as number + chunkSize, this._dataBounds.to as number) as Time
                    })
            console.log(`Fetched ${newData.length} data entries for ${this.data.range.to} -> ${Math.min(this.data.range.to as number + chunkSize, this._dataBounds.to as number)}`)
            const dataEndTime = this._data.data[this._data.data.length - 1].time as number
            while (newData.length > 0 && (newData[0].time as number) <= dataEndTime) {
                const elem = newData.shift()
                //console.log("Shifted: ", elem, ` elem time: ${elem?.time} end time: ${dataEndTime}`)
            }
            this.setData([...this._data.data, ...newData])
            console.log("AFTER Diff to the right: ", (this._data.range.to as number) - (this._viewRange.to as number))
        }

        this._isLoading = false
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
     * Function used to
     * @param newRange
     */
    public async updateDataRange(newRange: IRange<Time>, diff?: number) {
        if (!this._isLoading)
            this._viewRange = newRange

        if (this._updateTimeout) {
            clearTimeout(this._updateTimeout)
        }

        if (!this._isLoading) {
            console.log("ViewRange: ", this._viewRange)
            await this.updateData(diff)

            // Set timeout after update completes to prevent rapid successive calls
            this._updateTimeout = setTimeout(() => {
                this._updateTimeout = null
            }, 100)
        }
    }

    public get currentViewRange() {
        return this._viewRange;
    }

    public get data() {
        return this._data
    }

}
