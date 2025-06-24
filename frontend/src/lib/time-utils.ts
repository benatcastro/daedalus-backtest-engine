import { Time } from "lightweight-charts";

/**
 * Converts a Lightweight Charts Time type (number | string | BusinessDay) to a JS timestamp (number, ms since epoch).
 * @param time - The time value from Lightweight Charts
 * @returns The corresponding timestamp in milliseconds
 */
export function timeToTimestamp(time: Time): number {
  if (typeof time === 'number') {
    // Assume time is UNIX timestamp in seconds
    return time * 1000;
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
