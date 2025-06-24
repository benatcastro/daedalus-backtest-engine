import { useContext } from 'react';
import { ChartContext } from '@/components/chart/chart-container';

/**
 * Custom hook to access chart context functionality
 *
 * @returns The chart context containing chart instance and methods
 * @throws Error when used outside of a ChartContext provider
 */
export function useChartContext() {
  const context = useContext(ChartContext);

  if (context === undefined || context === null) {
    throw new Error('useChart must be used within a Chart component');
  }

  return context;
}
