import { Order } from "@/types/order";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface OrderEntryProps {
    order: Order;
}

export function OrderEntry({ order }: OrderEntryProps) {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const toggleExpansion = () => {
        setIsExpanded((prev) => !prev);
    };

    const hasParameters = order.parameters && Object.keys(order.parameters).length > 0;

    return (
        <div
            key={order.id}
            className="rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
        >
            <div
                className="flex items-center justify-between p-3 cursor-pointer"
                onClick={() => hasParameters && toggleExpansion()}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                order.side === "buy"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                        >
                            {order.side.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-foreground">{order.symbol}</span>
                        <span
                            className={`text-xs px-2 py-1 rounded ${
                                order.status === "filled"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                    : order.status === "canceled" || order.status === "rejected"
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
                            }`}
                        >
                            {order.parameters["status"]}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Qty: {order.quantity.toLocaleString()}</span>
                        <span>
                            {new Date(order.time).toLocaleDateString()}{" "}
                            {new Date(order.time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>
                </div>
                {hasParameters && (
                    <div className="ml-2 flex-shrink-0">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                    </div>
                )}
            </div>

            {isExpanded && hasParameters && (
                <div className="px-3 pb-3 border-t bg-muted/20">
                    <div className="pt-3">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                            Parameters
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {Object.entries(order.parameters).map(([key, value]) => (
                                <div
                                    key={key}
                                    className="flex justify-between items-center text-xs"
                                >
                                    <span className="font-medium text-foreground capitalize">
                                        {key.replace(/([A-Z])/g, " $1").trim()}:
                                    </span>
                                    <span className="text-muted-foreground font-mono">
                                        {typeof value === "object"
                                            ? JSON.stringify(value)
                                            : String(value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
