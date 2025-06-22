"use client";

import { useEffect, useMemo, useState } from "react";
import { Strategy } from "@prisma/client";
import Backtest from "@/types/backtest";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDataFeed } from "@/hooks/use-data-feed";
import { backtestDatesToRange } from "@/utils/sample-data-generator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { IRange, Time } from "lightweight-charts";
import { useBacktestContext } from "@/contexts/backtest-context";
import { MousePointer, TrendingUp, Square, Type, ArrowUpRight } from "lucide-react";
import { BacktestSidebarItem } from "./backtest-sidebar";

interface BacktestResultsProps {
  strategy: Strategy;
  backtest: Backtest;
}

export function BacktestResults({ strategy, backtest }: BacktestResultsProps) {
  // Extract backtest date range
  const dateRange = backtestDatesToRange(
    backtest.starting_date,
    backtest.ending_date
  );

  // Calculate backtest duration in days
  const backtestDuration = Math.ceil(
    (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
  );

  const backtestContext = useBacktestContext()
  const drawingTools: BacktestSidebarItem[] = useMemo(() => {
    return [
      {
        id: "select",
        name: "Select Tool",
        description: "Select and move objects on the chart",
        icon: <MousePointer size={24} />
      },
      {
        id: "line",
        name: "Line Tool",
        description: "Draw trend lines and support/resistance levels",
        icon: <TrendingUp size={24} />
      },
      {
        id: "rectangle",
        name: "Rectangle Tool",
        description: "Draw rectangular zones to highlight price ranges",
        icon: <Square size={24} />
      },
      {
        id: "text",
        name: "Text Tool",
        description: "Add text annotations to the chart",
        icon: <Type size={24} />
      },
      {
        id: "arrow",
        name: "Arrow Tool",
        description: "Draw directional arrows to mark price movements",
        icon: <ArrowUpRight size={24} />
      }
  ]}, []);

  useEffect(() => {
    backtestContext.setSidebarItems(drawingTools)
    return () => {
      backtestContext.setSidebarItems([])
    }
  }, [drawingTools])
  // Mock performance data - In a real implementation, these would come from the API
  const performanceData = {
      startDateTime: "2024-10-01T18:57:00Z",
      endDateTime: "2024-11-08T08:31:00Z",
      totalNumberOfTrades: 105,
      numberOfWinningTrades: 10,
      numberOfLosingTrades: 95,
      totalProfitLoss: "0.64",
      totalProfit: "2.75",
      totalLoss: "-2.11",
      largestProfit: "0.41",
      largestLoss: "-0.08",
      averageProfitLoss: "0.0061",
      averageProfit: "0.2750",
      averageLoss: "-0.0222",
      averageTradeDuration: "14:57:33.1428589",
      averageWinningTradeDuration: "1.23:03:06.0000001",
      averageLosingTradeDuration: "11:34:51.7894754",
      medianTradeDuration: "02:47:00",
      medianWinningTradeDuration: "2.12:54:00",
      medianLosingTradeDuration: "02:15:00",
      maxConsecutiveWinningTrades: 3,
      maxConsecutiveLosingTrades: 22,
      profitLossRatio: "12.3815",
      winLossRatio: "0.1053",
      winRate: "0.0952",
      lossRate: "0.9048",
      averageMAE: "-0.0972",
      averageMFE: "0.0730",
      largestMAE: "-1.02",
      largestMFE: "0.79",
      maximumClosedTradeDrawdown: "-0.50",
      maximumIntraTradeDrawdown: "-1.66",
      profitLossStandardDeviation: "0.1056",
      profitLossDownsideDeviation: "0.0250",
      profitFactor: "1.3033",
      sharpeRatio: "0.0577",
      sortinoRatio: "0.2440",
      profitToMaxDrawdownRatio: "1.28",
      maximumEndTradeDrawdown: "-0.85",
      averageEndTradeDrawdown: "-0.0669",
      maximumDrawdownDuration: "15.06:06:00",
      totalFees: "1.0436"
  };

  // Mock monthly returns data - In a real implementation, these would come from the API
  const monthlyReturns = [
    { month: "Jan", return: "+2.3%" },
    { month: "Feb", return: "-1.2%" },
    { month: "Mar", return: "+3.1%" },
    { month: "Apr", return: "+1.5%" },
    { month: "May", return: "+0.8%" },
    { month: "Jun", return: "-0.6%" },
  ];

  return (
    <div className="flex flex-col h-full p-4 gap-y-4">
            <div className="grid grid-cols-[70%_30%] gap-x-4">
                {/* Main Chart - Equity Curve & Price */}
                <Card className="w-full">
                <CardHeader className="py-3">
                    <CardTitle>Equity Curve & Price</CardTitle>
                </CardHeader>
                <CardContent className="h-[340px]">
                </CardContent>
                </Card>

                {/* Key Performance Metrics Card */}
                <Card >
                    <CardHeader>
                    <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Profit: {performanceData.totalProfit}</p>
                        <p>Loss: {performanceData.totalLoss}</p>
                        <p>Total Trades: {performanceData.totalNumberOfTrades}</p>
                    </CardContent>
                </Card>
            </div>



            {/* Order List Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Drawdown Chart */}
            <Card className="h-[300px]">
                <CardHeader className="py-3">
                <CardTitle>Orders</CardTitle>
                </CardHeader>
                <CardContent className="h-[240px]">
                </CardContent>
            </Card>

            {/* Monthly Returns */}
            <Card className="h-[300px] overflow-hidden">
                <CardHeader className="py-3">
                <CardTitle>Monthly Returns</CardTitle>
                </CardHeader>
                <CardContent className="overflow-y-scroll">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Return</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {monthlyReturns.map((item) => (
                        <TableRow key={item.month}>
                        <TableCell>{item.month}</TableCell>
                        <TableCell className={`text-right ${
                            item.return.startsWith("+") ? "text-green-600" : "text-red-600"
                        }`}>
                            {item.return}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
            </div>

            {/* Trade Distribution Stats */}
            <Card>
            <CardHeader className="py-3">
                <CardTitle>Trade Statistics</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                    <p className="text-xl font-semibold">{}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Average Trade</p>
                    <p className="text-xl font-semibold text-green-600">{}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Best Trade</p>
                    <p className="text-xl font-semibold text-green-600">{}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Worst Trade</p>
                    <p className="text-xl font-semibold text-red-600">{}</p>
                </div>
                </div>
            </CardContent>
            </Card>
        </div>
  );
}

export default BacktestResults;
