import BacktestEngine from "./backtest-engine";

interface Backtest {
  id: number; // Primary key as integer
  name: string; // Backtest name
  description: string; // Backtest description
  starting_date: string; // ISO date string for start date
  ending_date: string; // ISO date string for end date
  strategy_id: number; // Foreign key for strategy
  engine: BacktestEngine; // Enum for engine status
  parameters: Record<string, unknown>; // JSON type for parameters
  created_at: string; // ISO date string for when the backtest was created
  updated_at: string; // ISO date string for when the backtest was last updated
}

export default Backtest;
