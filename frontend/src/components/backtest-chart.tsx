'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import {
  createChart,
  IChartApi,
  CandlestickData,
  CandlestickSeries,
  ISeriesApi,
  Time,
  ColorType,
  CrosshairMode,
  PriceScaleMode
} from 'lightweight-charts'

interface BacktestChartProps {
  candlestickData: CandlestickData[]
  width?: number
  height?: number
  className?: string
}

export default function BacktestChart({
  candlestickData,
  width,
  height,
  className = "w-full h-full"
}: BacktestChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const { theme } = useTheme()

  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current) return

    const isDark = theme === 'dark'

    // Get container dimensions
    const containerWidth = width || chartContainerRef.current.clientWidth
    const containerHeight = height || chartContainerRef.current.clientHeight || 400

    // Theme-based colors following shadcn/ui design system
    const chartColors = {
      background: isDark ? 'hsl(0 0% 3.9%)' : 'hsl(0 0% 100%)',
      textColor: isDark ? 'hsl(0 0% 98%)' : 'hsl(0 0% 3.9%)',
      gridColor: isDark ? 'hsl(0 0% 14.9%)' : 'hsl(0 0% 89.1%)',
      crosshairColor: isDark ? 'hsl(0 0% 63.9%)' : 'hsl(0 0% 45.1%)',
      borderColor: isDark ? 'hsl(0 0% 14.9%)' : 'hsl(0 0% 89.1%)',
      upColor: 'hsl(142.1 76.2% 36.3%)', // green
      downColor: 'hsl(346.8 77.2% 49.8%)', // red
    }

    const chart = createChart(chartContainerRef.current, {
      width: containerWidth,
      height: containerHeight,
      layout: {
        background: { type: ColorType.Solid, color: chartColors.background },
        textColor: chartColors.textColor,
        fontSize: 12,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      },
      grid: {
        vertLines: {
          color: chartColors.gridColor,
          style: 0, // solid
          visible: true,
        },
        horzLines: {
          color: chartColors.gridColor,
          style: 0, // solid
          visible: true,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: chartColors.crosshairColor,
          width: 1,
          style: 3, // dashed
          labelVisible: true,
        },
        horzLine: {
          color: chartColors.crosshairColor,
          width: 1,
          style: 3, // dashed
          labelVisible: true,
        },
      },
      rightPriceScale: {
        borderColor: chartColors.borderColor,
        borderVisible: true,
        mode: PriceScaleMode.Normal,
        autoScale: true,
        invertScale: false,
        alignLabels: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: chartColors.borderColor,
        borderVisible: true,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    })

    // Add candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: chartColors.upColor,
      downColor: chartColors.downColor,
      borderUpColor: chartColors.upColor,
      borderDownColor: chartColors.downColor,
      wickUpColor: chartColors.upColor,
      wickDownColor: chartColors.downColor,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries

    return chart
  }, [theme, width, height])

  // Update chart data when candlestickData changes
  useEffect(() => {
    if (candlestickSeriesRef.current && candlestickData.length > 0) {
      candlestickSeriesRef.current.setData(candlestickData)
      chartRef.current?.timeScale().fitContent()
    }
  }, [candlestickData])  // Initialize chart

  useEffect(() => {
    const chart = initializeChart()

    // If we have data and the chart was successfully initialized, set the data
    if (chart && candlestickSeriesRef.current && candlestickData.length > 0) {
      candlestickSeriesRef.current.setData(candlestickData)
      chart.timeScale().fitContent()
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        candlestickSeriesRef.current = null
      }
    }
  }, [initializeChart])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const containerWidth = width || chartContainerRef.current.clientWidth
        const containerHeight = height || chartContainerRef.current.clientHeight || 400

        chartRef.current.applyOptions({
          width: containerWidth,
          height: containerHeight
        })
      }
    }

    if (chartContainerRef.current) {
      const resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(chartContainerRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [width, height])

  return (
    <div
      ref={chartContainerRef}
      className={className}
      style={{ width: width || '100%', height: height || '100%' }}
    />
  )
}
