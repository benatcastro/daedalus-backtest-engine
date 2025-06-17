'use client';

import { useEffect, useState } from 'react';
import { DeepPartial, ChartOptions } from 'lightweight-charts';

/**
 * Create chart options for a specific theme
 */
function createChartOptionsForTheme(isDark: boolean): DeepPartial<ChartOptions> {
  return {
    layout: {
      background: {
        color: isDark ? '#0a0a0a' : '#ffffff',
      },
      textColor: isDark ? '#fafafa' : '#0a0a0a',
    },
    grid: {
      vertLines: {
        color: isDark ? '#262626' : '#f4f4f5',
      },
      horzLines: {
        color: isDark ? '#262626' : '#f4f4f5',
      },
    },
    crosshair: {
      mode: 1,
      vertLine: {
        color: isDark ? '#71717a' : '#71717a',
        width: 1,
        style: 1,
      },
      horzLine: {
        color: isDark ? '#71717a' : '#71717a',
        width: 1,
        style: 1,
      },
    },
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
    rightPriceScale: {
      borderColor: isDark ? '#262626' : '#e4e4e7',
    },
    leftPriceScale: {
      borderColor: isDark ? '#262626' : '#e4e4e7',
    },
  };
}

/**
 * Simple hook to get chart options based on current shadcn theme
 */
export function useChartTheme(): DeepPartial<ChartOptions> {
  // Initialize with a default theme to avoid null on first render
  const getInitialOptions = (): DeepPartial<ChartOptions> => {
    if (typeof window === 'undefined') {
      // SSR fallback - return light theme
      return createChartOptionsForTheme(false);
    }
    // Client-side - check current theme
    const isDark = document.documentElement.classList.contains('dark');
    return createChartOptionsForTheme(isDark);
  };

  const [chartOptions, setChartOptions] = useState<DeepPartial<ChartOptions>>(getInitialOptions);

  useEffect(() => {
    const updateChartOptions = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setChartOptions(createChartOptionsForTheme(isDark));
    };

    // Set initial options
    updateChartOptions();

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      updateChartOptions();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return chartOptions;
}

/**
 * Get candlestick series options based on current theme
 */
export function getCandlestickOptions() {
  const isDark = document.documentElement.classList.contains('dark');
  
  return {
    upColor: isDark ? '#22c55e' : '#16a34a',
    downColor: isDark ? '#ef4444' : '#dc2626',
    borderUpColor: isDark ? '#22c55e' : '#16a34a',
    borderDownColor: isDark ? '#ef4444' : '#dc2626',
    wickUpColor: isDark ? '#22c55e' : '#16a34a',
    wickDownColor: isDark ? '#ef4444' : '#dc2626',
  };
}