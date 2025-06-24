import { IRange, Time } from "lightweight-charts";
import { Mutex } from "async-mutex";
import { TimeBasedData } from "@/types/time-based-data";
interface bufferData<T extends TimeBasedData> {
    data: T[];
    range: IRange<Time>;
}

export class TimeRangeDataFeed<T extends TimeBasedData> {
    private _viewRange!: IRange<Time>;
    private readonly _fetchData: (range: IRange<Time>) => T[];
    private readonly _data: bufferData<T>;
    private readonly _dataBounds: IRange<Time>;
    private _onDataUpdateCallback: ((data: T[]) => void) | null = null;
    private _onInitialDataLoadedCallback: (() => void) | null = null;
    private _isLoading: boolean = false;
    private _initialDataLoaded: boolean = false;
    private readonly CHUNK_SIZE = 40000;
    private readonly MARGIN = 20000;
    private readonly INITIAL_CHUNKS = 1;
    private readonly _updateDataMutex = new Mutex();
    private readonly _trimDataMutex = new Mutex();

    constructor(dataFetcher: (range: IRange<Time>) => T[], maxDataRange: IRange<Time>) {
        this._fetchData = dataFetcher;
        this._dataBounds = maxDataRange;
        this._data = {
            data: [],
            range: { from: 0, to: 0 } as IRange<Time>,
        };
    }

    /**
     *
     * @param data
     */
    public onDataUpdate() {
        if (this._onDataUpdateCallback) {
            this._onDataUpdateCallback(this._data.data);
            console.log(
                `Data has been updated Length: ${this._data.data.length} Range: ${this.data.range.from} -> ${this.data.range.to}`,
            );
        }
    }

    /**
     *
     * @param initialRange
     */
    public async initialize(initialRange: IRange<Time>) {
        this._viewRange = initialRange;
        await this._updateData();
        // Trigger initial data loaded callback if this is the first data load
        if (!this._initialDataLoaded && this.data.data.length > 0) {
            this._initialDataLoaded = true;
            if (this._onInitialDataLoadedCallback) {
                this._onInitialDataLoadedCallback();
            }
        }
    }

    private setData(newData: T[]) {
        this._data.data = newData;
        this._data.range.from = this._data.data[0].time;
        this._data.range.to = this._data.data[this._data.data.length - 1].time;
    }

    private trimData() {
        const dataRangeNum = this._data.range as IRange<number>;
        const viewRangeNum = this._viewRange as IRange<number>;
        const dataBoundsNum = this._dataBounds as IRange<number>;

        console.log("DataFeed: Trimming data")
        const targetDataRange: IRange<Time> = {
            from: Math.max(viewRangeNum.from - this.CHUNK_SIZE, dataBoundsNum.from) as Time,
            to: Math.min(viewRangeNum.to + this.CHUNK_SIZE, dataBoundsNum.to) as Time,
        };

        const trimmedData = this._data.data.filter((item: T) => {
            return item.time >= targetDataRange.from && item.time <= targetDataRange.to;
        });
        this.setData(trimmedData);
    }

    private async getInitialData() {
        console.log("Initializing data for view range: ", this._viewRange);

        const dataRange: IRange<Time> = {
            from: Math.max(
                (this._viewRange.from as number) - this.CHUNK_SIZE * this.INITIAL_CHUNKS,
                this._dataBounds.from as number,
            ) as Time,
            to: Math.min(
                (this._viewRange.to as number) + this.CHUNK_SIZE * this.INITIAL_CHUNKS,
                this._dataBounds.to as number,
            ) as Time,
        };

        console.log("Data Range: ", dataRange);
        const fetchedData = await this._fetchData(dataRange);

        if (fetchedData.length === 0) {
            console.warn("Couldnt get more data");
            return fetchedData.length;
        }

        console.log(
            `Fetched ${fetchedData.length} data entries for view range ${dataRange.from} -> ${dataRange.to}`,
        );
        this.setData(fetchedData);
        return fetchedData.length
    }

    private _binarySearch(array: T[], target: T) {
        let l = 0;
        let r = array.length - 1;

        while (l <= r) {
            const m = l + Math.floor((r - l) / 2);
            if ((array[m].time as number) < (target.time as number)) {
                l = m + 1;
            } else if ((array[m].time as number) > (target.time as number)) {
                r = m - 1;
            } else {
                return m;
            }
        }
        return null;
    }

    private async _updateDataInDirection(direction: "left" | "right", neededData: number) {
        const dataRangeNum = this._data.range as IRange<number>;
        const viewRangeNum = this._viewRange as IRange<number>;
        const dataBoundsNum = this._dataBounds as IRange<number>;
        // Check if we need to load data to the right
        console.log(`DataFeed: updating data to the ${direction}`);

        if (direction === "left" && this._data.range.from >= this._dataBounds.from) {
            console.log("DataFeed: All data to the left fetched");
            return 0;
        }
        if (direction === "right" && this._data.range.to >= this._dataBounds.to) {
            console.log("DataFeed: All data to the left fetched");
            return 0;
        }
        // Check if we have to fetch to the right
        // From the end of current data -> min(endOfCurrentData + chunck Size or endDataBound)
        const newDataBounds = {
            from: this._data.range.to,
            to: Math.min(dataRangeNum.to + this.CHUNK_SIZE, dataBoundsNum.to) as Time,
        };

        const newData = await this._fetchData(newDataBounds);

        console.log(
            `Fetched ${newData.length} data entries for ${this.data.range.to} -> ${Math.min((this.data.range.to as number) + this.CHUNK_SIZE, this._dataBounds.to as number)}`,
        );

        if (newData.length === 0) {
            console.log("No more data available from API");
            return newData.length;
        }

        // Optime duplicate filtering using binary search and splice
        // Remove duplicates before appending
        if (direction === "right") {
            const dataEndTime = this._data.data[this._data.data.length - 1].time as number;
            const filteredData = newData.filter((item) => (item.time as number) > dataEndTime);
            this.setData([...this._data.data, ...filteredData]);
            return filteredData.length;
        } else {
            const dataStartTime = this._data.data[0].time as number;
            const filteredData = newData.filter((item) => (item.time as number) < dataStartTime);
            this._data.data = [...filteredData, ...this._data.data];
            this._data.range.from = this._data.data[0].time;
            this.setData(filteredData);
            return filteredData.length;
        }
    }

    private _needToUpdate() {
        const dataRangeNum = this._data.range as IRange<number>;
        const viewRangeNum = this._viewRange as IRange<number>;

        // Initial data load
        if (this._data.data.length === 0) {
            return true;
        }

        const rightDiff = dataRangeNum.to - viewRangeNum.to;
        const leftDiff = viewRangeNum.from - dataRangeNum.from;
        console.log(`DataFeed: <- leftDiff : ${leftDiff} rightDiff ${rightDiff} ->`);
        if (rightDiff < this.MARGIN) {
            return true;
        }
        if (leftDiff < this.MARGIN) {
            return true;
        }

        return false;
    }
    /**
     * Fetches data to keep up with the view range
     */
    private async _updateData() {
        this._isLoading = true;
        let dataHasBeenUpdated: boolean = false
        try {
            const dataRangeNum = this._data.range as IRange<number>;
            const viewRangeNum = this._viewRange as IRange<number>;
            const dataBoundsNum = this._dataBounds as IRange<number>;

            // Initial data load
            if (this._data.data.length === 0) {
                const newData = await this.getInitialData();
                if (newData > 0) {
                    dataHasBeenUpdated = true
                }
                return;
            }

            const rightDiff = dataRangeNum.to - viewRangeNum.to;
            const leftDiff = viewRangeNum.from - dataRangeNum.from;
            console.log(`DataFeed: <- leftDiff : ${leftDiff} rightDiff ${rightDiff} ->`);
            if (rightDiff < this.MARGIN) {
                const newData = await this._updateDataInDirection("right", rightDiff);
                if (newData > 0) {
                    dataHasBeenUpdated = true
                }

            }
            if (leftDiff < this.MARGIN) {
                const newData = await this._updateDataInDirection("left", leftDiff);
                if (newData > 0) {
                    dataHasBeenUpdated = true
                }
            }
        } finally {
            this._isLoading = false;
            if (dataHasBeenUpdated) {
                this.onDataUpdate()
            }
        }
    }

    public unsubscribeToDataUpdates() {
        this._onDataUpdateCallback = null;
    }
    /**
     * Function executed when the data is updated, place to update the series data
     */
    public subscribeToDataUpdates(onNewDataHandler: (data: T[]) => void) {
        if (this._onDataUpdateCallback == null) {
            console.log("Subscribed to new data events on buffer");
            this._onDataUpdateCallback = onNewDataHandler;
        } else {
            console.warn("On new data was already setted up");
        }
    }

    /**
     * Subscribe to be notified when initial data is loaded
     */
    public subscribeToInitialDataLoaded(callback: () => void) {
        if (this._onInitialDataLoadedCallback == null) {
            console.log("Subscribed to initial data loaded events");
            this._onInitialDataLoadedCallback = callback;
        } else {
            console.warn("Initial data loaded callback was already set up");
        }
    }

    /**
     * Function used to
     * @param newRange
     */
    public updateDataRange(newRange: IRange<Time>) {
        // Always update the view range, even if we're loading
        this._viewRange = newRange;

        console.log("ViewRange: ", this._viewRange);
        if (!this._needToUpdate()) return;

        this._updateDataMutex.acquire().then(async () => {
            try {
                console.log("===============LOCK==============");
                await this._updateData();
            } finally {
                console.log("===============RELEASE==============");
                this._updateDataMutex.release();
            }
        });
    }

    public free() {
        console.log("Clearing dataFeed data");
        (this._data.data = []),
            (this._data.range = { from: 0, to: 0 } as IRange<Time>),
            (this._onDataUpdateCallback = null);
        this._onInitialDataLoadedCallback = null;
    }

    public get currentViewRange() {
        return this._viewRange;
    }

    public get data() {
        return this._data;
    }

    public get isInitialDataLoaded() {
        return this._initialDataLoaded;
    }

    public get isLoading() {
        return this._isLoading;
    }
}

export class LogicalRangeDataFeed<T extends TimeBasedData> {
    private _viewTimeRange!: IRange<Time>;
    private readonly _fetchData: (range: IRange<Time>) => T[];
    private readonly _data: bufferData<T>;
    private readonly _dataBounds: IRange<Time>;
    private _onDataUpdateCallback: ((data: T[]) => void) | null = null;
    private _onInitialDataLoadedCallback: (() => void) | null = null;
    private _isLoading: boolean = false;
    private _initialDataLoaded: boolean = false;
    private readonly CHUNK_SIZE = 40000;
    private readonly MARGIN = 20000;
    private readonly INITIAL_CHUNKS = 1;
    private readonly _updateDataMutex = new Mutex();
    private readonly _trimDataMutex = new Mutex();

    constructor(dataFetcher: (range: IRange<Time>) => T[], maxDataRange: IRange<Time>) {
        this._fetchData = dataFetcher;
        this._dataBounds = maxDataRange;
        this._data = {
            data: [],
            range: { from: 0, to: 0 } as IRange<Time>,
        };
    }

    /**
     *
     * @param data
     */
    public onDataUpdate() {
            console.log(
                `DataFeed: Data has been updated Length: ${this._data.data.length} Range: ${new Date(this.data.range.from as number * 1000)} -> ${new Date(this.data.range.to as number * 1000)}`,
            );
        if (this._onDataUpdateCallback) {
            this._onDataUpdateCallback(this._data.data);
        }
    }

    /**
     *
     * @param initialRange
     */
    public async initialize(initialRange: IRange<Time>) {
        this._viewTimeRange = initialRange;
        await this._updateData();
        // Trigger initial data loaded callback if this is the first data load
        if (!this._initialDataLoaded && this.data.data.length > 0) {
            this._initialDataLoaded = true;
            if (this._onInitialDataLoadedCallback) {
                this._onInitialDataLoadedCallback();
            }
        }
    }

    private setData(newData: T[]) {
        if (!newData.length ) {
            throw Error("newData can't be empty")
        }

        this._data.data = newData;
        this._data.range.from = this._data.data[0].time;
        this._data.range.to = this._data.data[this._data.data.length - 1].time;
    }

    private async trimData(excessEntries: number, direction: 'left' | 'right') {
        if (this._isLoading) return

        try {
            this._isLoading = true

            if (this._data.data.length < excessEntries) {
                throw Error("can't trim more entries than the lenght of data")
            }
            const startRemovingIndex = direction === 'left' ? 0 : this._data.data.length - excessEntries
            const deletedEntries = this._data.data.splice(startRemovingIndex, excessEntries)
            this._data.range.from = this._data.data[0].time;
            this._data.range.to = this._data.data[this._data.data.length - 1].time;
            this.onDataUpdate()
            console.log(`DataFeed: trimmed ${deletedEntries.length} from the ${direction}`)

        } finally {
            this._isLoading = false
        }
    }


    private async getInitialData() {
        console.log("Initializing data for view range: ", this._viewTimeRange);

        const dataRange: IRange<Time> = {
            from: Math.max(
                (this._viewTimeRange.from as number) - this.CHUNK_SIZE * this.INITIAL_CHUNKS,
                this._dataBounds.from as number,
            ) as Time,
            to: Math.min(
                (this._viewTimeRange.to as number) + this.CHUNK_SIZE * this.INITIAL_CHUNKS,
                this._dataBounds.to as number,
            ) as Time,
        };

        console.log("Data Range: ", dataRange);
        const fetchedData = await this._fetchData(dataRange);

        if (fetchedData.length === 0) {
            console.warn("Couldnt get more data");
            return fetchedData.length;
        }

        console.log(
            `DataFeed: Fetched ${fetchedData.length} data entries for view range ${dataRange.from} -> ${dataRange.to}`,
        );
        this.setData(fetchedData);
        return fetchedData.length
    }

    private _binarySearch(array: T[], target: T) {
        let l = 0;
        let r = array.length - 1;

        while (l <= r) {
            const m = l + Math.floor((r - l) / 2);
            if ((array[m].time as number) < (target.time as number)) {
                l = m + 1;
            } else if ((array[m].time as number) > (target.time as number)) {
                r = m - 1;
            } else {
                return m;
            }
        }
        return null;
    }

    private async _updateDataInDirection(direction: "left" | "right", neededData: number) {
        const dataRangeNum = this._data.range as IRange<number>;
        const viewRangeNum = this._viewTimeRange as IRange<number>;
        const dataBoundsNum = this._dataBounds as IRange<number>;
        // Check if we need to load data to the right
        console.log(`DataFeed: updating data to the ${direction}`);

        if (direction === "left" && this._data.range.from <= this._dataBounds.from) {
            console.log("DataFeed: All data to the left fetched");
            return 0;
        }
        if (direction === "right" && this._data.range.to >= this._dataBounds.to) {
            console.log("DataFeed: All data to the right fetched");
            return 0;
        }
        // Check if we have to fetch to the right
        // From the end of current data -> min(endOfCurrentData + chunck Size or endDataBound)

        const newDataBounds = direction === 'right' ? {
            from: this._data.range.to,
            to: Math.min(dataRangeNum.to + this.CHUNK_SIZE, dataBoundsNum.to) as Time,
        } : {
            from: Math.max(viewRangeNum.from, dataBoundsNum.from) as Time,
            to: (this._data.range.from) as Time,

        };

        const newData = await this._fetchData(newDataBounds);

        console.log(
            `Fetched ${newData.length} data entries for ${newDataBounds.from} -> ${newDataBounds.to as number}`,
        );

        if (newData.length === 0) {
            console.log("No more data available from API");
            return newData.length;
        }

        // Optime duplicate filtering using binary search and splice
        // Remove duplicates before appending
        if (direction === "right") {
            const dataEndTime = this._data.data[this._data.data.length - 1].time as number;
            const filteredData = newData.filter((item) => (item.time as number) > dataEndTime);
            this.setData([...this._data.data, ...filteredData]);
            return filteredData.length;
        } else {
            const dataStartTime = this._data.data[0].time as number;
            const filteredData = newData.filter((item) => (item.time as number) < dataStartTime);
            this.setData([...filteredData, ...this._data.data]);
            return filteredData.length;
        }
    }

    /**
     * Fetches data to keep up with the view range
     */
    private async _updateData() {
        this._isLoading = true;
        let dataHasBeenUpdated: boolean = false
        try {
            const dataRangeNum = this._data.range as IRange<number>;
            const viewRangeNum = this._viewTimeRange as IRange<number>;
            const dataBoundsNum = this._dataBounds as IRange<number>;

            // Initial data load
            if (this._data.data.length === 0) {
                const newData = await this.getInitialData();
                if (newData > 0) {
                    dataHasBeenUpdated = true
                }
                return;
            }

            const rightDiff = dataRangeNum.to - viewRangeNum.to;
            const leftDiff = dataRangeNum.from - viewRangeNum.from ;
            // console.log(`DataFeed: <- leftDiff : ${leftDiff} rightDiff ${rightDiff} ->`);
            // if (rightDiff < this.MARGIN) {
            //     const newData = await this._updateDataInDirection("right", rightDiff);
            //     if (newData > 0) {
            //         dataHasBeenUpdated = true
            //     }

            // }
            // if (leftDiff < this.MARGIN) {
                const newData = await this._updateDataInDirection("left", leftDiff);
                if (newData > 0) {
                    dataHasBeenUpdated = true
                // }
            }
        } finally {
            this._isLoading = false;
            if (dataHasBeenUpdated) {
                //this.trimData()
                this.onDataUpdate()
            }
        }
    }

    public unsubscribeToDataUpdates() {
        this._onDataUpdateCallback = null;
    }
    /**
     * Function executed when the data is updated, place to update the series data
     */
    public subscribeToDataUpdates(onNewDataHandler: (data: T[]) => void) {
        if (this._onDataUpdateCallback == null) {
            console.log("Subscribed to new data events on buffer");
            this._onDataUpdateCallback = onNewDataHandler;
        } else {
            console.warn("On new data was already setted up");
        }
    }

    /**
     * Subscribe to be notified when initial data is loaded
     */
    public subscribeToInitialDataLoaded(callback: () => void) {
        if (this._onInitialDataLoadedCallback == null) {
            console.log("Subscribed to initial data loaded events");
            this._onInitialDataLoadedCallback = callback;
        } else {
            console.warn("Initial data loaded callback was already set up");
        }
    }

    /**
     * Function used to
     * @param newRange
     */
    public async updateDataRange(newRange: IRange<number>) {
        console.log("===============UPDATE CALLED==============");

        if (this._updateDataMutex.isLocked() || this._isLoading) return
        const barMargin = 500
        const trimMargin = 200

        if (newRange.from <= barMargin) {
        console.log("===============UPDATE START==============");
        const outOfViewDataRight = this._data.data.length - Math.floor(newRange.to)
            console.log("DataFeed: OutOfViewDataRight", outOfViewDataRight)
            this._viewTimeRange = {
                from: (this._viewTimeRange.from as number - (this.CHUNK_SIZE * 2)) as Time,
                to: this._viewTimeRange.to
            }
            await this._updateData();
            if (outOfViewDataRight > trimMargin) {
                // this.trimData(Math.abs(outOfViewDataRight / 3), 'right')
            }
            console.log("===============UPDATE END==============");

            /*
            this._updateDataMutex.acquire().then(async () => {
                try {
                    console.log("===============UPDATE LOCK==============");
                    this._viewTimeRange = {
                        from: (this._viewTimeRange.from as number - (this.CHUNK_SIZE * 2)) as Time,
                        to: this._viewTimeRange.to
                    }
                    await this._updateData();
                    console.log("DataFeed: entries after update: ", this._data.data.length)
                } finally {
                    const outOfViewDataRight = this._data.data.length - Math.floor(newRange.to)
                    console.log("===============UPDATE RELEASE==============");
                    this._updateDataMutex.release();
                }
            }); */
        }

        /*
        if (this._updateDataMutex.isLocked() || this._trimDataMutex.isLocked() || this._isLoading) return

        const outOfViewDataRight = this._data.data.length - Math.floor(newRange.to)
            console.log("DataFeed: OutOfViewDataRight", outOfViewDataRight)

        if (outOfViewDataRight > trimMargin) {
            this._trimDataMutex.acquire().then(async () => {
                try {
                    console.log("===============TRIM LOCK==============");
                    console.log("DataFeed: entries before trim: ", this._data.data.length)
                    await this.trimData(500, 'right');
                } finally {
                    this._trimDataMutex.release()
                    console.log("DataFeed: entries after trim: ", this._data.data.length)
                    const postoutOfViewDataRight = this._data.data.length - Math.floor(newRange.to)
                    console.log("DataFeed: POST OutOfViewDataRight", postoutOfViewDataRight)
                    console.log("===============TRIM RELEASE==============");

                }
            });


        }*/
    }

    public free() {
        console.log("Clearing dataFeed data");
        (this._data.data = []),
            (this._data.range = { from: 0, to: 0 } as IRange<Time>),
            (this._onDataUpdateCallback = null);
        this._onInitialDataLoadedCallback = null;
    }

    public get currentViewRange() {
        return this._viewTimeRange;
    }

    public get data() {
        return this._data;
    }

    public get isInitialDataLoaded() {
        return this._initialDataLoaded;
    }

    public get isLoading() {
        return this._isLoading;
    }
}
