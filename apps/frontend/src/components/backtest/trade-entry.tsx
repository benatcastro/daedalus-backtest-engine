import { ClosedTrade } from "@/types/lean/LeanBacktest";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface TradeEntryProps {
    trade: ClosedTrade;
}

export function TradeEntry({ trade }: TradeEntryProps) {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const toggleExpansion = () => {
        setIsExpanded((prev) => !prev);
    };

    // Format profit/loss display with colors
    const isProfit = parseFloat(trade.profitLoss) > 0;
    const profitLossColor = isProfit
        ? "text-green-600 dark:text-green-400"
        : "text-red-600 dark:text-red-400";

    // Format duration for display
    const formatDuration = (duration: string) => {
        // Parse the duration string (e.g., "1.05:30:00" for 1 day, 5 hours, 30 minutes)
        const parts = duration.split(":");
        if (parts.length === 3) {
            const [days, hours, minutes] = parts;
            if (parseFloat(days) >= 1) {
                return `${Math.floor(parseFloat(days))}d ${hours}h`;
            } else {
                return `${hours}h ${minutes}m`;
            }
        }
        return duration;
    };

    return (
        <div className="rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
            <div
                className="flex items-center justify-between p-3 cursor-pointer"
                onClick={toggleExpansion}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                trade.direction === 1
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                        >
                            {trade.direction === 1 ? "LONG" : "SHORT"}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                            {trade.symbol.value}
                        </span>
                        <span
                            className={`text-xs px-2 py-1 rounded ${
                                trade.isWin
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                            }`}
                        >
                            {trade.isWin ? "WIN" : "LOSS"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Qty: {parseFloat(trade.quantity).toLocaleString()}</span>
                        <span className={`font-mono ${profitLossColor}`}>
                            {isProfit ? "+" : ""}${parseFloat(trade.profitLoss).toFixed(2)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>{formatDuration(trade.duration)}</span>
                        <span>
                            {new Date(trade.entryTime).toLocaleDateString()}{" "}
                            {new Date(trade.entryTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>
                </div>
                <div className="ml-2 flex-shrink-0">
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="px-3 pb-3 border-t bg-muted/20">
                    <div className="pt-3">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                            Trade Details
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-foreground">Entry Price:</span>
                                <span className="text-muted-foreground font-mono">
                                    ${parseFloat(trade.entryPrice).toFixed(4)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-foreground">Exit Price:</span>
                                <span className="text-muted-foreground font-mono">
                                    ${parseFloat(trade.exitPrice).toFixed(4)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-foreground">Entry Time:</span>
                                <span className="text-muted-foreground font-mono">
                                    {new Date(trade.entryTime).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-foreground">Exit Time:</span>
                                <span className="text-muted-foreground font-mono">
                                    {new Date(trade.exitTime).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-foreground">Total Fees:</span>
                                <span className="text-muted-foreground font-mono">
                                    ${parseFloat(trade.totalFees).toFixed(4)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-foreground">MAE:</span>
                                <span className="text-muted-foreground font-mono">
                                    ${parseFloat(trade.mae).toFixed(4)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-foreground">MFE:</span>
                                <span className="text-muted-foreground font-mono">
                                    ${parseFloat(trade.mfe).toFixed(4)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-foreground">
                                    End Trade Drawdown:
                                </span>
                                <span className="text-muted-foreground font-mono">
                                    ${parseFloat(trade.endTradeDrawdown).toFixed(4)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
