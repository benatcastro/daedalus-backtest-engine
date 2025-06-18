import { useCallback, useState, createContext, ReactNode } from "react";
import { ChartContainer } from "./chart-container";
import { IChartApi, ISeriesApi, DeepPartial, ChartOptions, IRange, Time } from "lightweight-charts";
import { DataFeed } from "@/lib/data-feed";

export interface ChartApiRef {
  isRemoved: boolean;
  _api?: IChartApi;
  _dataFeeds: DataFeed<any>[]
  _lastNotLoadingViewRange: IRange<Time> | null;
  api(): IChartApi;
  free(series?: ISeriesApi<any>): void;
  addDataFeed(dataFeed: DataFeed<any>): void;
  removeDataFeed(dataFeed: DataFeed<any>): void;
  timeRangeChangeEventHandler(timeRange: IRange<Time> | null): void
}

interface ChartProps extends DeepPartial<ChartOptions> {
  children?: ReactNode;
  width?: number;
  height?: number;
}

export const ChartContext = createContext<ChartApiRef | null>(null);

export default function Chart(props: ChartProps) {
  const { children, ...chartOptions } = props;

  // Stores state of the container ref
  const [container, setContainer] = useState<HTMLElement | null>(null);

  // Function used to store the ref and update the state
  const handleRef = useCallback((ref: HTMLElement | null) => setContainer(ref), []);

  return (
      <div ref={handleRef} style={{ width: '100%', height: props.height || 400 }}>
          {container && (
            <ChartContainer {...chartOptions} container={container}>
              {children}
            </ChartContainer>
          )}
      </div>
  );
}
