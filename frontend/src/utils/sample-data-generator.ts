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
    intervalMinutes = 1440, // 1 day
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
