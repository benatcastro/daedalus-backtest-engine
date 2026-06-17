"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
    equity: {
        label: "Equity",
        color: "var(--primary)",
    },
} satisfies ChartConfig;

interface EquityChartProps {
    data?: Array<{
        time: number;
        value: number;
    }>;
}

export function EquityChart({ data = [] }: EquityChartProps) {
    const isMobile = useIsMobile();

    // Convert equity data to chart format
    const chartData = React.useMemo(() => {
        if (!data || data.length === 0) return [];

        return data.map((item) => ({
            timestamp: item.time,
            date: new Date(item.time * 1000).toISOString().split("T")[0],
            equity: item.value,
            displayDate: new Date(item.time * 1000).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }),
        }));
    }, [data]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    // Calculate Y-axis domain to zoom into the actual data range
    const yAxisDomain = React.useMemo(() => {
        if (chartData.length === 0) return ["auto", "auto"];

        const values = chartData.map((d) => d.equity);
        const min = Math.min(...values);
        const max = Math.max(...values);

        // Add 2% padding above and below the actual range
        const padding = (max - min) * 0.02;
        const domainMin = min - padding;
        const domainMax = max + padding;

        return [domainMin, domainMax];
    }, [chartData]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Equity Curve</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">Portfolio equity over time</span>
                    <span className="@[540px]/card:hidden">Portfolio equity</span>
                </CardDescription>
                <CardAction></CardAction>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 max-h-72">
                {chartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="fillEquity" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-equity)"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-equity)"
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return date.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    });
                                }}
                            />
                            <YAxis
                                domain={yAxisDomain}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => formatCurrency(value)}
                                width={80}
                            />
                            <ChartTooltip
                                cursor={false}
                                defaultIndex={isMobile ? -1 : Math.floor(chartData.length / 2)}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value) => {
                                            return new Date(value).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            });
                                        }}
                                        formatter={(value: any) => [
                                            formatCurrency(Number(value)),
                                            "Equity",
                                        ]}
                                        indicator="dot"
                                    />
                                }
                            />
                            <Area
                                dataKey="equity"
                                type="natural"
                                fill="url(#fillEquity)"
                                stroke="var(--color-equity)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ChartContainer>
                ) : (
                    <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <p className="text-lg font-semibold mb-2">No equity data available</p>
                            <p className="text-sm">
                                Equity curve will appear here once backtest data is loaded
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
