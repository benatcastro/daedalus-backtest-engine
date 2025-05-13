'use client';

import { createChart, ISeriesApi, Time, CandlestickData, CandlestickSeries } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

type Candle = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
};

const SYMBOL = 'BTCUSD';
const RESOLUTION = '1m';
const API = "http://127.0.0.1:8000/backtest/1/data/BTC?start=1727733600&end=1727906400"

export default function ChartPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const loadedRangeRef = useRef<{ from: number; to: number } | null>(null);

  async function fetchCandleData(from: number, to: number): Promise<Candle[]> {
    const res = await fetch(API);
    const data = res.json()
    console.log(data)
    return data;
  }

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        textColor: '#d1d4dc',
        background: { type: 'Solid', color: '#111' },
      },
      grid: {
        vertLines: { color: '#2b2b2b' },
        horzLines: { color: '#2b2b2b' },
      },
    });

    const series = chart.addSeries(CandlestickSeries);
    seriesRef.current = series;

    // Load initial data (e.g. last 24h)
    const now = Math.floor(Date.now() / 1000);
    const initialFrom = now - 60 * 60 * 24;
    const initialTo = now;

    fetchCandleData(initialFrom, initialTo).then((data) => {
      console.log(data)
      series.setData(data);
      loadedRangeRef.current = { from: initialFrom, to: initialTo };
    });

    chart.timeScale().subscribeVisibleTimeRangeChange(async (range) => {
      if (!range || !loadedRangeRef.current || !seriesRef.current) return;

      const { from: loadedFrom } = loadedRangeRef.current;
      const visibleFrom = Math.floor(range.from as number);

      const threshold = 60 * 30; // 30 minutes in seconds

      // Load older candles if nearing left edge
      if (visibleFrom - loadedFrom < threshold) {
        const newFrom = loadedFrom - 60 * 60 * 24; // 1 day back
        const newData = await fetchCandleData(newFrom, loadedFrom - 60);
        seriesRef.current.setData([...newData, ...seriesRef.current.getData?.() || []]);
        loadedRangeRef.current.from = newFrom;
      }
    });

    return () => {
      chart.remove();
    };
  }, []);

  return <div ref={chartContainerRef} className="w-full h-[500px]" />;
}
