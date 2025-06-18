import { createContext, useContext } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';

interface ChartApiRef {
  isRemoved: boolean;
  _api?: IChartApi;
  api(): IChartApi;
  free(series?: ISeriesApi<any>): void;
}

// Create the context at module level - this is the key fix!
export const ChartContext = createContext<ChartApiRef | null>(null);

// Custom hook to use the chart context with error handling
export function useChart() {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a ChartContainer');
  }
  return context;
}

// Export the context for direct usage if needed
export { ChartContext as Context };
