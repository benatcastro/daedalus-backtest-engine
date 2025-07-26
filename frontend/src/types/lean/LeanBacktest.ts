// TypeScript interfaces for Lean Backtest results
// Corresponds to the Python Pydantic schemas in backtest-backend/src/backtest/lean/schemas.py

import Backtest from "@/types/backtest";

// Trade Statistics Interface
export interface TradeStatistics {
    startDatetime: string;
    endDatetime: string;
    totalNumberOfTrades: number;
    numberOfWinningTrades: number;
    numberOfLosingTrades: number;
    totalProfitLoss: string;
    totalProfit: string;
    totalLoss: string;
    largestProfit: string;
    largestLoss: string;
    averageProfitLoss: string;
    averageProfit: string;
    averageLoss: string;
    averageTradeDuration: string;
    averageWinningTradeDuration: string;
    averageLosingTradeDuration: string;
    medianTradeDuration: string;
    medianWinningTradeDuration: string;
    medianLosingTradeDuration: string;
    maxConsecutiveWinningTrades: number;
    maxConsecutiveLosingTrades: number;
    profitLossRatio: string;
    winLossRatio: string;
    winRate: string;
    lossRate: string;
    averageMae: string;
    averageMfe: string;
    largestMae: string;
    largestMfe: string;
    maximumClosedTradeDrawdown: string;
    maximumIntraTradeDrawdown: string;
    profitLossStandardDeviation: string;
    profitLossDownsideDeviation: string;
    profitFactor: string;
    sharpeRatio: string;
    sortinoRatio: string;
    profitToMaxDrawdownRatio: string;
    maximumEndTradeDrawdown: string;
    averageEndTradeDrawdown: string;
    maximumDrawdownDuration: string;
    totalFees: string;
}

// Portfolio Statistics Interface
export interface PortfolioStatistics {
    averageWinRate: string;
    averageLossRate: string;
    profitLossRatio: string;
    winRate: string;
    lossRate: string;
    expectancy: string;
    startEquity: string;
    endEquity: string;
    compoundingAnnualReturn: string;
    drawdown: string;
    totalNetProfit: string;
    sharpeRatio: string;
    probabilisticSharpeRatio: string;
    sortinoRatio: string;
    alpha: string;
    beta: string;
    annualStandardDeviation: string;
    annualVariance: string;
    informationRatio: string;
    trackingError: string;
    treynorRatio: string;
    portfolioTurnover: string;
    valueAtRisk99: string;
    valueAtRisk95: string;
}

// Runtime Statistics Interface
export interface RuntimeStatistics {
    equity: string;
    fees: string;
    holdings: string;
    netProfit: string;
    probabilisticSharpeRatio: string;
    returnPercentage: string;
    unrealized: string;
    volume: string;
}

// State Interface
export interface State {
    startTime: string;
    endTime: string;
    runtimeError: string;
    stackTrace: string;
    logCount: string;
    orderCount: string;
    insightCount: string;
    name: string;
    hostname: string;
    status: string;
}

// Algorithm Configuration Interface
export interface AlgorithmConfiguration {
    name: string;
    tags: string[];
    accountCurrency: string;
    brokerage: number;
    accountType: number;
    parameters: Record<string, any>;
    outOfSampleMaxEndDate: string | null;
    outOfSampleDays: number;
    startDate: string;
    endDate: string;
    tradingDaysPerYear: number;
}

// Data Request Interface
export interface DataRequest {
    // Based on the sample, this is an empty array.
    // Define a structure if the shape is known, otherwise use `any`.
    [key: string]: any;
}

// Symbol Info Interface
export interface SymbolInfo {
    value: string;
    id: string;
    permtick: string;
}

// Closed Trade Interface
export interface ClosedTrade {
    symbol: SymbolInfo;
    entryTime: string;
    entryPrice: string;
    direction: number;
    quantity: string;
    exitTime: string;
    exitPrice: string;
    profitLoss: string;
    totalFees: string;
    mae: string;
    mfe: string;
    duration: string;
    endTradeDrawdown: string;
    isWin: boolean;
}

// Rolling Window Section Interface
export interface RollingWindowSection {
    tradeStatistics: TradeStatistics;
    portfolioStatistics: PortfolioStatistics;
    closedTrades: ClosedTrade[];
}

// Rolling Window Interface
export interface RollingWindow {
    [key: string]: RollingWindowSection;
}

// Unified Statistics Interface
export interface Statistics {
    totalOrders: number;
    compoundingAnnualReturn: string;
    drawdown: string;
    expectancy: string;
    startEquity: string;
    endEquity: string;
    netProfit: string;
    sharpeRatio: string;
    sortinoRatio: string;
    probabilisticSharpeRatio: string;
    lossRate: string;
    winRate: string;
    profitLossRatio: string;
    averageWin: string;
    averageLoss: string;
    alpha: string;
    beta: string;
    annualStandardDeviation: string;
    annualVariance: string;
    informationRatio: string;
    trackingError: string;
    treynorRatio: string;
    totalFees: string;
    estimatedStrategyCapacity: string;
    lowestCapacityAsset: string;
    portfolioTurnover: string;
}

// Total Performance Interface
export interface TotalPerformance {
    tradeStatistics: TradeStatistics;
    portfolioStatistics: PortfolioStatistics;
    closedTrades: ClosedTrade[];
}

// Main LeanBacktest Interface
export interface LeanBacktest extends Omit<Backtest, "parameters"> {
    totalPerformance: TotalPerformance;
    statistics: Statistics;
    runtimeStatistics: RuntimeStatistics;
    state: State;
    algorithmConfiguration?: AlgorithmConfiguration;
    succeededDataRequests: DataRequest[];
    failedDataRequests: DataRequest[];
    rollingWindow: RollingWindow;
    charts: Record<string, any>;
}

export default LeanBacktest;
