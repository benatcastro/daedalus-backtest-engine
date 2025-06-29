/**
 * Series type enums matching backend definitions
 */
export type SeriesType = "area" | "candle" | "line" | "bar" | "scatter";

export type DataType = "stored" | "external";

/**
 * Series metadata interface without the data field (for listing)
 */
export interface SeriesMetadata {
    id: number; // Unique chart identifier
    backtest_id: number; // Associated backtest identifier
    name: string; // Display name for the chart
    type: SeriesType; // Visual representation type (area, candle, line, etc.)
    data_type: DataType; // Source of chart data (stored in DB or external)
    parameters: Record<string, any>; // Chart parameters and configuration options
}

/**
 * Complete series interface including data field
 */
export interface Series extends SeriesMetadata {
    data: Record<string, any>[]; // Chart data in JSON format containing time-based series data
}

export default Series;
