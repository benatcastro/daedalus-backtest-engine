import { IChartApi, DeepPartial, LayoutOptions, createChart, ISeriesApi } from "lightweight-charts";
import { forwardRef, ReactNode, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { ChartContext } from "./chart-context";

interface ChartContainerProps {
  container: HTMLElement
  children?: ReactNode;
  layout?: DeepPartial<LayoutOptions>;
  width?: number;
  height?: number;
}

interface ChartApiRef {
  isRemoved: boolean;
  _api?: IChartApi;
  api(): IChartApi;
  free(series?: ISeriesApi<any>): void;
}


export const ChartContainer = forwardRef<IChartApi, ChartContainerProps>((props, ref) => {
  const { children, container, layout, width, height = 300, ...rest } = props;

  // Chart API management for algorithmic trading backtest visualization
  const chartApiRef = useRef<ChartApiRef>({
    isRemoved: false,

    // Lazy-load chart instance for optimal performance with large backtest datasets
    api(): IChartApi {
      if (!this._api) {
        this._api = createChart(container, {
          ...rest,
          layout,
          width: width,
          height: height,
        });
        console.log(container.clientWidth, container.clientHeight, width, height)
        console.log("Chart created in chart container")
      }
      return this._api;
    },

    // Cleanup method for series removal (important for memory management with large datasets)
    free(series?: ISeriesApi<any>): void {
      if (this._api && series) {
        this._api.removeSeries(series);
      }
    },
  });

  // Add resize listener for responsive trading interface
  useLayoutEffect(() => {
    const currentRef = chartApiRef.current;
    const chart = currentRef.api();

    const handleResize = () => {
        chart.applyOptions({
            ...rest,
            width: container.clientWidth,
        });
    };

    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        chartApiRef.current.isRemoved = true;
        chart.remove();
    };
  }, []);

  // Initialize chart on mount
  useLayoutEffect(() => {
    const currentRef = chartApiRef.current;
    currentRef.api();
  }, []);


  // Apply chart options updates (excluding layout to prevent recreation)
  useLayoutEffect(() => {
      const currentRef = chartApiRef.current;
      currentRef.api().applyOptions(rest);
  }, []);

    // Expose chart API to parent components for advanced backtest analysis control
  useImperativeHandle(ref, () => chartApiRef.current.api(), []);

  // Handle layout updates separately to prevent chart recreation
  useEffect(() => {
        const currentRef = chartApiRef.current;
        currentRef.api().applyOptions({ layout });
    }, [layout]);


    return (
      <ChartContext.Provider value={chartApiRef.current}>
          {props.children}
      </ChartContext.Provider>
    );
})
