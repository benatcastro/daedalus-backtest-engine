import React, { forwardRef, useLayoutEffect, useImperativeHandle, useRef, useContext } from 'react';
import {
  ISeriesApi,
  CandlestickSeries as LWCCandlestickSeries,
  LineSeries as LWCLineSeries,
  AreaSeries as LWCAreaSeries,
  CandlestickData,
  LineData,
  AreaData,
  DeepPartial,
  CandlestickSeriesPartialOptions,
  LineSeriesPartialOptions,
  AreaSeriesPartialOptions
} from 'lightweight-charts';
import { ChartContext } from './chart';

// Type definitions for your trading data
type SeriesType = 'candlestick' | 'line' | 'area';

type SeriesData<T extends SeriesType> =
  T extends 'candlestick' ? CandlestickData[] :
  T extends 'line' ? LineData[] :
  T extends 'area' ? AreaData[] : never;

type SeriesOptions<T extends SeriesType> =
  T extends 'candlestick' ? DeepPartial<CandlestickSeriesPartialOptions> :
  T extends 'line' ? DeepPartial<LineSeriesPartialOptions> :
  T extends 'area' ? DeepPartial<AreaSeriesPartialOptions> : never;

interface SeriesProps<T extends SeriesType> {
  type: T;
  data: SeriesData<T>;
  options?: SeriesOptions<T>;
  children?: React.ReactNode;
}

const SeriesContext = React.createContext<{
  api(): ISeriesApi<any>;
  free(): void;
} | null>(null);



export const Series = forwardRef<ISeriesApi<any>, SeriesProps<any>>((props, ref) => {
  const parent = useContext(ChartContext); // Get the chart context from parent ChartContainer

 // Each series manages its own API reference
  const context = useRef({
    _api: null as ISeriesApi<any> | null,

    // Lazy initialization - creates series only when needed
    api() {
      if (!this._api && parent) {
        const { children, data, type, options = {}, ...rest } = props;

        // Create the appropriate series type for your trading visualization
        switch (type) {
          case 'candlestick':
            this._api = parent.api().addSeries(LWCCandlestickSeries, { ...options, ...rest });
            break;
          case 'line':
            this._api = parent.api().addSeries(LWCLineSeries, { ...options, ...rest });
            break;
          case 'area':
            this._api = parent.api().addSeries(LWCAreaSeries, { ...options, ...rest });
            break;
          default:
            throw new Error(`Unsupported series type: ${type} for Daedalus trading visualization`);
        }

        // Load the backtest data into the series
        this._api.setData(data);

        console.log(`${type} series created for trading analysis`);
      }
      return this._api;
    },

    // Cleanup function - removes series from chart
    free() {
      if (!parent) {
        console.warn("Cant free because parent is null")
        return
      }
      // Check if parent chart was removed already (prevents errors)
      if (this._api && !parent.isRemoved) {
        // Remove only this specific series from the chart
        parent.free(this._api);
        this._api = null;
        console.log(`${props.type} series removed from trading chart`);
      }
    },
  });

  // Effect 1: Initialize series when component mounts
  useLayoutEffect(() => {
    const currentRef = context.current;
    currentRef.api(); // Create the series

    // Cleanup when component unmounts
    return () => currentRef.free();
  }, []); // Empty dependency - runs once on mount


  // Effect 2: Update series options when props change
  useLayoutEffect(() => {
    const currentRef = context.current;
    const { children, data, options = {}, ...rest } = props;

    if (currentRef._api) {
      // Apply new options to existing series (for theme changes, style updates)
      currentRef._api.applyOptions({ ...options, ...rest });

      // Update data if it changed (for real-time backtest updates)
      currentRef._api.setData(data);
    }
  }, [props]); // Runs when any prop changes

  // Expose series API to parent components (for advanced control)
  useImperativeHandle(ref, () => context.current.api(), []);


  // Provide series context to children (for indicators, overlays)
  return (
    <SeriesContext.Provider value={context.current}>
      {props.children}
    </SeriesContext.Provider>
  );
})
