"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { dateRangeToTimeRange, isoTimeToDateRange } from "@/lib/time-utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useBacktestContext } from "@/contexts/backtest-context";
import { Receipt, ActivitySquare } from "lucide-react";
import { BacktestSidebarItem } from "./backtest-sidebar";
import useSWR from "swr";
import { SeriesMetadata } from "@/types/series";
import Chart from "../chart/chart";
import { Series } from "../chart/series";
import Candle from "@/types/candle";
import { Order } from "@/types/order";
import { OrdersList } from "./orders-list";
import { PerformanceMetricsCard } from "./performance-metrics-card";

interface BacktestResultsProps {
    strategy: Strategy;
    backtest: Backtest;
}

export function BacktestResults({ strategy, backtest }: BacktestResultsProps) {
    const ordersRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLDivElement>(null);
    const equitySeriesRef = useRef<SeriesMetadata>(null);

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
        isLoading: isSeriesLoading,
        error: seriesError,
    } = useSWR<SeriesMetadata[]>(`/api/v1/backtest/${backtest.id}/series`);
    const {
        data: orders,
        isLoading: isOrdersLoading,
        error: orderError,
    } = useSWR<Order[]>(
        bactestDates
            ? `/api/v1/backtest/${backtest.id}/orders/?start=${bactestDates.timeRange.from}&end=${bactestDates.timeRange.to}`
            : null,
    );
    const {
        data: rawEquityData,
        isLoading: isEquityDataLoading,
        error: equitySeriesError,
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
        totalFees: "1.0436",
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
        <div className="flex flex-col flex-wrap p-4 gap-4">

            <div ref={mainRef} className="grid grid-rows-3 md:grid-rows-2 lg:flex lg:flex-wrap gap-4">
                {/* Main Chart - Equity Curve & Price */}
                <Card className="sm:min-w-12 lg:min-w-2xl grow basis-1/3">
                    <CardHeader className="py-3">
                        <CardTitle>Equity Curve & Price</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80 relative">
                        <Chart layout={{ background: { color: "transparent" } }}>
                            <h1 className="absolute top-4 left-4 z-10 text-3xl font-bold text-green-600">+2.43%</h1>
                            {equityData ? (
                                <Series type="line" data={equityData}></Series>
                            ) : undefined}
                        </Chart>
                    </CardContent>
                </Card>
        <Card className="grow ">
            <CardHeader >
                <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
                <CardDescription className="text-xs">
                    "Key trading statistics and risk metrics"
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                <PerformanceMetricsCard className="" performanceData={performanceData} />
            </CardContent>
                {/* Key Performance Metrics Card */}
                </Card>

        <Card className="grow ">
            <CardHeader >
                <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
                <CardDescription className="text-xs">
                    "Key trading statistics and risk metrics"
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                <PerformanceMetricsCard className="" performanceData={performanceData} />
            </CardContent>
                {/* Key Performance Metrics Card */}
                </Card>

            </div>

            <div ref={ordersRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Order List */}
                <Card className="h-96 ">
                    <CardHeader className="py-3">
                        <CardTitle>Orders</CardTitle>
                        <CardDescription>
                            {orders ? `${orders.length} orders` : "Loading..."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-72 overflow-y-auto mr-4">
                        <OrdersList
                            orders={orders}
                            isLoading={isOrdersLoading}
                            error={orderError}
                        />
                    </CardContent>
                </Card>

                {/* Monthly Returns */}
                <Card className="h-80 overflow-hidden">
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
                                        <TableCell
                                            className={`text-right ${
                                                item.return.startsWith("+")
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                        >
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
                    <CardTitle>Detailed Trade Statistics</CardTitle>
                    <CardDescription>
                        Comprehensive breakdown of trading performance and risk analysis
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {/* Trading Activity */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                                Trading Activity
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Total Trades</span>
                                    <span className="text-sm font-semibold">{performanceData.totalNumberOfTrades}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Winning Trades</span>
                                    <span className="text-sm font-semibold text-green-600">{performanceData.numberOfWinningTrades}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Losing Trades</span>
                                    <span className="text-sm font-semibold text-red-600">{performanceData.numberOfLosingTrades}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Win/Loss Ratio</span>
                                    <span className="text-sm font-semibold">{parseFloat(performanceData.winLossRatio).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                                Performance
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Total Profit</span>
                                    <span className="text-sm font-semibold text-green-600">+{performanceData.totalProfit}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Total Loss</span>
                                    <span className="text-sm font-semibold text-red-600">{performanceData.totalLoss}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Avg Winning Trade</span>
                                    <span className="text-sm font-semibold text-green-600">+{performanceData.averageProfit}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Avg Losing Trade</span>
                                    <span className="text-sm font-semibold text-red-600">{performanceData.averageLoss}</span>
                                </div>
                            </div>
                        </div>

                        {/* Risk Analysis */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                                Risk Analysis
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                                    <span className="text-sm font-semibold">{parseFloat(performanceData.sharpeRatio).toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Sortino Ratio</span>
                                    <span className="text-sm font-semibold">{parseFloat(performanceData.sortinoRatio).toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Max Drawdown</span>
                                    <span className="text-sm font-semibold text-red-600">{performanceData.maximumClosedTradeDrawdown}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Volatility</span>
                                    <span className="text-sm font-semibold">{parseFloat(performanceData.profitLossStandardDeviation).toFixed(3)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Consecutive Trades & Duration */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                                Trade Patterns
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Max Consecutive Wins</span>
                                    <span className="text-sm font-semibold text-green-600">{performanceData.maxConsecutiveWinningTrades}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Max Consecutive Losses</span>
                                    <span className="text-sm font-semibold text-red-600">{performanceData.maxConsecutiveLosingTrades}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Avg Trade Duration</span>
                                    <span className="text-sm font-semibold">{performanceData.averageTradeDuration.split('.')[0]}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Total Fees</span>
                                    <span className="text-sm font-semibold text-orange-600">{performanceData.totalFees}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default BacktestResults;
