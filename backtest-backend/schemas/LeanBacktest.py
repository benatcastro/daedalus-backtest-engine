"""
Lean-specific backtest Pydantic models for FastAPI integration.

This module provides comprehensive Pydantic models for Lean backtests with
automatic validation, serialization, and FastAPI integration.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from decimal import Decimal
from pathlib import Path
from pydantic import BaseModel, Field, field_validator, model_validator
from models import Backtest


class TradeStatistics(BaseModel):
    """Trade statistics from Lean backtest results."""

    start_datetime: datetime = Field(
        ...,
        alias="startDateTime",
        description="Start date and time of the trading period",
    )
    end_datetime: datetime = Field(
        ..., alias="endDateTime", description="End date and time of the trading period"
    )
    total_number_of_trades: int = Field(
        ...,
        alias="totalNumberOfTrades",
        ge=0,
        description="Total number of trades executed",
    )
    number_of_winning_trades: int = Field(
        ...,
        alias="numberOfWinningTrades",
        ge=0,
        description="Number of profitable trades",
    )
    number_of_losing_trades: int = Field(
        ..., alias="numberOfLosingTrades", ge=0, description="Number of losing trades"
    )
    total_profit_loss: Decimal = Field(
        ..., alias="totalProfitLoss", description="Total profit/loss amount"
    )
    total_profit: Decimal = Field(
        ..., alias="totalProfit", ge=0, description="Total profit from winning trades"
    )
    total_loss: Decimal = Field(
        ..., alias="totalLoss", le=0, description="Total loss from losing trades"
    )
    largest_profit: Decimal = Field(
        ..., alias="largestProfit", description="Largest single trade profit"
    )
    largest_loss: Decimal = Field(
        ..., alias="largestLoss", description="Largest single trade loss"
    )
    average_profit_loss: Decimal = Field(
        ..., alias="averageProfitLoss", description="Average profit/loss per trade"
    )
    average_profit: Decimal = Field(
        ..., alias="averageProfit", description="Average profit per winning trade"
    )
    average_loss: Decimal = Field(
        ..., alias="averageLoss", description="Average loss per losing trade"
    )
    average_trade_duration: str = Field(
        ..., alias="averageTradeDuration", description="Average duration of all trades"
    )
    average_winning_trade_duration: str = Field(
        ...,
        alias="averageWinningTradeDuration",
        description="Average duration of winning trades",
    )
    average_losing_trade_duration: str = Field(
        ...,
        alias="averageLosingTradeDuration",
        description="Average duration of losing trades",
    )
    median_trade_duration: str = Field(
        ..., alias="medianTradeDuration", description="Median duration of all trades"
    )
    median_winning_trade_duration: str = Field(
        ...,
        alias="medianWinningTradeDuration",
        description="Median duration of winning trades",
    )
    median_losing_trade_duration: str = Field(
        ...,
        alias="medianLosingTradeDuration",
        description="Median duration of losing trades",
    )
    max_consecutive_winning_trades: int = Field(
        ...,
        alias="maxConsecutiveWinningTrades",
        ge=0,
        description="Maximum consecutive winning trades",
    )
    max_consecutive_losing_trades: int = Field(
        ...,
        alias="maxConsecutiveLosingTrades",
        ge=0,
        description="Maximum consecutive losing trades",
    )
    profit_loss_ratio: Decimal = Field(
        ...,
        alias="profitLossRatio",
        description="Ratio of average profit to average loss",
    )
    win_loss_ratio: Decimal = Field(
        ...,
        alias="winLossRatio",
        description="Ratio of winning trades to losing trades",
    )
    win_rate: Decimal = Field(
        ..., alias="winRate", ge=0, le=1, description="Percentage of winning trades"
    )
    loss_rate: Decimal = Field(
        ..., alias="lossRate", ge=0, le=1, description="Percentage of losing trades"
    )
    average_mae: Decimal = Field(
        ..., alias="averageMAE", description="Average Maximum Adverse Excursion"
    )
    average_mfe: Decimal = Field(
        ..., alias="averageMFE", description="Average Maximum Favorable Excursion"
    )
    largest_mae: Decimal = Field(
        ..., alias="largestMAE", description="Largest Maximum Adverse Excursion"
    )
    largest_mfe: Decimal = Field(
        ..., alias="largestMFE", description="Largest Maximum Favorable Excursion"
    )
    maximum_closed_trade_drawdown: Decimal = Field(
        ...,
        alias="maximumClosedTradeDrawdown",
        description="Maximum drawdown from closed trades",
    )
    maximum_intra_trade_drawdown: Decimal = Field(
        ...,
        alias="maximumIntraTradeDrawdown",
        description="Maximum intra-trade drawdown",
    )
    profit_loss_standard_deviation: Decimal = Field(
        ...,
        alias="profitLossStandardDeviation",
        description="Standard deviation of profit/loss",
    )
    profit_loss_downside_deviation: Decimal = Field(
        ...,
        alias="profitLossDownsideDeviation",
        description="Downside deviation of profit/loss",
    )
    profit_factor: Decimal = Field(
        ..., alias="profitFactor", description="Ratio of gross profit to gross loss"
    )
    sharpe_ratio: Decimal = Field(
        ..., alias="sharpeRatio", description="Risk-adjusted return measure"
    )
    sortino_ratio: Decimal = Field(
        ..., alias="sortinoRatio", description="Downside risk-adjusted return measure"
    )
    profit_to_max_drawdown_ratio: Decimal = Field(
        ...,
        alias="profitToMaxDrawdownRatio",
        description="Ratio of profit to maximum drawdown",
    )
    maximum_end_trade_drawdown: Decimal = Field(
        ...,
        alias="maximumEndTradeDrawdown",
        description="Maximum end-of-trade drawdown",
    )
    average_end_trade_drawdown: Decimal = Field(
        ...,
        alias="averageEndTradeDrawdown",
        description="Average end-of-trade drawdown",
    )
    maximum_drawdown_duration: str = Field(
        ...,
        alias="maximumDrawdownDuration",
        description="Duration of maximum drawdown period",
    )
    total_fees: Decimal = Field(
        ..., alias="totalFees", ge=0, description="Total fees paid during trading"
    )

    @field_validator("start_datetime", "end_datetime", mode="before")
    @classmethod
    def parse_datetime(cls, v):
        """Parse datetime strings with timezone handling."""
        if isinstance(v, str):
            # Handle ISO format with Z timezone
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        return v

    @model_validator(mode="after")
    def validate_trades(self):
        """Validate trade statistics consistency."""
        total_trades = self.total_number_of_trades
        winning_trades = self.number_of_winning_trades
        losing_trades = self.number_of_losing_trades

        if total_trades != winning_trades + losing_trades:
            raise ValueError(
                "Total trades must equal winning trades plus losing trades"
            )

        return self

    class Config:
        populate_by_name = True  # Allow using both alias and field name
        json_encoders = {
            Decimal: str,  # Serialize Decimal as string to avoid precision loss
            datetime: lambda v: v.isoformat(),
        }
        schema_extra = {
            "example": {
                "startDateTime": "2024-01-01T00:00:00+00:00",
                "endDateTime": "2024-12-31T23:59:59+00:00",
                "totalNumberOfTrades": 100,
                "numberOfWinningTrades": 60,
                "numberOfLosingTrades": 40,
                "totalProfitLoss": "15000.00",
                "winRate": "0.60",
                "lossRate": "0.40",
            }
        }


class PortfolioStatistics(BaseModel):
    """Portfolio statistics from Lean backtest results."""

    average_win_rate: Decimal = Field(
        ..., alias="averageWinRate", description="Average rate of winning trades"
    )
    average_loss_rate: Decimal = Field(
        ..., alias="averageLossRate", description="Average rate of losing trades"
    )
    profit_loss_ratio: Decimal = Field(
        ..., alias="profitLossRatio", description="Ratio of profits to losses"
    )
    win_rate: Decimal = Field(
        ..., alias="winRate", ge=0, le=1, description="Overall win rate"
    )
    loss_rate: Decimal = Field(
        ..., alias="lossRate", ge=0, le=1, description="Overall loss rate"
    )
    expectancy: Decimal = Field(
        ..., alias="expectancy", description="Expected value per trade"
    )
    start_equity: Decimal = Field(
        ..., alias="startEquity", gt=0, description="Starting portfolio equity"
    )
    end_equity: Decimal = Field(
        ..., alias="endEquity", gt=0, description="Ending portfolio equity"
    )
    compounding_annual_return: Decimal = Field(
        ...,
        alias="compoundingAnnualReturn",
        description="Annualized compounding return",
    )
    drawdown: Decimal = Field(
        ..., alias="drawdown", description="Maximum drawdown percentage"
    )
    total_net_profit: Decimal = Field(
        ..., alias="totalNetProfit", description="Total net profit/loss"
    )
    sharpe_ratio: Decimal = Field(
        ..., alias="sharpeRatio", description="Risk-adjusted return measure"
    )
    probabilistic_sharpe_ratio: Decimal = Field(
        ..., alias="probabilisticSharpeRatio", description="Probabilistic Sharpe ratio"
    )
    sortino_ratio: Decimal = Field(
        ..., alias="sortinoRatio", description="Downside risk-adjusted return"
    )
    alpha: Decimal = Field(..., alias="alpha", description="Alpha coefficient")
    beta: Decimal = Field(..., alias="beta", description="Beta coefficient")
    annual_standard_deviation: Decimal = Field(
        ..., alias="annualStandardDeviation", description="Annual volatility"
    )
    annual_variance: Decimal = Field(
        ..., alias="annualVariance", description="Annual variance"
    )
    information_ratio: Decimal = Field(
        ..., alias="informationRatio", description="Information ratio"
    )
    tracking_error: Decimal = Field(
        ..., alias="trackingError", description="Tracking error"
    )
    treynor_ratio: Decimal = Field(
        ..., alias="treynorRatio", description="Treynor ratio"
    )
    portfolio_turnover: Decimal = Field(
        ..., alias="portfolioTurnover", description="Portfolio turnover rate"
    )
    value_at_risk_99: Decimal = Field(
        ..., alias="valueAtRisk99", description="Value at Risk (99% confidence)"
    )
    value_at_risk_95: Decimal = Field(
        ..., alias="valueAtRisk95", description="Value at Risk (95% confidence)"
    )

    class Config:
        json_encoders = {
            Decimal: str,
        }


class RuntimeStatistics(BaseModel):
    """Runtime statistics from Lean backtest results."""

    equity: str = Field(..., alias="Equity", description="Final equity value")
    fees: str = Field(..., alias="Fees", description="Total fees paid")
    holdings: str = Field(..., alias="Holdings", description="Current holdings value")
    net_profit: str = Field(..., alias="NetProfit", description="Net profit achieved")
    probabilistic_sharpe_ratio: str = Field(
        ..., alias="ProbabilisticSharpeRatio", description="Probabilistic Sharpe ratio"
    )
    return_percentage: str = Field(
        ..., alias="ReturnPercentage", description="Total return percentage"
    )
    unrealized: str = Field(
        ..., alias="Unrealized", description="Unrealized profit/loss"
    )
    volume: str = Field(..., alias="Volume", description="Total trading volume")

    class Config:
        schema_extra = {
            "example": {
                "equity": "115000.00",
                "fees": "250.00",
                "holdings": "0.00",
                "net_profit": "15000.00",
                "return_percentage": "15.00%",
                "volume": "1000000.00",
            }
        }


class BacktestState(BaseModel):
    """Backtest execution state information."""

    start_time: str = Field(..., alias="StartTime", description="Backtest start time")
    end_time: str = Field(..., alias="EndTime", description="Backtest end time")
    runtime_error: str = Field(
        ..., alias="RuntimeError", description="Runtime error message if any"
    )
    stack_trace: str = Field(
        ..., alias="StackTrace", description="Error stack trace if any"
    )
    log_count: str = Field(..., alias="LogCount", description="Number of log entries")
    order_count: str = Field(
        ..., alias="OrderCount", description="Number of orders placed"
    )
    insight_count: str = Field(
        ..., alias="InsightCount", description="Number of insights generated"
    )
    name: str = Field(..., alias="Name", description="Backtest name")
    hostname: str = Field(..., alias="Hostname", description="Execution hostname")
    status: str = Field(..., alias="Status", description="Execution status")

    class Config:
        populate_by_name = True  # Allow using both alias and field name
        schema_extra = {
            "example": {
                "StartTime": "2024-01-01 00:00:00",
                "EndTime": "2024-01-01 23:59:59",
                "RuntimeError": "",
                "StackTrace": "",
                "Status": "Completed",
            }
        }


class AlgorithmConfiguration(BaseModel):
    """Algorithm configuration from Lean backtest."""

    name: str = Field(..., alias="name", description="Algorithm name")
    tags: List[str] = Field(
        default_factory=list, alias="tags", description="Algorithm tags"
    )
    account_currency: str = Field(
        ..., alias="accountCurrency", description="Base account currency"
    )
    brokerage: int = Field(..., alias="brokerage", description="Brokerage ID")
    account_type: int = Field(..., alias="accountType", description="Account type ID")
    parameters: Dict[str, Any] = Field(
        default_factory=dict, alias="parameters", description="Algorithm parameters"
    )
    out_of_sample_max_end_date: Optional[str] = Field(
        None, alias="outOfSampleMaxEndDate", description="Out-of-sample max end date"
    )
    out_of_sample_days: int = Field(
        default=0,
        alias="outOfSampleDays",
        ge=0,
        description="Number of out-of-sample days",
    )
    start_date: str = Field(..., alias="startDate", description="Algorithm start date")
    end_date: str = Field(..., alias="endDate", description="Algorithm end date")
    trading_days_per_year: int = Field(
        default=252,
        alias="tradingDaysPerYear",
        gt=0,
        description="Trading days per year",
    )

    class Config:
        schema_extra = {
            "example": {
                "name": "My Trading Algorithm",
                "tags": ["momentum", "equity"],
                "account_currency": "USD",
                "brokerage": 1,
                "account_type": 1,
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "trading_days_per_year": 252,
            }
        }


class DataRequest(BaseModel):
    """Data request information from Lean backtest."""

    security_type: str = Field(
        ..., description="Type of security (e.g., crypto, equity)"
    )
    market: str = Field(..., description="Market identifier (e.g., binance, nasdaq)")
    resolution: str = Field(
        ..., description="Data resolution (e.g., minute, hour, daily)"
    )
    symbol: str = Field(..., description="Trading symbol")
    date: datetime = Field(..., description="Date of the data request")
    data_type: str = Field(..., description="Type of data (e.g., trade, quote)")
    path: Path = Field(..., description="File path to the data")

    @field_validator("path", mode="before")
    @classmethod
    def convert_path_to_string(cls, v):
        """Convert Path objects to strings."""
        if isinstance(v, Path):
            return str(v)
        return v

    @classmethod
    def from_path(cls, path: str | Path) -> Optional["DataRequest"]:
        """Create DataRequest from file path."""
        p = Path(path)
        parts = p.parts
        # Remove root '/' if present
        parts = parts[1:] if parts[0] == "/" else parts

        if len(parts) != 5:
            return None

        filename = p.name  # e.g. '20241007_trade.zip'
        name_without_ext = filename.replace(".zip", "")  # '20241007_trade'

        try:
            date_str, data_type = name_without_ext.split("_")
            date = datetime.strptime(date_str, "%Y%m%d")
        except ValueError:
            return None

        return cls(
            security_type=parts[0],  # 'crypto'
            market=parts[1],  # 'binance'
            resolution=parts[2],  # 'minute'
            symbol=parts[3],  # e.g. 'ethusdt'
            date=date,  # parsed datetime
            data_type=data_type,  # 'trade' or 'quote'
            path=Path(*parts),
        )

    def to_dict(self) -> dict:
        """Convert DataRequest attributes to a dictionary."""
        return {
            "security_type": self.security_type,
            "market": self.market,
            "resolution": self.resolution,
            "symbol": self.symbol,
            "date": self.date.isoformat(),
            "data_type": self.data_type,
            "path": str(self.path),
        }

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
        schema_extra = {
            "example": {
                "security_type": "crypto",
                "market": "binance",
                "resolution": "minute",
                "symbol": "ethusdt",
                "date": "2024-10-07T00:00:00",
                "data_type": "trade",
                "path": "/crypto/binance/minute/ethusdt/20241007_trade.zip",
            }
        }


class LeanBacktest(BaseModel):
    """
    Complete Lean backtest data model for FastAPI integration.

    This class represents a comprehensive view of a Lean backtest including
    all statistics, configuration, and metadata with automatic validation
    and serialization.
    """

    # Core identifiers
    id: Optional[int] = Field(None, description="Unique backtest identifier")
    strategy_id: int = Field(..., description="Associated strategy ID")
    name: str = Field(..., min_length=1, max_length=255, description="Backtest name")
    description: str = Field(..., description="Backtest description")

    # Time bounds
    starting_date: datetime = Field(..., description="Backtest start date and time")
    ending_date: datetime = Field(..., description="Backtest end date and time")

    # Engine type
    engine: str = Field(default="LEAN", description="Backtest engine used")

    # Statistics
    trade_statistics: Optional[TradeStatistics] = Field(
        None, description="Trade performance statistics"
    )
    portfolio_statistics: Optional[PortfolioStatistics] = Field(
        None, description="Portfolio performance statistics"
    )
    runtime_statistics: Optional[RuntimeStatistics] = Field(
        None, description="Runtime execution statistics"
    )

    # Configuration and state
    algorithm_configuration: Optional[AlgorithmConfiguration] = Field(
        None, description="Algorithm configuration"
    )
    state: Optional[BacktestState] = Field(None, description="Backtest execution state")

    # General statistics (key-value pairs from the statistics section)
    general_statistics: Dict[str, str] = Field(
        default_factory=dict, description="General statistics"
    )

    # Data requests
    succeeded_data_requests: List[DataRequest] = Field(
        default_factory=list, description="Successfully processed data requests"
    )
    failed_data_requests: List[DataRequest] = Field(
        default_factory=list, description="Failed data requests"
    )

    # Rolling window data (currently empty in sample but can be extended)
    rolling_window: Dict[str, Any] = Field(
        default_factory=dict, description="Rolling window data"
    )

    # Charts data (for visualization)
    charts: Dict[str, Any] = Field(
        default_factory=dict, description="Chart data for visualization"
    )

    @model_validator(mode="after")
    def validate_dates(self):
        """Validate that ending_date is after starting_date."""
        if (
            self.starting_date
            and self.ending_date
            and self.ending_date <= self.starting_date
        ):
            raise ValueError("ending_date must be after starting_date")

        return self

    @classmethod
    def from_backtest_model(cls, backtest_model: Backtest) -> "LeanBacktest":
        """
        Create LeanBacktest from SQLAlchemy Backtest model instance.

        Args:
            backtest_model: SQLAlchemy Backtest model instance from database query

        Returns:
            LeanBacktest instance with data extracted from the model
        """
        # Extract parameters (which contains all the processed data)
        parameters = backtest_model.parameters or {}

        # Helper function to safely create nested models
        def safe_create_model(model_class, data):
            """Safely create a Pydantic model from dictionary data."""
            if not data:
                return None
            try:
                return model_class(**data)
            except Exception as e:
                # Log the error in a real application
                print(f"Warning: Failed to create {model_class.__name__}: {e}")
                return None

        # Helper function to safely create DataRequest list
        def safe_create_data_requests(data_list):
            """Safely create a list of DataRequest instances."""
            if not data_list:
                return []
            result = []
            for item in data_list:
                try:
                    if isinstance(item, dict):
                        result.append(DataRequest(**item))
                    elif hasattr(
                        item, "to_dict"
                    ):  # If it's already a DataRequest-like object
                        result.append(DataRequest(**item.to_dict()))
                    else:
                        result.append(item)  # Assume it's already a DataRequest
                except Exception as e:
                    print(f"Warning: Failed to create DataRequest from {item}: {e}")
                    continue
            return result

        return cls(
            id=backtest_model.id,
            strategy_id=backtest_model.strategy_id,
            name=backtest_model.name,
            description=backtest_model.description or "",
            starting_date=backtest_model.starting_date,
            ending_date=backtest_model.ending_date,
            engine=backtest_model.engine.value if backtest_model.engine else "LEAN",
            # Extract nested statistics from parameters with validation
            trade_statistics=safe_create_model(
                TradeStatistics, parameters.get("trade_statistics")
            ),
            portfolio_statistics=safe_create_model(
                PortfolioStatistics, parameters.get("portfolio_statistics")
            ),
            runtime_statistics=safe_create_model(
                RuntimeStatistics, parameters.get("runtime_statistics")
            ),
            algorithm_configuration=safe_create_model(
                AlgorithmConfiguration, parameters.get("algorithm_configuration")
            ),
            state=safe_create_model(BacktestState, parameters.get("state")),
            # Other data with defaults
            general_statistics=parameters.get("general_statistics", {}),
            succeeded_data_requests=safe_create_data_requests(
                parameters.get("succeeded_data_requests", [])
            ),
            failed_data_requests=safe_create_data_requests(
                parameters.get("failed_data_requests", [])
            ),
            rolling_window=parameters.get("rolling_window", {}),
            charts=parameters.get("charts", {}),
        )

    class Config:
        json_encoders = {
            Decimal: str,
            datetime: lambda v: v.isoformat(),
        }
        schema_extra = {
            "example": {
                "id": 1,
                "strategy_id": 1,
                "name": "Momentum Strategy Backtest",
                "description": "Testing momentum strategy with ETH/USD",
                "starting_date": "2024-01-01T00:00:00Z",
                "ending_date": "2024-12-31T23:59:59Z",
                "engine": "LEAN",
            }
        }
