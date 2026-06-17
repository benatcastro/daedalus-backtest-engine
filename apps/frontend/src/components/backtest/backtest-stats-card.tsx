import React from "react";
import LeanBacktest from "@/types/lean/LeanBacktest";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

interface BacktestStatsCardProps {
    leanBacktest: LeanBacktest;
}

const BacktestStatsCard: React.FC<BacktestStatsCardProps> = ({ leanBacktest }) => {
    const { totalPerformance } = leanBacktest;
    const { tradeStatistics, portfolioStatistics } = totalPerformance;

    const formatCurrency = (value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) return "$0.00";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const getNumericValue = (value: string) => parseFloat(value) || 0;

    const winRateValue = getNumericValue(tradeStatistics.winRate);
    const netProfitValue = getNumericValue(portfolioStatistics.totalNetProfit);
    const annualReturnValue = getNumericValue(portfolioStatistics.compoundingAnnualReturn);
    const sharpeRatioValue = getNumericValue(portfolioStatistics.sharpeRatio);
    const maxDrawdownValue = getNumericValue(portfolioStatistics.drawdown);
    const sortinoRatioValue = getNumericValue(portfolioStatistics.sortinoRatio);
    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Net Profit</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {formatCurrency(portfolioStatistics.totalNetProfit)}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            {netProfitValue >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                            {netProfitValue >= 0 ? "+" : ""}
                            {(netProfitValue * 100).toFixed(2)}%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {netProfitValue >= 0
                            ? "Profitable strategy"
                            : "Strategy needs optimization"}
                        {netProfitValue >= 0 ? (
                            <IconTrendingUp className="size-4" />
                        ) : (
                            <IconTrendingDown className="size-4" />
                        )}
                    </div>
                    <div className="text-muted-foreground">Total returns from backtest period</div>
                </CardFooter>
            </Card>
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Win Rate</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {(winRateValue * 100).toFixed(1)}%
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            {winRateValue >= 0.5 ? <IconTrendingUp /> : <IconTrendingDown />}
                            {winRateValue >= 0.5 ? "Good" : "Poor"}
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {winRateValue >= 0.5 ? "Strong win rate" : "Win rate needs improvement"}
                        {winRateValue >= 0.5 ? (
                            <IconTrendingUp className="size-4" />
                        ) : (
                            <IconTrendingDown className="size-4" />
                        )}
                    </div>
                    <div className="text-muted-foreground">Percentage of profitable trades</div>
                </CardFooter>
            </Card>
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Sharpe Ratio</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {sharpeRatioValue.toFixed(2)}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            {sharpeRatioValue >= 1 ? <IconTrendingUp /> : <IconTrendingDown />}
                            {sharpeRatioValue >= 1 ? "Good" : "Poor"}
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {sharpeRatioValue >= 1
                            ? "Strong risk-adjusted returns"
                            : "Risk-adjusted returns need work"}
                        {sharpeRatioValue >= 1 ? (
                            <IconTrendingUp className="size-4" />
                        ) : (
                            <IconTrendingDown className="size-4" />
                        )}
                    </div>
                    <div className="text-muted-foreground">Risk-adjusted performance metric</div>
                </CardFooter>
            </Card>
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Annual Return</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {(annualReturnValue * 100).toFixed(1)}%
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            {annualReturnValue >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                            {annualReturnValue >= 0 ? "+" : ""}
                            {(annualReturnValue * 100).toFixed(1)}%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {annualReturnValue >= 0.1
                            ? "Strong annual performance"
                            : "Performance needs improvement"}
                        {annualReturnValue >= 0.1 ? (
                            <IconTrendingUp className="size-4" />
                        ) : (
                            <IconTrendingDown className="size-4" />
                        )}
                    </div>
                    <div className="text-muted-foreground">Compound annual growth rate</div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default BacktestStatsCard;
