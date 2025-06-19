import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  createChart,
  DeepPartial,
  LineSeriesOptions,
  CandlestickSeries,
  Time,
} from "lightweight-charts";

interface CandlestickChartProps {
  data: {
    time: Time;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
}

const BacktestHistoricalChart: React.FC<CandlestickChartProps> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme(); // Optional: Get current theme (light/dark)

  useEffect(() => {
    // Define the ShadCN theme colors
    const colors =
      theme === "dark"
        ? {
            crosshairColor: "#D1D5DB", // Light gray for crosshair in dark theme
            gridLineColor: "#1F2937", // Darker grid lines for dark theme
            gridHorzLineColor: "#374151", // Darker horizontal grid lines for dark theme
            backgroundColor: "#111827", // Dark background for dark theme
          }
        : {
            crosshairColor: "#4B5563", // Dark gray for crosshair in light theme
            gridLineColor: "#E5E7EB", // Light gray grid lines for light theme
            gridHorzLineColor: "#F3F4F6", // Lighter horizontal grid lines for light theme
            backgroundColor: "#FFFFFF", // White background for light theme
          };
    console.log(`Theme: ${theme}`);

    // Initialize the chart
    const chart = createChart(chartContainerRef.current!, {
      width: chartContainerRef.current?.clientWidth,
      height: chartContainerRef.current?.clientHeight,
      layout: {
        background: { color: "#000000" }, // Set the background color
      },
      crosshair: {
        vertLine: {
          color: colors.crosshairColor,
        },
        horzLine: {
          color: colors.crosshairColor,
        },
      },
      grid: {
        vertLines: {
          color: colors.gridLineColor,
        },
        horzLines: {
          color: colors.gridHorzLineColor,
        },
      },
    });
    chart.addSeries(CandlestickSeries, {}).setData(data);

    return () => chart.remove();
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default BacktestHistoricalChart;
