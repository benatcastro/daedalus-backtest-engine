interface Backtest {
  id: number;                      // Primary key as integer
  engine: 'LEAN' | 'BACKTESTING';   // Enum for engine status, assuming the values are 'LEAN' or 'BACKTESTING'
  strategy_id: number;              // Foreign key for strategy
  parameters: Record<string, any>;  // JSON type for parameters, use Record to represent an object with string keys and any values
}

export default Backtest;
