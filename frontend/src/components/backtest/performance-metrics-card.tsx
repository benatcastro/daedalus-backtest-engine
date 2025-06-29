"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PerformanceData {
    totalProfitLoss: string;
    profitFactor: string;
    winRate: string;
    totalNumberOfTrades: number;
    sharpeRatio: string;
    maximumClosedTradeDrawdown: string;
    largestProfit: string;
    largestLoss: string;
    averageProfitLoss: string;
}

interface PerformanceMetricsCardProps {
    performanceData: PerformanceData;
    title?: string;
    description?: string;
    className?: string;
}

export function PerformanceMetricsCard({
    performanceData,
    title = "Performance Metrics",
    description = "Key trading statistics and risk metrics",
    className = "",
}: PerformanceMetricsCardProps) {
    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* P&L Section */}
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Profit & Loss
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Total P&L</p>
                            <p
                                className={`text-lg font-bold ${
                                    parseFloat(performanceData.totalProfitLoss) >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                            >
                                {parseFloat(performanceData.totalProfitLoss) >= 0 ? "+" : ""}
                                {performanceData.totalProfitLoss}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Profit Factor</p>
                            <p className="text-lg font-bold text-foreground">
                                {parseFloat(performanceData.profitFactor).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Win Rate Section */}
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Success Rate
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Win Rate</p>
                            <p className="text-lg font-bold text-green-600">
                                {(parseFloat(performanceData.winRate) * 100).toFixed(1)}%
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Total Trades</p>
                            <p className="text-lg font-bold text-foreground">
                                {performanceData.totalNumberOfTrades}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Risk Metrics */}
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Risk Metrics
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                            <p className="text-lg font-bold text-foreground">
                                {parseFloat(performanceData.sharpeRatio).toFixed(3)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Max Drawdown</p>
                            <p className="text-lg font-bold text-red-600">
                                {performanceData.maximumClosedTradeDrawdown}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trade Performance */}
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Trade Performance
                    </h4>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Best Trade:</span>
                            <span className="text-sm font-medium text-green-600">
                                +{performanceData.largestProfit}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Worst Trade:</span>
                            <span className="text-sm font-medium text-red-600">
                                {performanceData.largestLoss}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Avg Trade:</span>
                            <span
                                className={`text-sm font-medium ${
                                    parseFloat(performanceData.averageProfitLoss) >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                            >
                                {parseFloat(performanceData.averageProfitLoss) >= 0 ? "+" : ""}
                                {performanceData.averageProfitLoss}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
