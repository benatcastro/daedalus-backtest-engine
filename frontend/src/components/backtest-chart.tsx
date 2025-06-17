'use client'
import { useEffect, useMemo, useRef } from 'react'
import {
  createChart,
  IChartApi,
  CandlestickData,
  CandlestickSeries,
  ISeriesApi,
  Time,
  IRange,
} from 'lightweight-charts'
import { ChartDataBuffer, DataBounds } from '@/lib/chart-data-buffer'
import { SeriesDataBuffer } from '@/lib/chart-data-buffer-v2'
import Backtest from '@/app/types/backtest'
import { backtestDatesToRange, calculateOptimalInitialViewRange } from '@/utils/sample-data-generator'


interface BacktestChartProps {
  backtest: Backtest,
  className?: string
}

export default function BacktestChart({
  backtest,
  className = "w-full h-full"
}: BacktestChartProps) {

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const rangeRestorationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dateRange = backtestDatesToRange(backtest.starting_date, backtest.ending_date)

  // Calculate optimal initial view range (5% of total duration or max 1 week)
  const optimalInitialRange = calculateOptimalInitialViewRange(dateRange)
  console.log("Optimal Initial Range: ", optimalInitialRange)
  const candleStickDataBuffer = useMemo(() => {
    console.log("Use memo for creating the buffer")

    return new SeriesDataBuffer<CandlestickData>(
      async (range: IRange<Time>) => {
        // Create the query params
        const queryParams = new URLSearchParams({
          symbol: "ethusdt",
          start: range.from.toString(),
          end: range.to.toString(),
        })

        // Form the endpoint
        const endpoint = `${process.env.NEXT_PUBLIC_BACKTEST_BACKEND_URL}/api/v1/backtest/${backtest.id}/candles?${queryParams.toString()}`

        // Do the fetch
        return fetch(endpoint)
          .then(res => res.ok ? res.json() : Promise.reject(`HTTP ${res.status}: ${res.statusText}`))
          .then(data => data.map((candle: any) => ({
            time: new Date(candle.timestamp).getTime() / 1000 as Time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close
          })));
      },
      {
        from: (dateRange.start.getTime() / 1000) as Time,
        to: (dateRange.end.getTime() / 1000) as Time
      }
    )


  }, [backtest])


  useEffect(() => {
    console.log("Use Effect for creating the chart")
    if (!chartContainerRef.current) {
      console.error("Chart container ref is null")
      return
    }

    const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        timeScale: {
          rightOffset: 12,
          barSpacing: 3,
          fixLeftEdge: false,
          lockVisibleTimeRangeOnResize: true,
          rightBarStaysOnScroll: true,
          borderVisible: false,
          visible: true,
          timeVisible: true,
          secondsVisible: false,
        },
        grid: {
          vertLines: {
            color: "rgba(197, 203, 206, 0.5)",
          },
          horzLines: {
            color: "rgba(197, 203, 206, 0.5)",
          },
        },
        crosshair: {
          mode: 1,
        },
    });

    const newSeries = chart.addSeries(CandlestickSeries);
    chartRef.current = chart;
    seriesRef.current = newSeries;

    return () => {
      console.log("Cleaning up chart");
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  },[backtest])  // Add dependency to re-run when buffer changes  // Effect to set initial data when buffer is ready
  useEffect(() => {
    if (!candleStickDataBuffer || !chartRef.current) return
    const initialize = async () => {
      console.log("Setting initial data from buffer:", candleStickDataBuffer)
      await candleStickDataBuffer.initialize(
        {
          from: (optimalInitialRange.start.getTime() / 1000) as Time,
          to: (optimalInitialRange.end.getTime() / 1000) as Time
        })
    }
    initialize()
  }, [candleStickDataBuffer, chartRef.current])
  useEffect(() => {
    if (!candleStickDataBuffer || !chartRef.current) return

    // Subscribe to initial data loaded event to reset the view once
    candleStickDataBuffer.subscribeToInitialDataLoaded(() => {
      if (chartRef.current) {
        console.log("Initial data loaded - resetting view to optimal range")

        // Use a small delay to ensure data is fully rendered
        setTimeout(() => {
          if (chartRef.current) {
            chartRef.current.timeScale().setVisibleRange({
              from: (optimalInitialRange.start.getTime() / 1000) as Time,
              to: (optimalInitialRange.end.getTime() / 1000) as Time
            })
          }
        }, 50)
      }
    })
  }, [candleStickDataBuffer, chartRef.current, optimalInitialRange])

  // Effect to set up time range change subscription
  useEffect(() => {
    console.log("Setting up subscription effect", {
      hasChart: !!chartRef.current,
      hasBuffer: !!candleStickDataBuffer
    });

    if (!chartRef.current || !candleStickDataBuffer) {
      console.log("Missing chart or buffer, skipping subscription");
      return;
    }




    let lastNotLoadingViewRange: IRange<Time>;

    const timeRangeChangeHandler = async (timeRange: IRange<Time> | null) => {
      if (!timeRange) return

      // Obtain the real change in the chart
      if (!candleStickDataBuffer.isLoading) {
        lastNotLoadingViewRange = timeRange
      }

      if (candleStickDataBuffer.isLoading && lastNotLoadingViewRange) {
        chartRef.current?.timeScale().setVisibleRange(lastNotLoadingViewRange)

      }

      if (!candleStickDataBuffer.isLoading)
        candleStickDataBuffer.updateDataRange(timeRange)
    }

    // Subscribe to full data updates (for initial load)
    candleStickDataBuffer.subscribeToDataUpdates((data: CandlestickData[]) => {
      if (!seriesRef.current || !chartRef.current) return

      console.log("Full data update - replacing all chart data")
      seriesRef.current.setData(data)
    })

    // Subscribe to incremental data appends (for smooth loading of new chunks)
    candleStickDataBuffer.subscribeToDataAppends((newData: CandlestickData[]) => {
      if (!seriesRef.current || !chartRef.current || newData.length === 0) return

      console.log(`Appending ${newData.length} new candles to chart using update()`)

      // Use update() method to append each new data point individually
      // This maintains chart continuity and prevents view jumping
      newData.forEach(candle => {
        seriesRef.current?.update(candle)
      })
    })

    console.log("Subscribing to visible time range changes");
    chartRef.current.timeScale().subscribeVisibleTimeRangeChange(timeRangeChangeHandler)

    return () => {
      console.log("Unsubscribing from visible time range changes")
      if (chartRef.current) {
        chartRef.current.timeScale().unsubscribeVisibleTimeRangeChange(timeRangeChangeHandler)
      }
    }
  }, [candleStickDataBuffer])

  return (
    <div
      ref={chartContainerRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
