import {
  IChartApi,
  DeepPartial,
  LayoutOptions,
  createChart,
  ISeriesApi,
  ChartOptions,
  TimeRangeChangeEventHandler,
  IRange,
  Time,
} from "lightweight-charts";
import {
  createContext,
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { Mutex } from "async-mutex";
import { DataFeed as DataFeed } from "@/lib/data-feed";

interface ChartContainerProps extends DeepPartial<ChartOptions> {
  container: HTMLElement;
  children?: ReactNode;
  readonly initialRange: IRange<Time> | null
  width?: number;
  height?: number;
  startTime?: Time;
  endTime?: Time;
}

export interface ChartApiRef {
  isRemoved: boolean;
  _api?: IChartApi;
  _lastNotLoadingViewRange: IRange<Time> | null;
  readonly initialRange: IRange<Time> | null
  setMainDataFeed: (dataFeed: DataFeed<any>) => void;
  api(): IChartApi;
  free(series?: ISeriesApi<any>): void;
  addDataFeed(dataFeed: DataFeed<any>): void;
  removeDataFeed(dataFeed: DataFeed<any>): void;
}

export const ChartContext = createContext<ChartApiRef | null>(null);


export const ChartContainer = forwardRef<IChartApi, ChartContainerProps>(
  (props, ref) => {
    const mainDataFeedRef = useRef<DataFeed<any>>(null)
    const dataFeedsRef = useRef<DataFeed<any>[]>([])
    const newViewEventRef = useRef<() => void>(null)
    const datafeedLoadingMutex = useRef<Mutex>(new Mutex())
    const { children, container, width, height = 300, initialRange, ...chartOptions } = props;
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
      _lastNotLoadingViewRange: null,
      initialRange: initialRange,


      setMainDataFeed(dataFeed: DataFeed<any>): void {
          console.log("ChartContainer: Main Data Feed set", dataFeed)
          mainDataFeedRef.current = dataFeed
      },

      // Lazy-load chart instance for optimal performance with large backtest datasets
      api(): IChartApi {
        if (!this._api || this.isRemoved) {
          console.log("Merged chart options:", mergedOptions);
          this._api = createChart(container, {
            ...mergedOptions,
            width: container.clientWidth,
            height: container.clientHeight,
          });
          console.log("Chart created with dimensions:", width, height);
          this.isRemoved = false;
        }
        return this._api;
      },

      // Cleanup method for series removal (important for memory management with large datasets)
      free(series?: ISeriesApi<any>): void {
        if (this._api && series && !this.isRemoved) {
          try {
            console.warn("Removing Series: ", series);
            this._api.removeSeries(series);
          } catch (error) {
            console.warn(
              "ChartContainer: Failed to remove series - it may have already been removed:",
              error,
            );
          }
        } else if (!series) {
          console.warn("ChartContainer: Cannot remove series: series is undefined or null");
        }
      },

      addDataFeed(dataFeed: DataFeed<any>) {
        dataFeedsRef.current.push(dataFeed);
        console.log(
          "ChartContainer: Added new datafeed to the list, currently updating %d",
          dataFeedsRef.current.length,
        );
        console.log("ChartContainer: DataFeeds: ", dataFeedsRef.current.length);
      },

      removeDataFeed(dataFeed: DataFeed<any>) {
        // Find and remove the DataFeed from the array
        const index = dataFeedsRef.current.indexOf(dataFeed);
        if (index > -1) {
          dataFeedsRef.current.splice(index, 1);
          console.log(
            "Removed datafeed from the list, currently have %d",
            dataFeedsRef.current.length,
          );

          // If no more DataFeeds, unsubscribe from time range events
          if (dataFeedsRef.current.length === 0 && newViewEventRef.current) {
            const chart = chartApiRef.current.api();
            /*
            chart
              .timeScale()
              .unsubscribeVisibleTimeRangeChange(
                newViewEventRef.current,
              );
            */
            console.log(
              "No more DataFeeds, unsubscribed from time range events",
            );
          }
        } else {
          console.warn("DataFeed not found in the list for removal");
        }
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

      let isUpdating = false;

      chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange: IRange<number> | null) => {
        if (!logicalRange || !mainDataFeedRef.current || datafeedLoadingMutex.current.isLocked() || mainDataFeedRef.current.isLoading || isUpdating) return

        console.log("ChartContainer: ", logicalRange, " DataFeedRef: ", mainDataFeedRef.current)

        isUpdating = true
        datafeedLoadingMutex.current.acquire().then(async () => {
          try {
            if (logicalRange.from < 2000) {
                await mainDataFeedRef.current?.loadChunkBackward()
            }
          } finally {
            isUpdating = false
            datafeedLoadingMutex.current.release()
          }
        })

      })
      window.addEventListener("resize", handleResize);

      return () => {
        // Remove on resize event
        window.removeEventListener("resize", handleResize);

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

    // Apply chart options updates when mergedOptions change
    useLayoutEffect(() => {
      const currentRef = chartApiRef.current;
      if (currentRef._api) {
        currentRef.api().applyOptions(mergedOptions);
      }
    }, [mergedOptions]);

    useEffect(() => {
      if (dataFeedsRef.current.length === 0 || !mainDataFeedRef.current) return
      // First datafeed pushed into chart

      if (newViewEventRef.current === null) {
        newViewEventRef.current = () => {
        /*
        if (!timeRange || !this._dataFeeds) return;


        if (!mainDataFeedRef.current.isLoading) {
          this._lastNotLoadingViewRange = timeRange;
        }

        if (mainDataFeedRef.current && this._lastNotLoadingViewRange) {
          this.api()
            .timeScale()
            .setVisibleRange(this._lastNotLoadingViewRange);
        }
        // Obtain the real change in the chart
        this._dataFeeds.forEach((dataFeed) => {
          // Dont let the chart update the view range while the datafeed is loading

          // Update the datafeeds timerange
          if (!dataFeed.isLoading) {
            dataFeed.updateDataRange(timeRange);
          }
        });
        */
        }
      }
    }, [dataFeedsRef.current.length, mainDataFeedRef.current])

    // Expose chart API to parent components for advanced backtest analysis control
    useImperativeHandle(ref, () => chartApiRef.current.api(), []);

    return (
      <ChartContext.Provider value={chartApiRef.current}>
        {props.children}
      </ChartContext.Provider>
    );
  },
);
