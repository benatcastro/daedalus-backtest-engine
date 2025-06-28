"""
Lean-specific backtest Pydantic models for FastAPI integration.

This module provides comprehensive Pydantic models for Lean backtests with
automatic validation, serialization, and FastAPI integration.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from decimal import Decimal
from pathlib import Path
from pydantic import (
    BaseModel,
    Field,
    field_serializer,
    field_validator,
    model_validator,
    ConfigDict,
)
from backtest.models import BacktestModel


class TradeStatistics(BaseModel):
    """Trade statistics from Lean backtest results."""

    start_datetime: datetime = Field(..., alias="startDateTime")
    end_datetime: datetime = Field(..., alias="endDateTime")
    total_number_of_trades: int = Field(..., alias="totalNumberOfTrades", ge=0)
    number_of_winning_trades: int = Field(..., alias="numberOfWinningTrades", ge=0)
    number_of_losing_trades: int = Field(..., alias="numberOfLosingTrades", ge=0)
    total_profit_loss: Decimal = Field(..., alias="totalProfitLoss")
    total_profit: Decimal = Field(..., alias="totalProfit", ge=0)
    total_loss: Decimal = Field(..., alias="totalLoss", le=0)
    largest_profit: Decimal = Field(..., alias="largestProfit")
    largest_loss: Decimal = Field(..., alias="largestLoss")
    average_profit_loss: Decimal = Field(..., alias="averageProfitLoss")
    average_profit: Decimal = Field(..., alias="averageProfit")
    average_loss: Decimal = Field(..., alias="averageLoss")
    average_trade_duration: str = Field(..., alias="averageTradeDuration")
    average_winning_trade_duration: str = Field(
        ..., alias="averageWinningTradeDuration"
    )
    average_losing_trade_duration: str = Field(..., alias="averageLosingTradeDuration")
    median_trade_duration: str = Field(..., alias="medianTradeDuration")
    median_winning_trade_duration: str = Field(..., alias="medianWinningTradeDuration")
    median_losing_trade_duration: str = Field(..., alias="medianLosingTradeDuration")
    max_consecutive_winning_trades: int = Field(
        ..., alias="maxConsecutiveWinningTrades", ge=0
    )
    max_consecutive_losing_trades: int = Field(
        ..., alias="maxConsecutiveLosingTrades", ge=0
    )
    profit_loss_ratio: Decimal = Field(..., alias="profitLossRatio")
    win_loss_ratio: Decimal = Field(..., alias="winLossRatio")
    win_rate: Decimal = Field(..., alias="winRate", ge=0, le=1)
    loss_rate: Decimal = Field(..., alias="lossRate", ge=0, le=1)
    average_mae: Decimal = Field(..., alias="averageMAE")
    average_mfe: Decimal = Field(..., alias="averageMFE")
    largest_mae: Decimal = Field(..., alias="largestMAE")
    largest_mfe: Decimal = Field(..., alias="largestMFE")
    maximum_closed_trade_drawdown: Decimal = Field(
        ..., alias="maximumClosedTradeDrawdown"
    )
    maximum_intra_trade_drawdown: Decimal = Field(
        ..., alias="maximumIntraTradeDrawdown"
    )
    profit_loss_standard_deviation: Decimal = Field(
        ..., alias="profitLossStandardDeviation"
    )
    profit_loss_downside_deviation: Decimal = Field(
        ..., alias="profitLossDownsideDeviation"
    )
    profit_factor: Decimal = Field(..., alias="profitFactor")
    sharpe_ratio: Decimal = Field(..., alias="sharpeRatio")
    sortino_ratio: Decimal = Field(..., alias="sortinoRatio")
    profit_to_max_drawdown_ratio: Decimal = Field(..., alias="profitToMaxDrawdownRatio")
    maximum_end_trade_drawdown: Decimal = Field(..., alias="maximumEndTradeDrawdown")
    average_end_trade_drawdown: Decimal = Field(..., alias="averageEndTradeDrawdown")
    maximum_drawdown_duration: str = Field(..., alias="maximumDrawdownDuration")
    total_fees: Decimal = Field(..., alias="totalFees", ge=0)

    # --- Validators ---
    @field_validator("start_datetime", "end_datetime", mode="before")
    @classmethod
    def parse_datetime(cls, v):
        if isinstance(v, str):
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        return v

    @model_validator(mode="after")
    def validate_trades(self):
        if (
            self.total_number_of_trades
            != self.number_of_winning_trades + self.number_of_losing_trades
        ):
            raise ValueError("Total trades must equal winning + losing trades")
        return self

    # --- Serializers ---
    @field_serializer("start_datetime", "end_datetime")
    def serialize_datetime(self, v: datetime) -> str:
        return v.isoformat()

    @field_serializer(
        "total_profit_loss",
        "total_profit",
        "total_loss",
        "largest_profit",
        "largest_loss",
        "average_profit_loss",
        "average_profit",
        "average_loss",
        "profit_loss_ratio",
        "win_loss_ratio",
        "win_rate",
        "loss_rate",
        "average_mae",
        "average_mfe",
        "largest_mae",
        "largest_mfe",
        "maximum_closed_trade_drawdown",
        "maximum_intra_trade_drawdown",
        "profit_loss_standard_deviation",
        "profit_loss_downside_deviation",
        "profit_factor",
        "sharpe_ratio",
        "sortino_ratio",
        "profit_to_max_drawdown_ratio",
        "maximum_end_trade_drawdown",
        "average_end_trade_drawdown",
        "total_fees",
    )
    def serialize_decimal(self, v: Decimal) -> str:
        return str(v)

    # --- Config ---
    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
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
        },
    )


class PortfolioStatistics(BaseModel):
    """Portfolio statistics from Lean backtest results for quantitative analysis."""

    average_win_rate: Decimal = Field(..., alias="averageWinRate")
    average_loss_rate: Decimal = Field(..., alias="averageLossRate")
    profit_loss_ratio: Decimal = Field(..., alias="profitLossRatio")
    win_rate: Decimal = Field(..., alias="winRate", ge=0, le=1)
    loss_rate: Decimal = Field(..., alias="lossRate", ge=0, le=1)
    expectancy: Decimal = Field(..., alias="expectancy")
    start_equity: Decimal = Field(..., alias="startEquity", gt=0)
    end_equity: Decimal = Field(..., alias="endEquity", gt=0)
    compounding_annual_return: Decimal = Field(..., alias="compoundingAnnualReturn")
    drawdown: Decimal = Field(..., alias="drawdown")
    total_net_profit: Decimal = Field(..., alias="totalNetProfit")
    sharpe_ratio: Decimal = Field(..., alias="sharpeRatio")
    probabilistic_sharpe_ratio: Decimal = Field(..., alias="probabilisticSharpeRatio")
    sortino_ratio: Decimal = Field(..., alias="sortinoRatio")
    alpha: Decimal = Field(..., alias="alpha")
    beta: Decimal = Field(..., alias="beta")
    annual_standard_deviation: Decimal = Field(..., alias="annualStandardDeviation")
    annual_variance: Decimal = Field(..., alias="annualVariance")
    information_ratio: Decimal = Field(..., alias="informationRatio")
    tracking_error: Decimal = Field(..., alias="trackingError")
    treynor_ratio: Decimal = Field(..., alias="treynorRatio")
    portfolio_turnover: Decimal = Field(..., alias="portfolioTurnover")
    value_at_risk_99: Decimal = Field(..., alias="valueAtRisk99")
    value_at_risk_95: Decimal = Field(..., alias="valueAtRisk95")

    @field_serializer(
        "average_win_rate",
        "average_loss_rate",
        "profit_loss_ratio",
        "win_rate",
        "loss_rate",
        "expectancy",
        "start_equity",
        "end_equity",
        "compounding_annual_return",
        "drawdown",
        "total_net_profit",
        "sharpe_ratio",
        "probabilistic_sharpe_ratio",
        "sortino_ratio",
        "alpha",
        "beta",
        "annual_standard_deviation",
        "annual_variance",
        "information_ratio",
        "tracking_error",
        "treynor_ratio",
        "portfolio_turnover",
        "value_at_risk_99",
        "value_at_risk_95",
    )
    def serialize_decimal(self, value: Decimal) -> str:
        """Serialize Decimal values to strings for precision preservation in API responses."""
        return str(value)

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "averageWinRate": "0.65",
                "averageLossRate": "0.35",
                "winRate": "0.60",
                "sharpeRatio": "1.45",
                "totalNetProfit": "15000.00",
            }
        },
    )


class RuntimeStatistics(BaseModel):
    """Runtime statistics from Lean backtest results."""

    equity: str = Field(..., alias="Equity")
    fees: str = Field(..., alias="Fees")
    holdings: str = Field(..., alias="Holdings")
    net_profit: str = Field(..., alias="NetProfit")
    probabilistic_sharpe_ratio: str = Field(..., alias="ProbabilisticSharpeRatio")
    return_percentage: str = Field(..., alias="ReturnPercentage")
    unrealized: str = Field(..., alias="Unrealized")
    volume: str = Field(..., alias="Volume")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "equity": "115000.00",
                "fees": "250.00",
                "holdings": "0.00",
                "net_profit": "15000.00",
                "return_percentage": "15.00%",
                "volume": "1000000.00",
            }
        }
    )


class BacktestState(BaseModel):
    """Backtest execution state information."""

    start_time: str = Field(..., alias="StartTime")
    end_time: str = Field(..., alias="EndTime")
    runtime_error: str = Field(..., alias="RuntimeError")
    stack_trace: str = Field(..., alias="StackTrace")
    log_count: str = Field(..., alias="LogCount")
    order_count: str = Field(..., alias="OrderCount")
    insight_count: str = Field(..., alias="InsightCount")
    name: str = Field(..., alias="Name")
    hostname: str = Field(..., alias="Hostname")
    status: str = Field(..., alias="Status")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "StartTime": "2024-01-01 00:00:00",
                "EndTime": "2024-01-01 23:59:59",
                "RuntimeError": "",
                "StackTrace": "",
                "Status": "Completed",
            }
        },
    )


class AlgorithmConfiguration(BaseModel):
    """Algorithm configuration from Lean backtest."""

    name: str = Field(..., description="Algorithm name")
    tags: List[str] = Field(default_factory=list, description="Algorithm tags")
    account_currency: str = Field(..., description="Base account currency")
    brokerage: int = Field(..., description="Brokerage ID")
    account_type: int = Field(..., description="Account type ID")
    parameters: Dict[str, Any] = Field(
        default_factory=dict, description="Algorithm parameters"
    )
    out_of_sample_max_end_date: Optional[str] = Field(
        None, description="Out-of-sample max end date"
    )
    out_of_sample_days: int = Field(
        default=0, ge=0, description="Number of out-of-sample days"
    )
    start_date: str = Field(..., description="Algorithm start date")
    end_date: str = Field(..., description="Algorithm end date")
    trading_days_per_year: int = Field(
        default=252, gt=0, description="Trading days per year"
    )

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
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
        },
    )


class DataRequest(BaseModel):
    """Data request information from Lean backtest for quantitative trading analysis."""

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
    path: str = Field(..., description="File path to the data")

    @field_validator("path", mode="before")
    @classmethod
    def convert_path_to_string(cls, v):
        """Convert Path objects to strings for Lean engine data processing."""
        if isinstance(v, Path):
            return str(v)
        return v

    @field_serializer("date")
    def serialize_date(self, value: datetime) -> str:
        """Serialize datetime to ISO format for API responses."""
        return value.isoformat()

    @classmethod
    def from_path(cls, path: str | Path) -> Optional["DataRequest"]:
        """
        Create DataRequest from Lean engine data file path.

        Parses file paths in the format:
        /security_type/market/resolution/symbol/YYYYMMDD_datatype.zip

        Args:
            path: File path to Lean engine data file

        Returns:
            DataRequest instance or None if path format is invalid
        """
        p = Path(path)
        parts = p.parts
        parts = parts[1:] if parts[0] == "/" else parts

        if len(parts) != 5:
            return None

        filename = p.name
        name_without_ext = filename.replace(".zip", "")

        try:
            date_str, data_type = name_without_ext.split("_")
            date = datetime.strptime(date_str, "%Y%m%d")
        except ValueError:
            return None

        return cls(
            security_type=parts[0],
            market=parts[1],
            resolution=parts[2],
            symbol=parts[3],
            date=date,
            data_type=data_type,
            path=str(Path(*parts)),
        )

    def to_dict(self) -> dict:
        """
        Convert DataRequest to dictionary for Lean engine integration.

        Returns:
            Dictionary representation with properly serialized datetime
        """
        return {
            "security_type": self.security_type,
            "market": self.market,
            "resolution": self.resolution,
            "symbol": self.symbol,
            "date": self.date.isoformat(),
            "data_type": self.data_type,
            "path": self.path,
        }

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "security_type": "crypto",
                "market": "binance",
                "resolution": "minute",
                "symbol": "ethusdt",
                "date": "2024-10-07T00:00:00",
                "data_type": "trade",
                "path": "/crypto/binance/minute/ethusdt/20241007_trade.zip",
            }
        },
    )


class LeanBacktest(BaseModel):
    """Complete Lean backtest data model for FastAPI integration."""

    id: Optional[int] = Field(None, description="Unique backtest identifier")
    strategy_id: int = Field(..., description="Associated strategy ID")
    name: str = Field(..., min_length=1, max_length=255, description="Backtest name")
    description: str = Field(..., description="Backtest description")

    starting_date: datetime = Field(..., description="Backtest start date and time")
    ending_date: datetime = Field(..., description="Backtest end date and time")
    engine: str = Field(default="LEAN", description="Backtest engine used")

    trade_statistics: Optional["TradeStatistics"] = Field(
        None, description="Trade performance statistics"
    )
    portfolio_statistics: Optional["PortfolioStatistics"] = Field(
        None, description="Portfolio performance statistics"
    )
    runtime_statistics: Optional["RuntimeStatistics"] = Field(
        None, description="Runtime execution statistics"
    )
    algorithm_configuration: Optional["AlgorithmConfiguration"] = Field(
        None, description="Algorithm configuration"
    )
    state: Optional["BacktestState"] = Field(
        None, description="Backtest execution state"
    )

    general_statistics: Dict[str, str] = Field(
        default_factory=dict, description="General statistics"
    )
    succeeded_data_requests: List["DataRequest"] = Field(
        default_factory=list, description="Succeeded requests"
    )
    failed_data_requests: List["DataRequest"] = Field(
        default_factory=list, description="Failed requests"
    )

    rolling_window: Dict[str, Any] = Field(
        default_factory=dict, description="Rolling window data"
    )
    charts: Dict[str, Any] = Field(
        default_factory=dict, description="Chart data for visualization"
    )

    @model_validator(mode="after")
    def validate_dates(self):
        if self.ending_date <= self.starting_date:
            raise ValueError("ending_date must be after starting_date")
        return self

    @field_serializer("starting_date", "ending_date")
    def serialize_datetimes(self, dt: datetime, _info):
        return dt.isoformat()

    @classmethod
    def from_backtest_model(cls, backtest_model: "Backtest") -> "LeanBacktest":
        parameters = backtest_model.parameters or {}

        def safe_create_model(model_class, data):
            if not data:
                return None
            try:
                return model_class(**data)
            except Exception as e:
                print(f"Warning: Failed to create {model_class.__name__}: {e}")
                return None

        def safe_create_data_requests(data_list):
            if not data_list:
                return []
            result = []
            for item in data_list:
                try:
                    if isinstance(item, dict):
                        result.append(DataRequest(**item))
                    elif hasattr(item, "to_dict"):
                        result.append(DataRequest(**item.to_dict()))
                    else:
                        result.append(item)
                except Exception as e:
                    print(f"Warning: Failed to create DataRequest from {item}: {e}")
            return result

        return cls(
            id=backtest_model.id,
            strategy_id=backtest_model.strategy_id,
            name=backtest_model.name,
            description=backtest_model.description or "",
            starting_date=backtest_model.starting_date,
            ending_date=backtest_model.ending_date,
            engine=backtest_model.engine.value if backtest_model.engine else "LEAN",
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

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": 1,
                "strategy_id": 1,
                "name": "Momentum Strategy Backtest",
                "description": "Testing momentum strategy with ETH/USD",
                "starting_date": "2024-01-01T00:00:00Z",
                "ending_date": "2024-12-31T23:59:59Z",
                "engine": "LEAN",
            }
        },
    )
