// sorted-array.ts
// Utility for efficiently managing sorted arrays of time-based data for charting/backtest visualization.
// Provides binary search, efficient prepend/append, and range queries.

import { TimeBasedData } from "@/types/time-based-data";
import { Time, IRange } from "lightweight-charts";
import { timeToTimestamp } from "@/lib/time-utils";

// Define SortedArray interface for generic sorted array operations
export interface SortedArray<T> {
    // Binary search for a target element. Returns index or null if not found.
    bsearch(target: T): number | null;
    // Prepend a sorted array of elements (earlier times) efficiently. Returns number of items inserted.
    prepend(sorted: T[]): number;
    // Append a sorted array of elements (later times) efficiently. Returns number of items inserted.
    append(sorted: T[]): number;
    // Free all data and reset the array
    free(): void;

    get(idx: number): T;
    data: T[];
    length: number;
}

// Implementation of SortedArray for time-based chart data
export class TimeSortedArray implements SortedArray<TimeBasedData> {
    // Internal storage for sorted time-based data
    private _data: TimeBasedData[] = [];

    /**
     * Performs a binary search for a TimeBasedData by time.
     *
     * @param target The TimeBasedData object to search for (by time).
     * @returns The index of the found element, or null if not found.
     */
    bsearch(target: TimeBasedData): number | null {
        let low = 0,
            high = this._data.length - 1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const cmp = timeToTimestamp(this._data[mid].time) - timeToTimestamp(target.time);
            if (cmp === 0) return mid;
            if (cmp < 0) low = mid + 1;
            else high = mid - 1;
        }
        return null;
    }

    /**
     * Efficiently prepends sorted data (earlier times) to the front of the array.
     * Avoids duplicates/overlap.
     *
     * @param sorted Array of TimeBasedData, sorted in ascending order by time.
     * @returns The number of items inserted.
     */
    prepend(sorted: TimeBasedData[]): number {
        const inputCopy = [...sorted];
        console.log("TimeSortedArray: prepending: ", sorted.length, " items");

        if (sorted.length === 0) return 0;
        if (this._data.length === 0) {
            this._data = inputCopy;
            return 0;
        }

        // Find the first index in sorted where the timestamp is greater than the earliest in this.data
        const earliestTime = this._data[0].time;
        const endIdx = this.findLastIndexBefore(inputCopy, earliestTime);
        if (inputCopy[endIdx].time >= this._data[0].time) {
            throw Error("The preprending last item's time is greater than data[0].time");
        }

        if (endIdx === 0) return 0; // All items are after or equal to earliest, nothing to prepend

        const toInsert = inputCopy.slice(0, endIdx);

        if (toInsert.length > 0) {
            this._data = [...toInsert, ...this._data];
        }

        return toInsert.length;
    }

    /**
     * Efficiently appends sorted data (later times) to the end of the array.
     * Avoids duplicates/overlap.
     *
     * @param sorted Array of TimeBasedData, sorted in ascending order by time.
     * @returns The number of items inserted.
     */
    append(sorted: TimeBasedData[]): number {
        console.log(
            "TimeSortedArray: appending: ",
            sorted.length,
            " items , currently ",
            this._data.length,
            " items",
        );
        const inputCopy = [...sorted];

        if (this._data.length === 0) {
            this._data = inputCopy;
            return 0;
        }

        const latestTime = this._data[this._data.length - 1].time;
        const startIdx = this.findFirstIndexAfter(inputCopy, latestTime);

        if (startIdx >= inputCopy.length) return 0;

        const toInsert = inputCopy.slice(startIdx);
        this._data.push(...toInsert);

        return toInsert.length;
    }

/**
 * Finds the index of the largest element with time strictly less than the given time.
 * Useful for finding the closest data point before a specific timestamp.
 *
 * @param sorted Array of TimeBasedData, sorted in ascending order by time.
 * @param time The time to compare against.
 * @returns The index of the largest element with time < given time, or -1 if not found.
 */
private findLastIndexBefore(sorted: TimeBasedData[], time: Time): number {
    const timeStamp = timeToTimestamp(time);
    let low = 0,
        high = sorted.length - 1;

    // If array is empty or all elements are after or equal to the target time
    if (sorted.length === 0 || timeToTimestamp(sorted[0].time) >= timeStamp) {
        return -1;
    }

    // If all elements are strictly before the target time
    if (timeToTimestamp(sorted[high].time) < timeStamp) {
        return high;
    }

    // Binary search to find the largest element < target
    while (low < high) {
        // Use ceiling division to avoid infinite loop when low+1=high
        const mid = Math.floor((low + high + 1) / 2);

        if (timeToTimestamp(sorted[mid].time) < timeStamp) {
            low = mid; // This element is a candidate
        } else {
            high = mid - 1; // Look in the lower half
        }
    }

    return low;
}
    /**
     * Finds the first index in a sorted array where the time is after the given time.
     *
     * @param sorted Array of TimeBasedData, sorted in ascending order by time.
     * @param time The time to compare against.
     * @returns The index of the first element after the given time.
     */
    private findFirstIndexAfter(sorted: TimeBasedData[], time: Time): number {
        const timeStamp = timeToTimestamp(time);
        let low = 0,
            high = sorted.length;
        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (timeToTimestamp(sorted[mid].time) <= timeStamp) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return low;
    }

    /**
     * Gets a range of elements between two times (inclusive).
     *
     * @param startTime The start time (inclusive).
     * @param endTime The end time (inclusive).
     * @returns An array of TimeBasedData within the specified time range.
     */
    getRange(startTime: Time, endTime: Time): TimeBasedData[] {
        const startTs = timeToTimestamp(startTime);
        const endTs = timeToTimestamp(endTime);
        return this._data.filter((d) => {
            const t = timeToTimestamp(d.time);
            return t >= startTs && t <= endTs;
        });
    }

    /**
     * Returns the underlying data array (read-only).
     *
     * @returns The internal array of TimeBasedData.
     */
    get data(): TimeBasedData[] {
        return this._data;
    }

    /**
     * Gets the element at the specified index.
     * Throws an error if the index is out of bounds.
     *
     * @param idx The index of the element to retrieve.
     * @returns The TimeBasedData at the given index.
     * @throws Error if the index is not within the array bounds.
     */
    get(idx: number): TimeBasedData {
        if (idx < 0 || idx >= this._data.length) {
            throw new Error(
                `Index ${idx} is out of bounds for TimeSortedArray (length: ${this._data.length})`,
            );
        }
        return this._data[idx];
    }

    /**
     * Gets the number of elements in the array.
     *
     * @returns The length of the array.
     */
    get length(): number {
        return this._data.length;
    }

    /**
     * Returns an IRange<Time> representing the time bounds of the data.
     * Throws an error if the array is empty.
     *
     * @returns An object with 'from' and 'to' properties (both Time).
     * @throws Error if the array is empty.
     */
    getTimeBounds(): IRange<Time> {
        if (this._data.length === 0) {
            throw new Error("Cannot get time bounds: TimeSortedArray is empty");
        }
        return {
            from: this._data[0].time,
            to: this._data[this._data.length - 1].time,
        };
    }

    /**
     * Frees all data from the array and resets it to an empty state.
     * This helps with memory management when the array is no longer needed
     * or when you want to completely reset its contents.
     */
    free(): void {
        this._data = [];
    }
}
