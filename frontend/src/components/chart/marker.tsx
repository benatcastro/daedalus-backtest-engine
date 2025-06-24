import { forwardRef, useContext, useEffect } from "react"
import { SeriesContext } from "@/components/chart/series"
import { TimeRangeDataFeed, TimeBasedData } from "@/lib/data-feed"
import { createSeriesMarkers, SeriesMarker, Time,  } from "lightweight-charts"
import { useChartContext } from "@/hooks/useChartContext"
import { useSeriesContext } from "@/hooks/useSeriesContext"

export interface MarkerHandle {

}

interface MarkerProps {
    markers?: any[]
    dataFeed?: TimeRangeDataFeed<SeriesMarker<Time>>
    type: "order"
}

export const Marker = forwardRef<MarkerHandle, MarkerProps>(({markers, dataFeed}, ref) => {
    const seriesContext = useSeriesContext()
    const chartContext = useChartContext()

    const series = seriesContext.api()

    useEffect(() => {
        console.log("Creating marker")
        if (dataFeed) {
            console.log("Adding marker datafeed")
            chartContext.addDataFeed(dataFeed)
            if (series) {
                console.log("Initial Markers: ", dataFeed.data.data)
                createSeriesMarkers(seriesContext.api(), dataFeed.data.data)
            }
            dataFeed.subscribeToDataUpdates((markers) => {
                if (series && markers) {
                    console.log("Markers: ", markers)
                    createSeriesMarkers(series, markers)
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




    return null
})
