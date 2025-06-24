'use client'
import { useCallback, useState, createContext, ReactNode } from "react";
import { ChartContainer } from "./chart-container";
import {
  IChartApi,
  ISeriesApi,
  DeepPartial,
  ChartOptions,
  IRange,
  Time,
} from "lightweight-charts";
import { TimeRangeDataFeed } from "@/lib/data-feed";
import { DateRange } from "@/utils/sample-data-generator";



interface ChartProps extends DeepPartial<ChartOptions> {
  children?: ReactNode;
  width?: number;
  height?: number;
  initialDates?: DateRange
}


export default function Chart(props: ChartProps) {
  const { children, initialDates, ...chartOptions } = props;

  // Stores state of the container ref
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const initialRange: IRange<Time> | null = initialDates ? {
      from: initialDates.start.getTime() / 1000 as Time,
      to: initialDates.end.getTime() / 1000 as Time
    } : null
  // Function used to store the ref and update the state
  const handleRef = useCallback(
    (ref: HTMLElement | null) => setContainer(ref),
    [],
  );

  return (
    <div
      ref={handleRef}
      style={{
        width: props.width || "100%",
        height: "100%",
      }}
    >
      {container && (
        <ChartContainer
          {...chartOptions}
          container={container}
          initialRange={initialRange}
        >
          {children}
        </ChartContainer>
      )}
    </div>
  );
}
