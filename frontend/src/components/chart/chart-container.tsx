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
    useMemo,
    useRef,
} from "react";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { Mutex } from "async-mutex";
import { DataFeed } from "@/lib/data-feed";
import { TimeBasedData } from "@/types/time-based-data";

interface ChartContainerProps extends DeepPartial<ChartOptions> {
    container: HTMLElement;
    children?: ReactNode;
    readonly initialRange: IRange<Time> | null;
    width?: number;
    height?: number;
    startTime?: Time;
    endTime?: Time;
}

interface DataFeedEntry {
    dataFeed: DataFeed<TimeBasedData>;
    mutex: Mutex;
    onNewViewRangeCallback?: (viewRange: IRange<Time>) => void;
    onNewLogicalRangeCallback?: (logicalRange: IRange<number>) => void;
}

export interface ChartApiRef {
    isRemoved: boolean;
    _api?: IChartApi;
    _lastNotLoadingViewRange: IRange<Time> | null;
    readonly initialRange: IRange<Time> | null;
    api(): IChartApi;
    free(series?: ISeriesApi<any>): void;
    addDataFeed({
        dataFeed,
        onNewViewRangeCallback,
        onNewLogicalRangeCallback,
    }: {
        dataFeed: DataFeed<any>;
        onNewViewRangeCallback?: (viewRange: IRange<Time>) => void;
        onNewLogicalRangeCallback?: (logicalRange: IRange<number>) => Promise<void>;
    }): void;
    removeDataFeed(dataFeed: DataFeed<any>): void;
}

export const ChartContext = createContext<ChartApiRef | null>(null);

export const ChartContainer = forwardRef<IChartApi, ChartContainerProps>((props, ref) => {
    const dataFeedEntriesRef = useRef<DataFeedEntry[]>([]);
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

        addDataFeed({
            dataFeed,
            onNewViewRangeCallback,
            onNewLogicalRangeCallback,
        }: {
            dataFeed: DataFeed<any>;
            onNewViewRangeCallback?: (viewRange: IRange<Time>) => void;
            onNewLogicalRangeCallback?: (logicalRange: IRange<number>) => Promise<void>;
        }) {
            if (!onNewLogicalRangeCallback && !onNewViewRangeCallback) {
                throw Error("There must be atleast 1 callback");
            }
            const mutex = new Mutex();
            dataFeedEntriesRef.current.push({
                dataFeed,
                mutex,
                onNewLogicalRangeCallback,
                onNewViewRangeCallback,
            });
            console.log(
                "ChartContainer: Added new datafeed entry to the list, currently updating %d",
                dataFeedEntriesRef.current.length,
            );
        },

        removeDataFeed(dataFeed: DataFeed<any>) {
            // Find and remove the DataFeed from the array
            const dataFeeds = dataFeedEntriesRef.current;
            dataFeed.free();
            const index = dataFeeds.findIndex((entry) => entry.dataFeed === dataFeed);
            if (index === -1) {
                throw Error("DataFeed not found in the list for removal");
            }
            dataFeeds.splice(index, 1);
            console.log("Removed datafeed from the list, currently have %d", dataFeeds.length);

            console.log("No more DataFeeds, unsubscribed from time range events");
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

        chart
            .timeScale()
            .subscribeVisibleLogicalRangeChange((logicalRange: IRange<number> | null) => {

                if (!logicalRange) {
                    return;
                }
                const dataFeeds = dataFeedEntriesRef.current
                if (!dataFeeds) {
                    return
                }

                console.log(
                    "ChartContainer: ",
                    logicalRange,
                );

                dataFeeds.forEach((entry) => {
                    if (entry.mutex.isLocked()) return
                    if (!entry.onNewLogicalRangeCallback) return
                    entry.mutex.acquire().then(async () => {
                        try {
                            if (entry.onNewLogicalRangeCallback) {
                                await entry.onNewLogicalRangeCallback(logicalRange)
                            }
                        } finally {
                            entry.mutex.release();
                        }
                    });
                })
            });

        chart
            .timeScale()
            .subscribeVisibleTimeRangeChange((timeRange: IRange<Time> | null) => {

                if (!timeRange) {
                    return;
                }
                const dataFeeds = dataFeedEntriesRef.current
                if (!dataFeeds) {
                    return
                }

                dataFeeds.forEach((entry) => {
                    if (entry.mutex.isLocked()) return
                    if (!entry.onNewViewRangeCallback) return
                    entry.mutex.acquire().then(async () => {
                        try {
                            if (entry.onNewViewRangeCallback) {
                                await entry.onNewViewRangeCallback(timeRange)
                            }
                        } finally {
                            entry.mutex.release();
                        }
                    });
                })
            });
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

    // Expose chart API to parent components for advanced backtest analysis control
    useImperativeHandle(ref, () => chartApiRef.current.api(), []);

    return (
        <ChartContext.Provider value={chartApiRef.current}>{props.children}</ChartContext.Provider>
    );
});
