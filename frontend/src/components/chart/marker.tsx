import { forwardRef, useContext, useEffect, useRef } from "react";
import { SeriesContext } from "@/components/chart/series";
import {
    createSeriesMarkers,
    IRange,
    ISeriesMarkersPluginApi,
    SeriesMarker,
    Time,
} from "lightweight-charts";
import { DataFeed } from "@/lib/data-feed";
import { useChartContext } from "@/hooks/useChartContext";
import { useSeriesContext } from "@/hooks/useSeriesContext";
import { timeToTimestamp } from "@/lib/time-utils";

export interface MarkerHandle {}

interface MarkerProps {
    dataFeed?: DataFeed<SeriesMarker<Time>>;
    type: "order";
}

export const Marker = forwardRef<MarkerHandle, MarkerProps>(({ dataFeed }, ref) => {
    const seriesContext = useSeriesContext();
    const chartContext = useChartContext();
    const markersRef = useRef<ISeriesMarkersPluginApi<Time>>(null);

    useEffect(() => {
        const series = seriesContext.api();
        if (!series) return;

        console.log("Marker: Creating ");
        markersRef.current = createSeriesMarkers(series);

        console.log("Marker Cleanup");
        return () => {
            markersRef.current?.detach();
            markersRef.current = null;
        };
    }, [seriesContext._api]);

    useEffect(() => {
        if (!markersRef.current || !dataFeed) return;
        if (!chartContext.initialRange) {
            throw Error("datafeeds needs a initial range");
        }

        console.log("Marker: Adding marker datafeed");
        chartContext.addDataFeed({
            dataFeed: dataFeed,
            onNewViewRangeCallback: async (viewRange: IRange<Time>) => {
                // check backwards
                const firstMarkerTime = timeToTimestamp(dataFeed.data[0].time);
                console.log("Marker: view: ", viewRange, " firstMarker: ", firstMarkerTime);
                const diff = timeToTimestamp(viewRange.from) - firstMarkerTime;
                if (diff < 5000) {
                    await dataFeed.loadChunkBackward();
                }
            },
        });
        dataFeed.subscribeToRangeUpdates(() => {
            if (markersRef.current) {
                console.log("Marker: initializing: ", dataFeed.data);
                markersRef.current.setMarkers(dataFeed.data);
            }
        });

        if (!dataFeed.isLoading) {
            dataFeed.setRange(chartContext.initialRange);
        }

        dataFeed.subscribeToDataUpdates((markers) => {
            if (markersRef.current && markers) {
                console.log("Marker: Updating: ", markers);
                markersRef.current.setMarkers(markers);
            }
        });
        return () => {
            console.log("Marker Datafeed Cleanup");
            if (dataFeed) {
                chartContext.removeDataFeed(dataFeed);
            }
        };
    }, [dataFeed]);

    return null;
});
