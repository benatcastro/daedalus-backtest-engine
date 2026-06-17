/**
 * Utility functions for serializing backtest data between different formats
 */

import Backtest from "@/types/backtest";
import LeanBacktest, {
    Statistics,
    TotalPerformance,
    RuntimeStatistics,
    State,
    AlgorithmConfiguration,
    DataRequest,
    RollingWindow,
    TradeStatistics,
    PortfolioStatistics,
    ClosedTrade,
    RollingWindowSection,
    SymbolInfo,
} from "@/types/lean/LeanBacktest";

/**
 * Custom error for missing required backtest data
 */
export class BacktestSerializationError extends Error {
    constructor(field: string, context?: string) {
        const message = context
            ? `Missing required field '${field}' in ${context}`
            : `Missing required field '${field}'`;
        super(message);
        this.name = "BacktestSerializationError";
    }
}

/**
 * Validates that a required field exists and is not null/undefined
 */
function validateRequired<T>(data: any, field: string, context?: string): T {
    if (data === null || data === undefined) {
        throw new BacktestSerializationError(field, context);
    }
    return data as T;
}

/**
 * Validates that an object has the required structure
 */
function validateObject(data: any, field: string, context?: string): Record<string, any> {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new BacktestSerializationError(field, context);
    }
    return data;
}

/**
 * Converts a generic Backtest response from the backend into a LeanBacktest type
 * @param backtest - The backtest response from the backend API
 * @returns LeanBacktest with properly typed nested data
 * @throws BacktestSerializationError if required fields are missing
 */
export function serializeToLeanBacktest(backtest: Backtest): LeanBacktest {
    // Validate that parameters exist
    const params = validateRequired<Record<string, any>>(
        backtest.parameters,
        "parameters",
        "backtest",
    );

    // Validate and extract totalPerformance
    const totalPerformanceData = validateObject(
        params.totalPerformance,
        "totalPerformance",
        "backtest parameters",
    );

    // Validate trade statistics
    const tradeStatsData = validateObject(
        totalPerformanceData.tradeStatistics,
        "tradeStatistics",
        "totalPerformance",
    );

    const tradeStatistics: TradeStatistics = {
        startDatetime: validateRequired<string>(
            tradeStatsData.startDatetime,
            "startDateTime",
            "tradeStatistics",
        ),
        endDatetime: validateRequired<string>(
            tradeStatsData.endDatetime,
            "endDateTime",
            "tradeStatistics",
        ),
        totalNumberOfTrades: validateRequired<number>(
            tradeStatsData.totalNumberOfTrades,
            "totalNumberOfTrades",
            "tradeStatistics",
        ),
        numberOfWinningTrades: validateRequired<number>(
            tradeStatsData.numberOfWinningTrades,
            "numberOfWinningTrades",
            "tradeStatistics",
        ),
        numberOfLosingTrades: validateRequired<number>(
            tradeStatsData.numberOfLosingTrades,
            "numberOfLosingTrades",
            "tradeStatistics",
        ),
        totalProfitLoss: validateRequired<string>(
            tradeStatsData.totalProfitLoss,
            "totalProfitLoss",
            "tradeStatistics",
        ),
        totalProfit: validateRequired<string>(
            tradeStatsData.totalProfit,
            "totalProfit",
            "tradeStatistics",
        ),
        totalLoss: validateRequired<string>(
            tradeStatsData.totalLoss,
            "totalLoss",
            "tradeStatistics",
        ),
        largestProfit: validateRequired<string>(
            tradeStatsData.largestProfit,
            "largestProfit",
            "tradeStatistics",
        ),
        largestLoss: validateRequired<string>(
            tradeStatsData.largestLoss,
            "largestLoss",
            "tradeStatistics",
        ),
        averageProfitLoss: validateRequired<string>(
            tradeStatsData.averageProfitLoss,
            "averageProfitLoss",
            "tradeStatistics",
        ),
        averageProfit: validateRequired<string>(
            tradeStatsData.averageProfit,
            "averageProfit",
            "tradeStatistics",
        ),
        averageLoss: validateRequired<string>(
            tradeStatsData.averageLoss,
            "averageLoss",
            "tradeStatistics",
        ),
        averageTradeDuration: validateRequired<string>(
            tradeStatsData.averageTradeDuration,
            "averageTradeDuration",
            "tradeStatistics",
        ),
        averageWinningTradeDuration: validateRequired<string>(
            tradeStatsData.averageWinningTradeDuration,
            "averageWinningTradeDuration",
            "tradeStatistics",
        ),
        averageLosingTradeDuration: validateRequired<string>(
            tradeStatsData.averageLosingTradeDuration,
            "averageLosingTradeDuration",
            "tradeStatistics",
        ),
        medianTradeDuration: validateRequired<string>(
            tradeStatsData.medianTradeDuration,
            "medianTradeDuration",
            "tradeStatistics",
        ),
        medianWinningTradeDuration: validateRequired<string>(
            tradeStatsData.medianWinningTradeDuration,
            "medianWinningTradeDuration",
            "tradeStatistics",
        ),
        medianLosingTradeDuration: validateRequired<string>(
            tradeStatsData.medianLosingTradeDuration,
            "medianLosingTradeDuration",
            "tradeStatistics",
        ),
        maxConsecutiveWinningTrades: validateRequired<number>(
            tradeStatsData.maxConsecutiveWinningTrades,
            "maxConsecutiveWinningTrades",
            "tradeStatistics",
        ),
        maxConsecutiveLosingTrades: validateRequired<number>(
            tradeStatsData.maxConsecutiveLosingTrades,
            "maxConsecutiveLosingTrades",
            "tradeStatistics",
        ),
        profitLossRatio: validateRequired<string>(
            tradeStatsData.profitLossRatio,
            "profitLossRatio",
            "tradeStatistics",
        ),
        winLossRatio: validateRequired<string>(
            tradeStatsData.winLossRatio,
            "winLossRatio",
            "tradeStatistics",
        ),
        winRate: validateRequired<string>(tradeStatsData.winRate, "winRate", "tradeStatistics"),
        lossRate: validateRequired<string>(tradeStatsData.lossRate, "lossRate", "tradeStatistics"),
        averageMae: validateRequired<string>(
            tradeStatsData.averageMae,
            "averageMae",
            "tradeStatistics",
        ),
        averageMfe: validateRequired<string>(
            tradeStatsData.averageMfe,
            "averageMfe",
            "tradeStatistics",
        ),
        largestMae: validateRequired<string>(
            tradeStatsData.largestMae,
            "largestMae",
            "tradeStatistics",
        ),
        largestMfe: validateRequired<string>(
            tradeStatsData.largestMfe,
            "largestMfe",
            "tradeStatistics",
        ),
        maximumClosedTradeDrawdown: validateRequired<string>(
            tradeStatsData.maximumClosedTradeDrawdown,
            "maximumClosedTradeDrawdown",
            "tradeStatistics",
        ),
        maximumIntraTradeDrawdown: validateRequired<string>(
            tradeStatsData.maximumIntraTradeDrawdown,
            "maximumIntraTradeDrawdown",
            "tradeStatistics",
        ),
        profitLossStandardDeviation: validateRequired<string>(
            tradeStatsData.profitLossStandardDeviation,
            "profitLossStandardDeviation",
            "tradeStatistics",
        ),
        profitLossDownsideDeviation: validateRequired<string>(
            tradeStatsData.profitLossDownsideDeviation,
            "profitLossDownsideDeviation",
            "tradeStatistics",
        ),
        profitFactor: validateRequired<string>(
            tradeStatsData.profitFactor,
            "profitFactor",
            "tradeStatistics",
        ),
        sharpeRatio: validateRequired<string>(
            tradeStatsData.sharpeRatio,
            "sharpeRatio",
            "tradeStatistics",
        ),
        sortinoRatio: validateRequired<string>(
            tradeStatsData.sortinoRatio,
            "sortinoRatio",
            "tradeStatistics",
        ),
        profitToMaxDrawdownRatio: validateRequired<string>(
            tradeStatsData.profitToMaxDrawdownRatio,
            "profitToMaxDrawdownRatio",
            "tradeStatistics",
        ),
        maximumEndTradeDrawdown: validateRequired<string>(
            tradeStatsData.maximumEndTradeDrawdown,
            "maximumEndTradeDrawdown",
            "tradeStatistics",
        ),
        averageEndTradeDrawdown: validateRequired<string>(
            tradeStatsData.averageEndTradeDrawdown,
            "averageEndTradeDrawdown",
            "tradeStatistics",
        ),
        maximumDrawdownDuration: validateRequired<string>(
            tradeStatsData.maximumDrawdownDuration,
            "maximumDrawdownDuration",
            "tradeStatistics",
        ),
        totalFees: validateRequired<string>(
            tradeStatsData.totalFees,
            "totalFees",
            "tradeStatistics",
        ),
    };

    // Validate portfolio statistics
    const portfolioStatsData = validateObject(
        totalPerformanceData.portfolioStatistics,
        "portfolioStatistics",
        "totalPerformance",
    );

    const portfolioStatistics: PortfolioStatistics = {
        averageWinRate: validateRequired<string>(
            portfolioStatsData.averageWinRate,
            "averageWinRate",
            "portfolioStatistics",
        ),
        averageLossRate: validateRequired<string>(
            portfolioStatsData.averageLossRate,
            "averageLossRate",
            "portfolioStatistics",
        ),
        profitLossRatio: validateRequired<string>(
            portfolioStatsData.profitLossRatio,
            "profitLossRatio",
            "portfolioStatistics",
        ),
        winRate: validateRequired<string>(
            portfolioStatsData.winRate,
            "winRate",
            "portfolioStatistics",
        ),
        lossRate: validateRequired<string>(
            portfolioStatsData.lossRate,
            "lossRate",
            "portfolioStatistics",
        ),
        expectancy: validateRequired<string>(
            portfolioStatsData.expectancy,
            "expectancy",
            "portfolioStatistics",
        ),
        startEquity: validateRequired<string>(
            portfolioStatsData.startEquity,
            "startEquity",
            "portfolioStatistics",
        ),
        endEquity: validateRequired<string>(
            portfolioStatsData.endEquity,
            "endEquity",
            "portfolioStatistics",
        ),
        compoundingAnnualReturn: validateRequired<string>(
            portfolioStatsData.compoundingAnnualReturn,
            "compoundingAnnualReturn",
            "portfolioStatistics",
        ),
        drawdown: validateRequired<string>(
            portfolioStatsData.drawdown,
            "drawdown",
            "portfolioStatistics",
        ),
        totalNetProfit: validateRequired<string>(
            portfolioStatsData.totalNetProfit,
            "totalNetProfit",
            "portfolioStatistics",
        ),
        sharpeRatio: validateRequired<string>(
            portfolioStatsData.sharpeRatio,
            "sharpeRatio",
            "portfolioStatistics",
        ),
        probabilisticSharpeRatio: validateRequired<string>(
            portfolioStatsData.probabilisticSharpeRatio,
            "probabilisticSharpeRatio",
            "portfolioStatistics",
        ),
        sortinoRatio: validateRequired<string>(
            portfolioStatsData.sortinoRatio,
            "sortinoRatio",
            "portfolioStatistics",
        ),
        alpha: validateRequired<string>(portfolioStatsData.alpha, "alpha", "portfolioStatistics"),
        beta: validateRequired<string>(portfolioStatsData.beta, "beta", "portfolioStatistics"),
        annualStandardDeviation: validateRequired<string>(
            portfolioStatsData.annualStandardDeviation,
            "annualStandardDeviation",
            "portfolioStatistics",
        ),
        annualVariance: validateRequired<string>(
            portfolioStatsData.annualVariance,
            "annualVariance",
            "portfolioStatistics",
        ),
        informationRatio: validateRequired<string>(
            portfolioStatsData.informationRatio,
            "informationRatio",
            "portfolioStatistics",
        ),
        trackingError: validateRequired<string>(
            portfolioStatsData.trackingError,
            "trackingError",
            "portfolioStatistics",
        ),
        treynorRatio: validateRequired<string>(
            portfolioStatsData.treynorRatio,
            "treynorRatio",
            "portfolioStatistics",
        ),
        portfolioTurnover: validateRequired<string>(
            portfolioStatsData.portfolioTurnover,
            "portfolioTurnover",
            "portfolioStatistics",
        ),
        valueAtRisk99: validateRequired<string>(
            portfolioStatsData.valueAtRisk99,
            "valueAtRisk99",
            "portfolioStatistics",
        ),
        valueAtRisk95: validateRequired<string>(
            portfolioStatsData.valueAtRisk95,
            "valueAtRisk95",
            "portfolioStatistics",
        ),
    };

    // Validate closed trades array
    const closedTradesData = totalPerformanceData.closedTrades;
    if (!Array.isArray(closedTradesData)) {
        throw new BacktestSerializationError("closedTrades", "totalPerformance");
    }

    const totalPerformance: TotalPerformance = {
        tradeStatistics,
        portfolioStatistics,
        closedTrades: closedTradesData,
    };

    // Validate and extract statistics
    const statisticsData = validateObject(params.statistics, "statistics", "backtest parameters");
    const statistics: Statistics = {
        totalOrders: validateRequired<number>(
            statisticsData.totalOrders,
            "totalOrders",
            "statistics",
        ),
        compoundingAnnualReturn: validateRequired<string>(
            statisticsData.compoundingAnnualReturn,
            "compoundingAnnualReturn",
            "statistics",
        ),
        drawdown: validateRequired<string>(statisticsData.drawdown, "drawdown", "statistics"),
        expectancy: validateRequired<string>(statisticsData.expectancy, "expectancy", "statistics"),
        startEquity: validateRequired<string>(
            statisticsData.startEquity,
            "startEquity",
            "statistics",
        ),
        endEquity: validateRequired<string>(statisticsData.endEquity, "endEquity", "statistics"),
        netProfit: validateRequired<string>(statisticsData.netProfit, "netProfit", "statistics"),
        sharpeRatio: validateRequired<string>(
            statisticsData.sharpeRatio,
            "sharpeRatio",
            "statistics",
        ),
        sortinoRatio: validateRequired<string>(
            statisticsData.sortinoRatio,
            "sortinoRatio",
            "statistics",
        ),
        probabilisticSharpeRatio: validateRequired<string>(
            statisticsData.probabilisticSharpeRatio,
            "probabilisticSharpeRatio",
            "statistics",
        ),
        lossRate: validateRequired<string>(statisticsData.lossRate, "lossRate", "statistics"),
        winRate: validateRequired<string>(statisticsData.winRate, "winRate", "statistics"),
        profitLossRatio: validateRequired<string>(
            statisticsData.profitLossRatio,
            "profitLossRatio",
            "statistics",
        ),
        averageWin: validateRequired<string>(statisticsData.averageWin, "averageWin", "statistics"),
        averageLoss: validateRequired<string>(
            statisticsData.averageLoss,
            "averageLoss",
            "statistics",
        ),
        alpha: validateRequired<string>(statisticsData.alpha, "alpha", "statistics"),
        beta: validateRequired<string>(statisticsData.beta, "beta", "statistics"),
        annualStandardDeviation: validateRequired<string>(
            statisticsData.annualStandardDeviation,
            "annualStandardDeviation",
            "statistics",
        ),
        annualVariance: validateRequired<string>(
            statisticsData.annualVariance,
            "annualVariance",
            "statistics",
        ),
        informationRatio: validateRequired<string>(
            statisticsData.informationRatio,
            "informationRatio",
            "statistics",
        ),
        trackingError: validateRequired<string>(
            statisticsData.trackingError,
            "trackingError",
            "statistics",
        ),
        treynorRatio: validateRequired<string>(
            statisticsData.treynorRatio,
            "treynorRatio",
            "statistics",
        ),
        totalFees: validateRequired<string>(statisticsData.totalFees, "totalFees", "statistics"),
        estimatedStrategyCapacity: validateRequired<string>(
            statisticsData.estimatedStrategyCapacity,
            "estimatedStrategyCapacity",
            "statistics",
        ),
        lowestCapacityAsset: validateRequired<string>(
            statisticsData.lowestCapacityAsset,
            "lowestCapacityAsset",
            "statistics",
        ),
        portfolioTurnover: validateRequired<string>(
            statisticsData.portfolioTurnover,
            "portfolioTurnover",
            "statistics",
        ),
    };

    // Validate and extract runtime statistics
    const runtimeStatsData = validateObject(
        params.runtimeStatistics,
        "runtimeStatistics",
        "backtest parameters",
    );
    const runtimeStatistics: RuntimeStatistics = {
        equity: validateRequired<string>(runtimeStatsData.equity, "equity", "runtimeStatistics"),
        fees: validateRequired<string>(runtimeStatsData.fees, "fees", "runtimeStatistics"),
        holdings: validateRequired<string>(
            runtimeStatsData.holdings,
            "holdings",
            "runtimeStatistics",
        ),
        netProfit: validateRequired<string>(
            runtimeStatsData.netProfit,
            "netProfit",
            "runtimeStatistics",
        ),
        probabilisticSharpeRatio: validateRequired<string>(
            runtimeStatsData.probabilisticSharpeRatio,
            "probabilisticSharpeRatio",
            "runtimeStatistics",
        ),
        returnPercentage: validateRequired<string>(
            runtimeStatsData.returnPercentage,
            "returnPercentage",
            "runtimeStatistics",
        ),
        unrealized: validateRequired<string>(
            runtimeStatsData.unrealized,
            "unrealized",
            "runtimeStatistics",
        ),
        volume: validateRequired<string>(runtimeStatsData.volume, "volume", "runtimeStatistics"),
    };

    // Validate and extract state
    const stateData = validateObject(params.state, "state", "backtest parameters");
    const state: State = {
        startTime: validateRequired<string>(stateData.startTime, "startTime", "state"),
        endTime: validateRequired<string>(stateData.endTime, "endTime", "state"),
        runtimeError: validateRequired<string>(stateData.runtimeError, "runtimeError", "state"),
        stackTrace: validateRequired<string>(stateData.stackTrace, "stackTrace", "state"),
        logCount: validateRequired<string>(stateData.logCount, "logCount", "state"),
        orderCount: validateRequired<string>(stateData.orderCount, "orderCount", "state"),
        insightCount: validateRequired<string>(stateData.insightCount, "insightCount", "state"),
        name: validateRequired<string>(stateData.name, "name", "state"),
        hostname: validateRequired<string>(stateData.hostname, "hostname", "state"),
        status: validateRequired<string>(stateData.status, "status", "state"),
    };

    // Extract optional algorithm configuration
    let algorithmConfiguration: AlgorithmConfiguration | undefined;
    if (params.algorithmConfiguration) {
        const algoConfigData = validateObject(
            params.algorithmConfiguration,
            "algorithmConfiguration",
            "backtest parameters",
        );
        algorithmConfiguration = {
            name: validateRequired<string>(algoConfigData.name, "name", "algorithmConfiguration"),
            tags: Array.isArray(algoConfigData.tags) ? algoConfigData.tags : [],
            accountCurrency: validateRequired<string>(
                algoConfigData.accountCurrency,
                "accountCurrency",
                "algorithmConfiguration",
            ),
            brokerage: validateRequired<number>(
                algoConfigData.brokerage,
                "brokerage",
                "algorithmConfiguration",
            ),
            accountType: validateRequired<number>(
                algoConfigData.accountType,
                "accountType",
                "algorithmConfiguration",
            ),
            parameters: algoConfigData.parameters || {},
            outOfSampleMaxEndDate: algoConfigData.outOfSampleMaxEndDate,
            outOfSampleDays: algoConfigData.outOfSampleDays || 0,
            startDate: validateRequired<string>(
                algoConfigData.startDate,
                "startDate",
                "algorithmConfiguration",
            ),
            endDate: validateRequired<string>(
                algoConfigData.endDate,
                "endDate",
                "algorithmConfiguration",
            ),
            tradingDaysPerYear: algoConfigData.tradingDaysPerYear || 252,
        };
    }

    // Extract data requests (ensure they're arrays)
    const succeededDataRequests: DataRequest[] = Array.isArray(params.succeededDataRequests)
        ? params.succeededDataRequests
        : [];

    const failedDataRequests: DataRequest[] = Array.isArray(params.failedDataRequests)
        ? params.failedDataRequests
        : [];

    // Extract optional rolling window data
    let rollingWindow: RollingWindow | undefined;
    if (params.rollingWindow) {
        const rollingWindowData = validateObject(
            params.rollingWindow,
            "rollingWindow",
            "backtest parameters",
        );
        rollingWindow = {
            // The backend sends rolling window data as a dictionary of objects
            // where each key is a window name and the value is the window data.
            // We just pass this through as-is.
            windowData: rollingWindowData || {},
        };
    }

    // Extract charts data (can be empty object)
    const charts: Record<string, any> = params.charts || {};

    // Create the LeanBacktest object
    const leanBacktest: LeanBacktest = {
        id: backtest.id,
        strategy_id: backtest.strategy_id,
        name: backtest.name,
        description: backtest.description,
        starting_date: backtest.starting_date,
        ending_date: backtest.ending_date,
        engine: backtest.engine,
        created_at: backtest.created_at,
        updated_at: backtest.updated_at,
        totalPerformance,
        statistics,
        runtimeStatistics,
        state,
        algorithmConfiguration,
        succeededDataRequests,
        failedDataRequests,
        rollingWindow,
        charts,
    };

    return leanBacktest;
}

/**
 * Validates if a backtest response has the required structure for Lean backtests
 * @param backtest - The backtest to validate
 * @returns boolean indicating if the backtest is a valid Lean backtest
 */
export function isValidLeanBacktest(backtest: Backtest): boolean {
    try {
        serializeToLeanBacktest(backtest);
        return true;
    } catch (error) {
        if (error instanceof BacktestSerializationError) {
            return false;
        }
        // Re-throw non-serialization errors
        throw error;
    }
}

/**
 * Safely attempts to serialize a backtest to LeanBacktest, returning null if it fails
 * @param backtest - The backtest to serialize
 * @returns LeanBacktest or null if serialization fails
 */
export function trySerializeToLeanBacktest(backtest: Backtest): LeanBacktest | null {
    try {
        return serializeToLeanBacktest(backtest);
    } catch (error) {
        if (error instanceof BacktestSerializationError) {
            console.warn(`Failed to serialize backtest ${backtest.id}:`, error.message);
            return null;
        }
        // Re-throw non-serialization errors
        throw error;
    }
}
