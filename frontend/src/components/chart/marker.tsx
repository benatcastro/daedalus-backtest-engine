import { forwardRef, useContext, useEffect } from "react"
import { SeriesContext } from "@/components/chart/series"
import { DataFeed, TimeBasedData } from "@/lib/data-feed"
import { createSeriesMarkers, SeriesMarker, Time,  } from "lightweight-charts"
import { ChartContext } from "./chart"
import { useChartContext } from "@/hooks/useChartContext"
import { useSeriesContext } from "@/hooks/useSeriesContext"

export interface MarkerHandle {

}

interface MarkerProps {
    markers?: any[]
    dataFeed?: DataFeed<SeriesMarker<Time>>
    type: "order"
}

export const Marker = forwardRef<MarkerHandle, MarkerProps>(({markers, dataFeed}, ref) => {
    const seriesContext = useSeriesContext()
    const chartContext = useChartContext()

    useEffect(() => {
        console.log("Creating marker")
        if (dataFeed) {
            console.log("Adding marker datafeed")
            chartContext.addDataFeed(dataFeed)
            if (seriesContext.api()) {
                console.log("Initial Markers: ", dataFeed.data.data)
                createSeriesMarkers(seriesContext.api(), dataFeed.data.data)
            }
            dataFeed.subscribeToDataUpdates((markers) => {
                if (seriesContext.api() && markers) {
                    console.log("Markers: ", markers)
                    createSeriesMarkers(seriesContext.api(), markers)
                }
            })
        }
        return () => {
            console.log("Marker Cleanup")
            if (dataFeed) {
                chartContext.removeDataFeed(dataFeed)
                dataFeed.unsubscribeToDataUpdates()
            }
        }

    }, [dataFeed])


    const series = seriesContext.api()


    return null
})
