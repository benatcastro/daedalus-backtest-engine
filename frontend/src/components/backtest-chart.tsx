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
import Backtest from '@/app/types/backtest'
import { generateSampleCandlestickDataFromTimes, backtestDatesToRange, generateSampleCandlestickData, calculateOptimalInitialViewRange } from '@/utils/sample-data-generator'


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

  const dateRange = backtestDatesToRange(backtest.starting_date, backtest.ending_date)

  // Calculate optimal initial view range (5% of total duration or max 1 week)
  const optimalInitialRange = calculateOptimalInitialViewRange(dateRange)
  const initialViewRange = {
    from: optimalInitialRange.start.getTime() / 1000 as Time,
    to: optimalInitialRange.end.getTime() / 1000 as Time
  }

  const candleStickDataBuffer = useMemo(() => {
    console.log("Use memo for creating the buffer")

    // Create bounds for the data buffer
    const dataBounds = {
      start: dateRange.start.getTime() / 1000 as Time,
      end: dateRange.end.getTime() / 1000 as Time
    }


    return new ChartDataBuffer<CandlestickData>(
      {
        fetchData: async (start: Time, end: Time): Promise<CandlestickData[]> => {
          const startDate = new Date((start as number) * 1000);
          const endDate = new Date((end as number) * 1000);
          return generateSampleCandlestickData({ start: startDate, end: endDate });
        }
      },
      initialViewRange,
      generateSampleCandlestickDataFromTimes(initialViewRange.from, initialViewRange.to),
      dataBounds
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
    });
    chart.timeScale().fitContent();

    const newSeries = chart.addSeries(CandlestickSeries);
    chartRef.current = chart;
    seriesRef.current = newSeries;

    return () => {
      console.log("Cleaning up chart");
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  },[backtest])  // Add dependency to re-run when buffer changes

  // Effect to set initial data when buffer is ready
  useEffect(() => {
    if (!candleStickDataBuffer || !seriesRef.current) return
    console.log("Setting initial data from buffer:", candleStickDataBuffer)
    seriesRef.current.setData(candleStickDataBuffer.data)
  }, [candleStickDataBuffer])

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

    let isUpdating = false;

    const timeRangeChangeHandler = async (timeRange: IRange<Time> | null) => {
      console.log("TimeRangeChangeHandler called:", timeRange, "isUpdating:", isUpdating)
      if (!timeRange || isUpdating) return

      try {
        isUpdating = true;

        const currentDataLength = candleStickDataBuffer.data.length;
        await candleStickDataBuffer.updateViewRange(timeRange);
        const newData = candleStickDataBuffer.data;

        console.log("Data length changed from", currentDataLength, "to", newData.length);

        // Only update chart if data actually changed
        if (newData.length !== currentDataLength && seriesRef.current) {
          console.log("Setting new data on series");
          seriesRef.current.setData(newData);
        }
      } finally {
        isUpdating = false;
      }
    }

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
