import { IRange, Time } from "lightweight-charts";

export interface TimeBasedData {
  time: Time;
}

export interface BufferConfig {
  maxSize: number;
  chunkSizeHours: number;
  threshold: number;
  trimSize: number;
}

export interface DataBounds {
  start: Time;
  end: Time;
}

export interface ChartDataBufferFetcher<T extends TimeBasedData> {
  fetchData(start: Time, end: Time): Promise<T[]>;
}

export class ChartDataBuffer<T extends TimeBasedData> {
  private _data: T[] = [];
  private _dataRange: IRange<Time>;
  private _currentRange: IRange<Time>;
  private _dataFetcher: ChartDataBufferFetcher<T>;
  private _config: BufferConfig;
  private _bounds: DataBounds;
  private _isLoading = false;
  private _loadingPromise: Promise<void> | null = null;

  constructor(
    dataFetcher: ChartDataBufferFetcher<T>,
    startingViewRange: IRange<Time>,
    initialData: T[],
    bounds: DataBounds,
    config: BufferConfig = {
      maxSize: 5000,
      chunkSizeHours: 24,
      threshold: 10,
      trimSize: 1000,
    },
  ) {
    this._dataFetcher = dataFetcher;
    this._config = config;
    this._bounds = bounds;
    this._currentRange = startingViewRange;
    // Remove duplicates from initial data and sort chronologically
    this._data = this.mergeDatWithoutDuplicates([], initialData, "append");
    this._dataRange = this.getDataRange();
    console.log(
      "Data Buffer created, initial data length:",
      initialData.length,
    );
    console.log("Initial view range:", startingViewRange);
    console.log("Data bounds:", bounds);
    this.logDateRange(
      startingViewRange.from,
      startingViewRange.to,
      "Initial view range",
    );
    this.logDateRange(bounds.start, bounds.end, "Data bounds");
  }

  public getDataRange(): IRange<Time> {
    // Sort the data by time to ensure chronological order
    const sortedData = [...this._data].sort(
      (a, b) => (a.time as number) - (b.time as number),
    );

    const start = sortedData[0].time as Time;
    const end = sortedData[sortedData.length - 1].time as Time;

    this.logDateRange(start, end, "Data Range");
    return { from: start, to: end };
  }

  public get currentViewRange(): IRange<Time> {
    return this._currentRange;
  }

  public get bounds(): DataBounds {
    return this._bounds;
  }

  public get data(): T[] {
    return [...this._data];
  }

  public getRange(range: IRange<Time>): T[] {
    const { from, to } = range;
    const result = this._data.filter((item) => {
      const itemTime = item.time as number;
      return itemTime >= (from as number) && itemTime <= (to as number);
    });

    //this.logDateRange(from, to, "Getting Range")
    return result;
  }

  logDateRange(from: Time, to: Time, message: string): void {
    const fromDate = new Date((from as number) * 1000).toLocaleString();
    const toDate = new Date((to as number) * 1000).toLocaleString();

    // Log with colors
    const green = "\x1b[32m"; // ANSI code for green
    const reset = "\x1b[0m"; // Reset color
    console.log(
      `${message}: ${green}${fromDate} -> ${toDate}${reset} || ${from} -> ${to}`,
    );
  }

  public async updateData(timeMovement: Time) {
    if (this._isLoading) {
      console.log("Already loading data, skipping duplicate request");
      return;
    }

    this._isLoading = true;

    try {
      if (this._data.length === 0) {
        // If no data exists, fetch the entire range but constrain to bounds
        const requestedRange =
          (timeMovement as number) > 0
            ? {
                from: this._currentRange.from as number as Time,
                to: ((this._currentRange.to as number) +
                  (timeMovement as number) * this._config.threshold) as Time,
              }
            : {
                from: ((this._currentRange.from as number) +
                  Math.abs(timeMovement as number) *
                    this._config.threshold) as Time,
                to: ((this._currentRange.to as number) +
                  this._config.threshold) as Time,
              };

        const constrainedRange = this.constrainToBounds(requestedRange);

        this._data = await this._dataFetcher.fetchData(
          constrainedRange.from,
          constrainedRange.to,
        );
        console.log(
          `Fetched initial data. Bounds: ${this._data[0]?.time} -> ${this._data[this._data.length - 1]?.time}`,
        );
        return;
      }

      const currentDataRange = this._dataRange;
      const requestedRange = {
        from: ((this._currentRange.from as number) -
          this._config.threshold) as Time,
        to: ((this._currentRange.to as number) +
          this._config.threshold) as Time,
      };

      // Constrain the requested range to the data bounds
      const constrainedRange = this.constrainToBounds(requestedRange);

      const blue = "\x1b[34m";
      const reset = "\x1b[0m";

      // Check if we need to fetch data before the current range (prepend)
      if (
        (constrainedRange.from as number) < (currentDataRange.from as number)
      ) {
        // Only fetch if we're not already at the start bound
        if (
          (currentDataRange.from as number) > (this._bounds.start as number)
        ) {
          console.log(
            `${blue}Prepending data from ${constrainedRange.from} to ${currentDataRange.from}${reset}`,
          );
          const prependData = await this._dataFetcher.fetchData(
            constrainedRange.from,
            currentDataRange.from,
          );
          this._data = this.mergeDatWithoutDuplicates(
            this._data,
            prependData,
            "prepend",
          );
          console.log(
            `Prepended ${prependData.length} items. Total: ${this._data.length}`,
          );
        } else {
          console.log(
            `${blue}Already at start bound, skipping prepend${reset}`,
          );
        }
      }

      // Check if we need to fetch data after the current range (append)
      if ((constrainedRange.to as number) > (currentDataRange.to as number)) {
        // Only fetch if we're not already at the end bound
        if ((currentDataRange.to as number) < (this._bounds.end as number)) {
          console.log(
            `${blue}Appending data from ${currentDataRange.to} to ${constrainedRange.to}${reset}`,
          );
          const appendData = await this._dataFetcher.fetchData(
            currentDataRange.to,
            constrainedRange.to,
          );
          this._data = this.mergeDatWithoutDuplicates(
            this._data,
            appendData,
            "append",
          );
          console.log(
            `Appended ${appendData.length} items. Total: ${this._data.length}`,
          );
        } else {
          console.log(`${blue}Already at end bound, skipping append${reset}`);
        }
      }
      this._dataRange.from = this._data[0].time;
      this._dataRange.to = this._data[this._data.length - 1].time;
      console.log(
        `Updated data bounds: ${this._data[0].time} -> ${this._data[this._data.length - 1].time}`,
      );
    } finally {
      this._isLoading = false;
    }
  }

  public async updateViewRange(range: IRange<Time>) {
    // Check if the range is actually different to prevent infinite loops
    if (this.rangesAreEqual(this._currentRange, range)) {
      console.log("Range hasn't changed, skipping update");
      return;
    }

    // Only update if we're not already loading to prevent race conditions
    if (this._isLoading) {
      console.log("Already loading data, skipping update");
      return;
    }

    this.logDateRange(range.from, range.to, "Updating view range");
    const timeDiff = this.getTimeRangeDifference(this._currentRange, range);
    this._currentRange = range;
    await this.updateData(timeDiff);
  }

  public get isLoading(): boolean {
    return this._isLoading;
  }

  // Helper method to remove duplicates and maintain chronological order
  private mergeDatWithoutDuplicates(
    existingData: T[],
    newData: T[],
    operation: "prepend" | "append",
  ): T[] {
    const combinedData =
      operation === "prepend"
        ? [...newData, ...existingData]
        : [...existingData, ...newData];

    // Remove duplicates based on time and sort chronologically
    const uniqueData = combinedData.reduce((acc: T[], current: T) => {
      const existingIndex = acc.findIndex(
        (item) => (item.time as number) === (current.time as number),
      );
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        // Keep the newer data entry (current one being processed)
        acc[existingIndex] = current;
      }
      return acc;
    }, []);

    // Sort by time to ensure chronological order
    return uniqueData.sort((a, b) => (a.time as number) - (b.time as number));
  }

  // Helper method to check if we already have data for a specific time range
  private hasDataForRange(range: IRange<Time>): boolean {
    if (this._data.length === 0) return false;

    const currentDataRange = this.getDataRange();
    return (
      (currentDataRange.from as number) <= (range.from as number) &&
      (currentDataRange.to as number) >= (range.to as number)
    );
  }

  // Helper method for debugging - get count of unique timestamps
  public getUniqueDataCount(): number {
    const uniqueTimes = new Set(this._data.map((item) => item.time as number));
    return uniqueTimes.size;
  }

  // Helper method for debugging - check for duplicates
  public hasDuplicates(): boolean {
    const times = this._data.map((item) => item.time as number);
    return times.length !== new Set(times).size;
  }

  // Helper method to constrain a range to the data bounds
  private constrainToBounds(range: IRange<Time>): IRange<Time> {
    return {
      from: Math.max(
        range.from as number,
        this._bounds.start as number,
      ) as Time,
      to: Math.min(range.to as number, this._bounds.end as number) as Time,
    };
  }

  // Helper method to compare time ranges with tolerance for floating point precision
  private rangesAreEqual(range1: IRange<Time>, range2: IRange<Time>): boolean {
    return (
      (range1.from as number) === (range2.from as number) &&
      (range1.to as number) === (range2.to as number)
    );
  }

  // Helper method to calculate time difference between two time ranges (in seconds)
  private getTimeRangeDifference(
    newRange: IRange<Time>,
    currentRange: IRange<Time>,
  ): Time {
    const newNumRange: IRange<number> = newRange as IRange<number>;
    const currNumRange: IRange<number> = currentRange as IRange<number>;

    if (
      newNumRange.from === currNumRange.from &&
      newNumRange.to !== currNumRange.to
    ) {
      return (currNumRange.to - newNumRange.to) as Time;
    } else {
      return (currNumRange.from - newNumRange.from) as Time;
    }
  }
}
