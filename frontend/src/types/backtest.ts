import BacktestEngine from "./backtest-engine";

interface Backtest {
  id: number; // Primary key as integer
  name: string; // Backtest name
  description: string; // Backtest description
  starting_date: string; // ISO date string for start date
  ending_date: string; // ISO date string for end date
  strategy_id: number; // Foreign key for strategy
  engine: BacktestEngine; // Enum for engine status
  parameters: Record<string, any>; // JSON type for parameters
}

export default Backtest;
