import { useCallback, useState, createContext } from "react";
import { ChartContainer } from "./chart-container";
import { IChartApi, ISeriesApi } from "lightweight-charts";

export interface ChartApiRef {
  isRemoved: boolean;
  _api?: IChartApi;
  api(): IChartApi;
  free(series?: ISeriesApi<any>): void;
}

interface ChartProps {
}

export const ChartContext = createContext<ChartApiRef | null>(null);

export default function Chart(props: ChartProps) {
  // Stores state of the container ref
  const [container, setContainer] = useState<HTMLElement | null>(null);

  // Function used to store the ref and update the state
  const handleRef = useCallback((ref: HTMLElement | null) => setContainer(ref), []);
  return (
      <div ref={handleRef}>
          {container && <ChartContainer {...props} container={container} />}
      </div>
  );
}
