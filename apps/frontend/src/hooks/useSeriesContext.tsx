import { useContext } from "react";
import { SeriesContext } from "@/components/chart/series";

/**
 * Custom hook to access chart context functionality
 *
 * @returns The chart context containing chart instance and methods
 * @throws Error when used outside of a ChartContext provider
 */
export function useSeriesContext() {
    const context = useContext(SeriesContext);

    if (context === undefined || context === null) {
        throw new Error("useSeries must be used within a Series component");
    }

    return context;
}
