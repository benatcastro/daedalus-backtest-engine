/**
 * Enum representing the different backtesting engines supported by the application.
 *
 * @enum {string}
 */
export enum BacktestEngine {
    /** Lean Algorithm Framework engine */
    LEAN = "LEAN",
    /** Generic backtesting engine */
    BACKTESTING = "BACKTESTING",
}

export default BacktestEngine;
