/**
 * Base order type representing a trading order from a backtest
 */
export type OrderSide = "buy" | "sell";

export type OrderStatus =
    | "new"
    | "submitted"
    | "filled"
    | "canceled"
    | "rejected"
    | "partially_filled";

/**
 * General Order type with basic order information and additional parameters in a nested object
 */
export interface Order {
    /**
     * Database ID of the order
     */
    id: number;

    /**
     * Original order identifier from the backtest
     */
    order_id: number;

    /**
     * Timestamp when the order was created/executed
     */
    time: string;

    /**
     * Trading symbol (e.g., 'BTCUSDT')
     */
    symbol: string;

    /**
     * Direction of the trade (buy or sell)
     */
    side: OrderSide;

    /**
     * Size of the order
     */
    quantity: number;

    /**
     * Current status of the order
     */
    status: OrderStatus;

    /**
     * Additional order parameters and metadata
     * Can contain any JSON data specific to the trading engine
     */
    parameters: Record<string, unknown>;
}
