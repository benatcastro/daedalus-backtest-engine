import { IRange, Time } from "lightweight-charts";

/**
 * Converts a Lightweight Charts Time type (number | string | BusinessDay) to a JS timestamp (number, ms since epoch).
 * @param time - The time value from Lightweight Charts
 * @returns The corresponding timestamp in milliseconds
 */
export function timeToTimestamp(time: Time): number {
  if (typeof time === 'number') {
    // Assume time is UNIX timestamp in seconds
    return time;
  }
  if (typeof time === 'string') {
    // Parse ISO date string
    return new Date(time).getTime();
  }
  if (typeof time === 'object' && time !== null) {
    // BusinessDay or similar object
    const { year, month, day } = time;
    // month is 1-based in LightweightCharts, JS Date uses 0-based month
    return new Date(year, month - 1, day).getTime();
  }
  throw new Error('Unsupported time format');
}

/**
 * Converts a JavaScript Date object to a Lightweight Charts Time object (Unix timestamp in seconds)
 * @param date - JavaScript Date object
 * @returns Time object for Lightweight Charts (Unix timestamp in seconds)
 */
export function dateToTime(date: Date): Time {
  // Convert milliseconds to seconds and cast to Time
  return (Math.floor(date.getTime() / 1000)) as Time;
}

/**
 * Converts an IRange of Date objects to an IRange of Time objects for Lightweight Charts
 * @param dateRange - Range with JavaScript Date objects
 * @returns Range with Lightweight Charts Time objects (Unix timestamps in seconds)
 */
export function dateRangeToTimeRange(dateRange: IRange<Date>): IRange<Time> {
  return {
    from: dateToTime(dateRange.from),
    to: dateToTime(dateRange.to)
  };
}

/**
 * Helper to convert backtest date strings to DateRange
 * @param startDateString - ISO date string from backtest
 * @param endDateString - ISO date string from backtest
 * @returns IRange<Date> object
 */
export function isoTimeToDateRange(
  startDateString: string,
  endDateString: string,
): IRange<Date> {
  return {
    from: new Date(startDateString),
    to: new Date(endDateString),
  };
}



