import { IChartApi, DeepPartial, LayoutOptions, createChart, ISeriesApi, ChartOptions, TimeRangeChangeEventHandler, IRange, Time } from "lightweight-charts";
import { forwardRef, ReactNode, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { ChartContext, ChartApiRef } from "./chart";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { DataFeed } from "@/lib/data-feed";

interface ChartContainerProps extends DeepPartial<ChartOptions> {
  container: HTMLElement
  children?: ReactNode;
  width?: number;
  height?: number;
}

/*
interface ChartApiRef {
  isRemoved: boolean;
  _api?: IChartApi;
  _dataFeeds: DataFeed<any>[]
  _lastNotLoadingViewRange: IRange<Time> | null;
  api(): IChartApi;
  free(series?: ISeriesApi<any>): void;
  addDataFeed(dataFeed: DataFeed<any>): void;
  timeRangeChangeEventHandler(timeRange: IRange<Time> | null): void
}
*/


export const ChartContainer = forwardRef<IChartApi, ChartContainerProps>((props, ref) => {
  const { children, container, width, height = 300, ...chartOptions } = props;
  const defaultTheme = useChartTheme();

  // Merge default theme with user-provided overrides
  const mergedOptions: DeepPartial<ChartOptions> = {
    ...defaultTheme,
    ...chartOptions,
    // Deep merge layout options specifically to allow partial overrides
    layout: {
      ...defaultTheme.layout,
      ...chartOptions.layout,
    },
    // Deep merge grid options
    grid: {
      ...defaultTheme.grid,
      ...chartOptions.grid,
      vertLines: {
        ...defaultTheme.grid?.vertLines,
        ...chartOptions.grid?.vertLines,
      },
      horzLines: {
        ...defaultTheme.grid?.horzLines,
        ...chartOptions.grid?.horzLines,
      },
    },
    // Deep merge crosshair options
    crosshair: {
      ...defaultTheme.crosshair,
      ...chartOptions.crosshair,
      vertLine: {
        ...defaultTheme.crosshair?.vertLine,
        ...chartOptions.crosshair?.vertLine,
      },
      horzLine: {
        ...defaultTheme.crosshair?.horzLine,
        ...chartOptions.crosshair?.horzLine,
      },
    },
    // Deep merge time scale options
    timeScale: {
      ...defaultTheme.timeScale,
      ...chartOptions.timeScale,
    },
    // Deep merge price scale options
    rightPriceScale: {
      ...defaultTheme.rightPriceScale,
      ...chartOptions.rightPriceScale,
    },
    leftPriceScale: {
      ...defaultTheme.leftPriceScale,
      ...chartOptions.leftPriceScale,
    },
  };

  // Chart API management for algorithmic trading backtest visualization
  const chartApiRef = useRef<ChartApiRef>({
    isRemoved: false,
    _dataFeeds: [],
    _lastNotLoadingViewRange: null,

    // Lazy-load chart instance for optimal performance with large backtest datasets
    api(): IChartApi {
      if (!this._api || this.isRemoved) {
        console.log("Merged chart options:", mergedOptions);
        this._api = createChart(container, {
          ...mergedOptions,
          width: width || container.clientWidth,
          height: height,
        });
        console.log("Chart created with dimensions:", width, height);
        this.isRemoved = false;
      }
      return this._api;
    },

    // Cleanup method for series removal (important for memory management with large datasets)
    free(series?: ISeriesApi<any>): void {
      if (this._api && series) {
        console.warn("Removing Series: ", series)
        this._api.removeSeries(series);
      }
    },

    addDataFeed(dataFeed: DataFeed<any>) {
      chartApiRef.current._dataFeeds.push(dataFeed)
      console.log("Added new datafeed to the list, currently updating %d", this._dataFeeds.length)
      console.log("DataFeeds: ", chartApiRef.current._dataFeeds)
    },

    removeDataFeed(dataFeed: DataFeed<any>) {
      // Find and remove the DataFeed from the array
      const index = chartApiRef.current._dataFeeds.indexOf(dataFeed);
      if (index > -1) {
        chartApiRef.current._dataFeeds.splice(index, 1);
        console.log("Removed datafeed from the list, currently have %d", chartApiRef.current._dataFeeds.length);
        console.log("DataFeeds: ", chartApiRef.current._dataFeeds);

        // If no more DataFeeds, unsubscribe from time range events
        if (chartApiRef.current._dataFeeds.length === 0) {
          const chart = chartApiRef.current.api();
          chart.timeScale().unsubscribeVisibleTimeRangeChange(chartApiRef.current.timeRangeChangeEventHandler);
          console.log("No more DataFeeds, unsubscribed from time range events");
        }
      } else {
        console.warn("DataFeed not found in the list for removal");
      }
    },

    timeRangeChangeEventHandler(timeRange) {

      if (!timeRange || !this._dataFeeds) return

      // Obtain the real change in the chart
      this._dataFeeds.forEach((dataFeed) => {
        // Dont let the chart update the view range while the datafeed is loading
        if (!dataFeed.isLoading) {
          this._lastNotLoadingViewRange = timeRange
        }

        if (dataFeed.isLoading && this._lastNotLoadingViewRange) {
          this.api().timeScale().setVisibleRange(this._lastNotLoadingViewRange)

        }

        // Update the datafeeds timerange
        if (!dataFeed.isLoading) {
          dataFeed.updateDataRange(timeRange)
        }
      })
    },
  });

  // Add resize listener and datafeed listener
  useLayoutEffect(() => {
    const currentRef = chartApiRef.current;
    const chart = currentRef.api();

    // Add resize handler
    const handleResize = () => {
        chart.applyOptions({
            width: container.clientWidth,
        });
    };

    window.addEventListener('resize', handleResize);

    // Add time range event change handler
    chart.timeScale().subscribeVisibleTimeRangeChange(currentRef.timeRangeChangeEventHandler)
    return () => {


      // Remove on resize event
      window.removeEventListener('resize', handleResize);

      // Remove the time event listener
      chartApiRef.current.api().timeScale().unsubscribeVisibleTimeRangeChange(chartApiRef.current.timeRangeChangeEventHandler)

      // Remove the chart
      chartApiRef.current.isRemoved = true;
      chart.remove();
    };
  }, [container]);

  // Initialize chart on mount
  useLayoutEffect(() => {
    const currentRef = chartApiRef.current;
    currentRef.api();
  }, []);

  // Update the event handler when a new dataFeed is added
  useEffect(()=> {
    console.log("DataFeeds: ", chartApiRef.current._dataFeeds)
    if (chartApiRef.current._dataFeeds.length) {
      // Remove the previous one
      const chart = chartApiRef.current.api()
      chart.timeScale().unsubscribeVisibleTimeRangeChange(chartApiRef.current.timeRangeChangeEventHandler)
      const eventHandler = (timeRange: IRange<Time> | null) => {
        if (!timeRange || !chartApiRef.current._dataFeeds) return

              // Obtain the real change in the chart
              chartApiRef.current._dataFeeds.forEach((dataFeed) => {
                console.log("Updating data Feeds")
                // Dont let the chart update the view range while the datafeed is loading
                if (!dataFeed.isLoading) {
                  chartApiRef.current._lastNotLoadingViewRange = timeRange
                }

                if (dataFeed.isLoading && chartApiRef.current._lastNotLoadingViewRange) {
                  chartApiRef.current.api().timeScale().setVisibleRange(chartApiRef.current._lastNotLoadingViewRange)

                }

                // Update the datafeeds timerange
                if (!dataFeed.isLoading) {
                  dataFeed.updateDataRange(timeRange)
                }
              })
            }
      chartApiRef.current.api().timeScale().subscribeVisibleTimeRangeChange(eventHandler)
    }
  }, [chartApiRef.current._dataFeeds.length])

  // Apply chart options updates when mergedOptions change
  useLayoutEffect(() => {
      const currentRef = chartApiRef.current;
      if (currentRef._api) {
        currentRef.api().applyOptions(mergedOptions);
      }
  }, [mergedOptions]);

  // Expose chart API to parent components for advanced backtest analysis control
  useImperativeHandle(ref, () => chartApiRef.current.api(), []);


    return (
      <ChartContext.Provider value={chartApiRef.current}>
          {props.children}
      </ChartContext.Provider>
    );
})
