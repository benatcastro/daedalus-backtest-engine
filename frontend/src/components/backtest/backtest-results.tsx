"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBacktestContext } from "@/contexts/backtest-context";
import { BacktestSerializationError, serializeToLeanBacktest } from "@/lib/backtest-serializer";
import { dateRangeToTimeRange, isoTimeToDateRange } from "@/lib/time-utils";
import Backtest from "@/types/backtest";
import Candle from "@/types/candle";
import LeanBacktest from "@/types/lean/LeanBacktest";
import { Order } from "@/types/order";
import { SeriesMetadata } from "@/types/series";
import { Strategy } from "@prisma/client";
import { ActivitySquare, Receipt } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { Skeleton } from "../ui/skeleton";
import { BacktestSidebarItem } from "./backtest-sidebar";
import BacktestStatsCard from "./backtest-stats-card";
import { EquityChart } from "./equity-chart";
import { ListContainer } from "./list-container";
import { OrderEntry } from "./order-entry";
import { TradeEntry } from "./trade-entry";

interface BacktestResultsProps {
  strategy: Strategy;
  backtest: Backtest;
}

export function BacktestResults({ strategy, backtest }: BacktestResultsProps) {
  const ordersRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const equitySeriesRef = useRef<SeriesMetadata>(null);

  // Serialize the generic backtest to a LeanBacktest type
  const leanBacktest: LeanBacktest | null = useMemo(() => {
    try {
      return serializeToLeanBacktest(backtest);
    } catch (error) {
      if (error instanceof BacktestSerializationError) {
        console.error(`Failed to serialize backtest ${backtest.id}:`, error.message);
        return null;
      }
      throw error;
    }
  }, [backtest]);

  console.log("Lean Bactest: ", leanBacktest);

  leanBacktest?.rollingWindow;
  const bactestDates = useMemo(() => {
    const dateRange = isoTimeToDateRange(backtest.starting_date, backtest.ending_date);
    const timeRange = dateRangeToTimeRange(dateRange);
    return {
      dateRange,
      timeRange,
    };
  }, [backtest]);

  const {
    data: series,
  } = useSWR<SeriesMetadata[]>(`/api/v1/backtest/${backtest.id}/series`);
  const {
    data: orders,
    isLoading: isOrdersLoading,
  } = useSWR<Order[]>(
    bactestDates
      ? `/api/v1/backtest/${backtest.id}/orders/?start=${bactestDates.timeRange.from}&end=${bactestDates.timeRange.to}`
      : null,
  );
  const {
    data: rawEquityData,
  } = useSWR<Candle[]>(
    equitySeriesRef.current
      ? `/api/v1/backtest/${backtest.id}/series/${equitySeriesRef.current.id}/data`
      : null,
  );
  if (series) {
    equitySeriesRef.current =
      series.find((item: SeriesMetadata) => item.name === "Equity") || null;
  }
  // Extract backtest date range
  const equityData: { time: number; value: number }[] | undefined = useMemo(() => {
    if (!rawEquityData) return undefined;
    return rawEquityData.map((entry) => {
      return { time: entry.time, value: entry.open };
    });
  }, [rawEquityData]);

  const closedTrades = leanBacktest?.totalPerformance.closedTrades;

  console.log("ClosedTrades: ", closedTrades);
  console.log("Equity data: ", equityData);
  console.log("Orders:", orders);

  const backtestContext = useBacktestContext();
  const sidebarItems: BacktestSidebarItem[] = useMemo(() => {
    return [
      {
        id: "main",
        name: "Main metrics",
        description: "View main performance metrics",
        icon: <ActivitySquare size={24} />,
        onClick: () => {
          if (mainRef.current) {
            mainRef.current.scrollIntoView({
              behavior: "smooth",
            });
          }
        },
      },
      {
        id: "orders",
        name: "Orders",
        description: "View order history",
        icon: <Receipt size={24} />,
        onClick: () => {
          if (ordersRef.current) {
            ordersRef.current.scrollIntoView({
              behavior: "smooth",
            });
          }
        },
      },
    ];
  }, []);

  useEffect(() => {
    backtestContext.setSidebarItems(sidebarItems);
    return () => {
      backtestContext.setSidebarItems([]);
    };
  }, [sidebarItems]);
  // Show error state if LeanBacktest serialization failed
  const placeholder: string[] = Array(50).fill("hola");
  if (!leanBacktest) {
    return (
      <div className="flex flex-col p-4 gap-4">
        <Card className="w-full border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Backtest Data</CardTitle>
            <CardDescription>
              This backtest data is not compatible with the Lean engine format. Some
              required fields may be missing from the backend response.
            </CardDescription>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={mainRef} className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <BacktestStatsCard leanBacktest={leanBacktest} />
          <div className="px-4 lg:px-6">
            {/* Main Chart - Equity Curve & Price */}
            {equityData ? (
              <EquityChart data={equityData} />
            ) : (
              <Skeleton className="h-80 w-full rounded-lg" />
            )}
          </div>
          <div className="px-4 lg:px-6 flex flex-col md:flex-row gap-4">
            <ListContainer
              title="Orders"
              description="Market Orders"
              isLoading={isOrdersLoading}
              childrenClassNames="space-y-4"
            >
              {orders
                ? orders.map((order) => {
                  return <OrderEntry key={order.id} order={order} />;
                })
                : null}
            </ListContainer>
            <ListContainer title="Trades" description="Description">
              {closedTrades
                ? closedTrades.map((trade, idx) => {
                  return <TradeEntry key={idx} trade={trade} />;
                })
                : null}
            </ListContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BacktestResults;
