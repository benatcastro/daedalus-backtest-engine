import { CandlestickData, Time } from 'lightweight-charts'

export interface DateRange {
  start: Date
  end: Date
}

export interface SampleDataOptions {
  /** Base price to start from (default: 100) */
  basePrice?: number
  /** Maximum price change per candle as percentage (default: 0.04 = 4%) */
  volatility?: number
  /** Overall trend: 'up', 'down', or 'sideways' (default: 'sideways') */
  trend?: 'up' | 'down' | 'sideways'
  /** Time interval between candles in minutes (default: 1440 = 1 day) */
  intervalMinutes?: number
  /** Random seed for reproducible data (optional) */
  seed?: number
}

/**
 * Generates realistic sample candlestick data for a given date range
 * This serves as a placeholder for backend endpoints during development
 *
 * @param dateRange - Start and end dates for the data
 * @param options - Configuration options for data generation
 * @returns Array of candlestick data points
 */
export function generateSampleCandlestickData(
  dateRange: DateRange,
  options: SampleDataOptions = {}
): CandlestickData[] {
  const {
    basePrice = 100,
    volatility = 0.04,
    trend = 'sideways',
    intervalMinutes = 60, // 1 day
    seed
  } = options

  // Simple seeded random number generator for reproducible data
  let seedValue = seed ?? Math.floor(Math.random() * 1000000)
  const random = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280
    return seedValue / 233280
  }

  const candlestickData: CandlestickData[] = []
  const startTime = Math.floor(dateRange.start.getTime() / 1000)
  const endTime = Math.floor(dateRange.end.getTime() / 1000)
  const intervalSeconds = intervalMinutes * 60

  let currentPrice = basePrice
  let currentTime = startTime

  // Calculate trend factor (small bias in price movement)
  const trendFactor = trend === 'up' ? 0.0005 : trend === 'down' ? -0.0005 : 0

  while (currentTime <= endTime) {
    const time = currentTime as Time

    // Generate price movement with trend bias
    const randomChange = (random() - 0.5) * 2 * volatility
    const trendChange = trendFactor
    const totalChange = randomChange + trendChange

    const open = currentPrice
    const close = open * (1 + totalChange)

    // Generate high and low based on open and close
    const highVolatility = random() * volatility * 0.5
    const lowVolatility = random() * volatility * 0.5

    const high = Math.max(open, close) * (1 + highVolatility)
    const low = Math.min(open, close) * (1 - lowVolatility)

    candlestickData.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2))
    })

    currentPrice = close
    currentTime += intervalSeconds
  }

  return candlestickData
}

/**
 * Generates sample data for common time periods
 */
export const generateCommonTimeRanges = {
  /**
   * Generate 1 day of 1-hour candles
   */
  oneDay: (basePrice = 100): CandlestickData[] => {
    const end = new Date()
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
    return generateSampleCandlestickData(
      { start, end },
      { basePrice, intervalMinutes: 60, volatility: 0.02 }
    )
  },

  /**
   * Generate 1 week of 4-hour candles
   */
  oneWeek: (basePrice = 100): CandlestickData[] => {
    const end = new Date()
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
    return generateSampleCandlestickData(
      { start, end },
      { basePrice, intervalMinutes: 240, volatility: 0.03 }
    )
  },

  /**
   * Generate 1 month of daily candles
   */
  oneMonth: (basePrice = 100): CandlestickData[] => {
    const end = new Date()
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
    return generateSampleCandlestickData(
      { start, end },
      { basePrice, intervalMinutes: 1440, volatility: 0.04 }
    )
  },

  /**
   * Generate 1 year of daily candles
   */
  oneYear: (basePrice = 100): CandlestickData[] => {
    const end = new Date()
    const start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000)
    return generateSampleCandlestickData(
      { start, end },
      { basePrice, intervalMinutes: 1440, volatility: 0.05, trend: 'up' }
    )
  }
}

/**
 * Simulates a backend API call with realistic delay
 * @param dateRange - Date range to fetch data for
 * @param options - Data generation options
 * @param delay - Simulated network delay in milliseconds (default: 300-800ms)
 * @returns Promise that resolves to candlestick data
 */
export async function fetchSampleCandlestickData(
  dateRange: DateRange,
  options: SampleDataOptions = {},
  delay?: number
): Promise<CandlestickData[]> {
  // Simulate realistic API delay
  const actualDelay = delay ?? Math.floor(Math.random() * 500) + 300
  await new Promise(resolve => setTimeout(resolve, actualDelay))

  return generateSampleCandlestickData(dateRange, options)
}

/**
 * Generate sample backtest-specific data with trading events
 * This includes periods of higher volatility to simulate trading activity
 */
export function generateBacktestSampleData(
  dateRange: DateRange,
  options: SampleDataOptions = {}
): {
  candlestickData: CandlestickData[]
  tradingEvents: Array<{
    time: Time
    type: 'buy' | 'sell'
    price: number
    volume?: number
  }>
} {
  const candlestickData = generateSampleCandlestickData(dateRange, {
    ...options,
    volatility: options.volatility ?? 0.035 // Slightly higher volatility for backtests
  })

  // Generate some sample trading events
  const tradingEvents = []
  const eventCount = Math.floor(candlestickData.length * 0.1) // 10% of candles have events

  for (let i = 0; i < eventCount; i++) {
    const randomIndex = Math.floor(Math.random() * candlestickData.length)
    const candle = candlestickData[randomIndex]

    tradingEvents.push({
      time: candle.time,
      type: Math.random() > 0.5 ? 'buy' as const : 'sell' as const,
      price: (candle.high + candle.low) / 2, // Mid-point price
      volume: Math.floor(Math.random() * 1000) + 100
    })
  }

  return { candlestickData, tradingEvents }
}

/**
 * Configuration for paginated data generation
 */
export interface PaginationConfig {
  /** Size of each chunk in hours (default: 24 * 7 = 1 week) */
  chunkSizeHours?: number
  /** Maximum number of candles per chunk (default: 1000) */
  maxCandlesPerChunk?: number
  /** Overlap between chunks in minutes for smooth transitions (default: 60) */
  overlapMinutes?: number
}

/**
 * Result from paginated data generation
 */
export interface PaginatedDataResult {
  data: CandlestickData[]
  totalChunks: number
  currentChunk: number
  hasNextChunk: boolean
  hasPreviousChunk: boolean
  chunkRange: DateRange
}

/**
 * Generate candlestick data for a specific chunk/page within a larger date range
 * This enables efficient loading of large backtests by breaking them into manageable pieces
 *
 * @param fullBacktestRange - The complete date range of the backtest
 * @param chunkIndex - Zero-based index of the chunk to generate (0 = first chunk)
 * @param paginationConfig - Configuration for chunk size and overlap
 * @param dataOptions - Options for data generation (volatility, trend, etc.)
 * @returns Paginated result with chunk data and navigation info
 */
export function generatePaginatedCandlestickData(
  fullBacktestRange: DateRange,
  chunkIndex: number,
  paginationConfig: PaginationConfig = {},
  dataOptions: SampleDataOptions = {}
): PaginatedDataResult {
  const {
    chunkSizeHours = 24 * 7, // 1 week chunks
    maxCandlesPerChunk = 1000,
    overlapMinutes = 60
  } = paginationConfig

  const {
    intervalMinutes = 60, // 1-hour candles by default
    ...restDataOptions
  } = dataOptions

  // Calculate total duration and number of chunks
  const totalDurationMs = fullBacktestRange.end.getTime() - fullBacktestRange.start.getTime()
  const chunkDurationMs = chunkSizeHours * 60 * 60 * 1000
  const totalChunks = Math.ceil(totalDurationMs / chunkDurationMs)

  // Validate chunk index
  if (chunkIndex < 0 || chunkIndex >= totalChunks) {
    throw new Error(`Chunk index ${chunkIndex} is out of range (0-${totalChunks - 1})`)
  }

  // Calculate chunk boundaries
  const chunkStartMs = fullBacktestRange.start.getTime() + (chunkIndex * chunkDurationMs)
  const chunkEndMs = Math.min(
    chunkStartMs + chunkDurationMs,
    fullBacktestRange.end.getTime()
  )

  // Add overlap for smooth transitions (except at boundaries)
  const overlapMs = overlapMinutes * 60 * 1000
  const actualStartMs = chunkIndex > 0 ? chunkStartMs - overlapMs : chunkStartMs
  const actualEndMs = chunkIndex < totalChunks - 1 ? chunkEndMs + overlapMs : chunkEndMs

  const chunkRange: DateRange = {
    start: new Date(actualStartMs),
    end: new Date(actualEndMs)
  }

  // Generate data for this chunk
  const data = generateSampleCandlestickData(chunkRange, {
    intervalMinutes,
    ...restDataOptions,
    // Use chunk-specific seed for consistent data per chunk
    seed: dataOptions.seed ? dataOptions.seed + chunkIndex : chunkStartMs
  })

  // Limit candles if necessary (for very long time periods)
  const limitedData = data.length > maxCandlesPerChunk
    ? data.slice(0, maxCandlesPerChunk)
    : data

  return {
    data: limitedData,
    totalChunks,
    currentChunk: chunkIndex,
    hasNextChunk: chunkIndex < totalChunks - 1,
    hasPreviousChunk: chunkIndex > 0,
    chunkRange: {
      start: new Date(chunkStartMs),
      end: new Date(chunkEndMs)
    }
  }
}

/**
 * Generate a range of chunks for smooth scrolling
 * Useful for preloading adjacent chunks
 *
 * @param fullBacktestRange - The complete date range of the backtest
 * @param centerChunk - The main chunk to center around
 * @param surroundingChunks - Number of chunks to load on each side (default: 1)
 * @param paginationConfig - Configuration for chunk generation
 * @param dataOptions - Options for data generation
 * @returns Array of paginated results
 */
export function generateChunkRange(
  fullBacktestRange: DateRange,
  centerChunk: number,
  surroundingChunks: number = 1,
  paginationConfig: PaginationConfig = {},
  dataOptions: SampleDataOptions = {}
): PaginatedDataResult[] {
  const results: PaginatedDataResult[] = []

  // Calculate the total number of chunks to determine bounds
  const totalDurationMs = fullBacktestRange.end.getTime() - fullBacktestRange.start.getTime()
  const chunkDurationMs = (paginationConfig.chunkSizeHours || 24 * 7) * 60 * 60 * 1000
  const totalChunks = Math.ceil(totalDurationMs / chunkDurationMs)

  const startChunk = Math.max(0, centerChunk - surroundingChunks)
  const endChunk = Math.min(totalChunks - 1, centerChunk + surroundingChunks)

  for (let i = startChunk; i <= endChunk; i++) {
    try {
      const result = generatePaginatedCandlestickData(
        fullBacktestRange,
        i,
        paginationConfig,
        dataOptions
      )
      results.push(result)
    } catch (error) {
      console.warn(`Failed to generate chunk ${i}:`, error)
    }
  }

  return results
}

/**
 * Helper to convert backtest date strings to DateRange
 * @param startDateString - ISO date string from backtest
 * @param endDateString - ISO date string from backtest
 * @returns DateRange object
 */
export function backtestDatesToRange(startDateString: string, endDateString: string): DateRange {
  return {
    start: new Date(startDateString),
    end: new Date(endDateString)
  }
}

/**
 * Wrapper function for generateSampleCandlestickData that accepts Time instances
 * This is specifically designed for use with ChartDataBuffer
 * @param startTime - Start time as Unix timestamp (Time type from lightweight-charts)
 * @param endTime - End time as Unix timestamp (Time type from lightweight-charts)
 * @param options - Configuration options for data generation
 * @returns Array of candlestick data points
 */
export function generateSampleCandlestickDataFromTimes(
  startTime: Time,
  endTime: Time,
  options: SampleDataOptions = {}
): CandlestickData[] {
  // Convert Time instances (Unix timestamps) to Date objects
  const startDate = new Date((startTime as number) * 1000)
  const endDate = new Date((endTime as number) * 1000)

  // Create DateRange object and call the original function
  const dateRange: DateRange = { start: startDate, end: endDate }
  return generateSampleCandlestickData(dateRange, options)
}

/**
 * Calculate optimal chunk size based on backtest duration
 * @param backtestRange - The full backtest date range
 * @param targetChunks - Desired number of chunks (default: 20)
 * @returns Optimal chunk size in hours
 */
export function calculateOptimalChunkSize(
  backtestRange: DateRange,
  targetChunks: number = 20
): number {
  const totalHours = (backtestRange.end.getTime() - backtestRange.start.getTime()) / (1000 * 60 * 60)
  const chunkSizeHours = Math.max(1, Math.ceil(totalHours / targetChunks))

  // Round to common intervals (1h, 6h, 12h, 1d, 3d, 1w, etc.)
  if (chunkSizeHours <= 1) return 1
  if (chunkSizeHours <= 6) return 6
  if (chunkSizeHours <= 12) return 12
  if (chunkSizeHours <= 24) return 24
  if (chunkSizeHours <= 24 * 3) return 24 * 3
  if (chunkSizeHours <= 24 * 7) return 24 * 7
  return Math.ceil(chunkSizeHours / (24 * 7)) * (24 * 7) // Round to weeks
}

/**
 * Calculate optimal initial view range for chart based on backtest duration
 * Uses a small percentage of the total backtest time or maximum 1 week
 * @param backtestRange - The full backtest date range
 * @param maxPercentage - Maximum percentage of total range to show (default: 5%)
 * @param maxDays - Maximum days to show regardless of percentage (default: 7)
 * @returns Optimal initial view range
 */
export function calculateOptimalInitialViewRange(
  backtestRange: DateRange,
  maxPercentage: number = 0.05, // 5% of total range
  maxDays: number = 0.1 // Max 1 week
): DateRange {
  const totalDurationMs = backtestRange.end.getTime() - backtestRange.start.getTime()
  const maxDurationMs = maxDays * 24 * 60 * 60 * 1000 // Convert days to milliseconds

  // Calculate the duration based on percentage, but cap it at maxDurationMs
  const percentageDurationMs = totalDurationMs * maxPercentage
  const actualDurationMs = Math.min(percentageDurationMs, maxDurationMs)

  // Start from the beginning of the backtest
  const startTime = backtestRange.start.getTime()
  const endTime = Math.min(startTime + actualDurationMs, backtestRange.end.getTime())

  return {
    start: new Date(startTime),
    end: new Date(endTime)
  }
}
