'use client';

import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function CandlestickChart({ data }) {
  const chartContainerRef = useRef();

  useEffect(() => {
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#000',
      },
      grid: {
        vertLines: { color: '#eee' },
        horzLines: { color: '#eee' },
      },
      priceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries();

    candleSeries.setData(data);

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      chart.remove();
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />;
}
