"use client";
import { useCallback, useState, createContext, ReactNode } from "react";
import { ChartContainer } from "./chart-container";
import { DeepPartial, ChartOptions, IRange, Time } from "lightweight-charts";
import { dateRangeToTimeRange } from "@/lib/time-utils";

interface ChartProps extends DeepPartial<ChartOptions> {
    children?: ReactNode;
    width?: number;
    height?: number;
    initialDates?: IRange<Date>;
}

export default function Chart(props: ChartProps) {
    const { children, initialDates, ...chartOptions } = props;

    // Stores state of the container ref
    const [container, setContainer] = useState<HTMLElement | null>(null);
    const initialRange: IRange<Time> | null = initialDates
        ? dateRangeToTimeRange(initialDates)
        : null;
    // Function used to store the ref and update the state
    const handleRef = useCallback((ref: HTMLElement | null) => setContainer(ref), []);

    return (
        <div
            ref={handleRef}
            style={{
                width: "100%",
                height: "100%",
            }}
        >
            {container && (
                <ChartContainer {...chartOptions} container={container} initialRange={initialRange}>
                    {children}
                </ChartContainer>
            )}
        </div>
    );
}
