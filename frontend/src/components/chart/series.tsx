import React, { forwardRef, useLayoutEffect, useImperativeHandle, useRef, useEffect } from "react";
import {
    ISeriesApi,
    CandlestickData,
    LineData,
    AreaData,
    DeepPartial,
    CandlestickSeriesPartialOptions,
    LineSeriesPartialOptions,
    AreaSeriesPartialOptions,
    CandlestickSeries,
    LineSeries,
    AreaSeries,
    Time,
    WhitespaceData,
} from "lightweight-charts";
import { DataFeed as DataFeed } from "@/lib/data-feed";
import { useChartContext } from "@/hooks/useChartContext";

// Type definitions for your trading data
type SeriesType = "candlestick" | "line" | "area";

type SeriesData = any[];

type SeriesOptions<T extends SeriesType> = T extends "candlestick"
    ? DeepPartial<CandlestickSeriesPartialOptions>
    : T extends "line"
      ? DeepPartial<LineSeriesPartialOptions>
      : T extends "area"
        ? DeepPartial<AreaSeriesPartialOptions>
        : never;
interface ISeriesContext {
    _api: ISeriesApi<any>;
    api(): ISeriesApi<any>;
    free(): void;
}
interface SeriesProps<T extends SeriesType> {
    type: T;
    data?: SeriesData;
    options?: SeriesOptions<T>;
    children?: React.ReactNode;
    dataFeed?: DataFeed<any>;
    main?: boolean;
}

export const SeriesContext = React.createContext<ISeriesContext | null>(null);

export const Series = forwardRef<ISeriesApi<any>, SeriesProps<any>>((props, ref) => {
    const parent = useChartContext(); // Get the chart context from parent ChartContainer
    const dataFeedRef = useRef<DataFeed<any>>(null);
    const { children, data, type, dataFeed, main, options = {}, ...rest } = props;

    if (dataFeed && !parent.initialRange) {
    }

    // Each series manages its own API reference
    const context = useRef({
        _api: null as ISeriesApi<any> | null,
        _dataFeed: null as DataFeed<any> | null,

        // Lazy initialization - creates series only when needed
        api() {
            if (!this._api && parent) {
                console.log("Series: Creating Serie");
                // Create the appropriate series type for your trading visualization
                switch (type) {
                    case "candlestick":
                        this._api = parent
                            .api()
                            .addSeries(CandlestickSeries, { ...options, ...rest });
                        break;
                    case "line":
                        this._api = parent.api().addSeries(LineSeries, { ...options, ...rest });
                        break;
                    case "area":
                        this._api = parent.api().addSeries(AreaSeries, { ...options, ...rest });

                        break;
                    default:
                        throw new Error(`Unsupported series type: ${type}`);
                }

                // Load the backtest data into the series
                if (data) {
                    this._api.setData(data);
                }

                console.log(`Series: ${type} series created`);
            }
            return this._api;
        },

        // Cleanup function - removes series from chart
        free() {
            if (!parent) {
                return;
            }
            // Check if parent chart was removed already (prevents errors)
            if (this._api) {
                // Check that the chart has not been removed before deleting the series from the chart
                if (!parent.isRemoved) {
                    parent.free(this._api);
                }
                this._api = null;
                console.log(`Serie: ${props.type} series removed from trading chart`);
            }
        },
    });

    // Effect 1: Initialize series when component mounts
    useLayoutEffect(() => {
        const currentRef = context.current;
        currentRef.api(); // Create the series

        // Cleanup when component unmounts
        return () => {
            currentRef.free();
        };
    }, []); // Empty dependency - runs once on mount

    useEffect(() => {
        if (!dataFeed) return;
        if (!parent.initialRange) {
            throw Error("datafeed requieres an initial view range");
        }

        const series = context.current.api();
        const chart = parent.api();

        // Add datafeed to chart component
        dataFeedRef.current = dataFeed;
        parent.addDataFeed({
            dataFeed: dataFeed,
            onNewLogicalRangeCallback: async (logicalRange) => {
                if (logicalRange.from < 2000) {
                    await dataFeed.loadChunkBackward();
                }
            },
        });
        if (main === true) {
            //parent.setMainDataFeed(dataFeed);
        }

        // Initialize datafeed data
        if (!dataFeedRef.current.isLoading) {
            dataFeedRef.current.setRange(parent.initialRange);
        }
        dataFeed.subscribeToRangeUpdates(() => {
            if (series && chart && parent.initialRange) {
                series.setData(dataFeed.data);
                if (main === true) {
                    chart.timeScale().setVisibleRange(parent.initialRange);
                }
            }
        });

        dataFeed.subscribeToDataUpdates((data) => {
            if (series) {
                console.log("Series: Set data");
                series.setData(data);
            }
        });

        return () => {
            parent.removeDataFeed(dataFeed);
            dataFeed.free();
        };
    }, [dataFeed]);

    // Effect 2: Update series options when props change
    useLayoutEffect(() => {
        const currentRef = context.current;
        const { children, data, options = {}, ...rest } = props;

        if (currentRef._api) {
            // Apply new options to existing series (for theme changes, style updates)
            currentRef._api.applyOptions({ ...options, ...rest });

            // Update data if it changed (for real-time backtest updates)
            if (data) {
                currentRef._api.setData(data);
            }
        }
    }, [props]); // Runs when any prop changes

    // Expose series API to parent components (for advanced control)
    useImperativeHandle(ref, () => context.current.api(), []);

    // Provide series context to children (for indicators, overlays)
    return (
        <SeriesContext.Provider value={context.current}>{props.children}</SeriesContext.Provider>
    );
});
