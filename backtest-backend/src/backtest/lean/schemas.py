"""
Lean-specific backtest Pydantic models for FastAPI integration.

This module provides comprehensive Pydantic models for Lean backtests with
automatic validation, serialization, and FastAPI integration.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any, TYPE_CHECKING
from decimal import Decimal
from pathlib import Path
from pydantic import (
    BaseModel,
    Field,
    field_serializer,
    model_serializer,
    field_validator,
    model_validator,
    ConfigDict,
)

if TYPE_CHECKING:
    from backtest.models import BacktestModel
    from backtest.schemas import BacktestRead


class BaseLeanBacktestSchema(BaseModel):
    @staticmethod
    def pascal_to_camel_case(pascal_case: str):
        if not pascal_case:
            return pascal_case

        return pascal_case[0].lower() + pascal_case[1:]

    @staticmethod
    def to_camel(s: str) -> str:
        """Convert snake_case to camelCase."""
        parts = s.strip().replace("-", " ").replace("_", " ").split()
        camel_case_string = parts[0].lower() + "".join(
            word.capitalize() for word in parts[1:]
        )
        return camel_case_string

    @staticmethod
    def normalize_field_name(field_name: str) -> str:
        """
        Normalize field names to handle edge cases like acronyms and DateTime vs Datetime.
        This function transforms JSON field names to match schema field expectations.
        """
        # Create mapping for specific known field transformations
        field_mappings = {
            # DateTime patterns
            "startDateTime": "start_datetime",
            "endDateTime": "end_datetime",
            # MAE/MFE patterns
            "averageMAE": "average_mae",
            "averageMFE": "average_mfe",
            "largestMAE": "largest_mae",
            "largestMFE": "largest_mfe",
            # Other known patterns can be added here
            "Return": "return_percentage",
        }

        # Check for direct mapping first
        if field_name in field_mappings:
            result = field_mappings[field_name]

        # Convert camelCase to snake_case for general cases
        elif "_" in field_name or " " in field_name:
            result = BaseLeanBacktestSchema.to_camel(field_name)
        elif field_name[0].isupper():
            result = BaseLeanBacktestSchema.pascal_to_camel_case(field_name)
        else:
            result = field_name
        return result

    @model_validator(mode="before")
    @classmethod
    def handle_title_case_keys(cls, values: Any) -> Any:
        """
        Automatically convert field names to match schema expectations.
        Handles Title Case keys, camelCase keys, and acronym edge cases.
        """
        if not isinstance(values, dict):
            return values

        transformed = {}
        for key, val in values.items():
            if isinstance(key, str):
                normalized_key = BaseLeanBacktestSchema.normalize_field_name(key)

                transformed[normalized_key] = val
            else:
                transformed[key] = val
        return transformed

    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, serialize_by_alias=True
    )


class TradeStatistics(BaseLeanBacktestSchema):
    """Trade statistics from Lean backtest results."""

    start_datetime: datetime
    end_datetime: datetime
    total_number_of_trades: int = Field(..., ge=0)
    number_of_winning_trades: int = Field(..., ge=0)
    number_of_losing_trades: int = Field(..., ge=0)
    total_profit_loss: Decimal = Field(
        ...,
    )
    total_profit: Decimal = Field(..., ge=0)
    total_loss: Decimal = Field(..., le=0)
    largest_profit: Decimal
    largest_loss: Decimal
    average_profit_loss: Decimal
    average_profit: Decimal
    average_loss: Decimal
    average_trade_duration: str
    average_winning_trade_duration: str = Field(
        ...,
    )
    average_losing_trade_duration: str = Field(
        ...,
    )
    median_trade_duration: str = Field(
        ...,
    )
    median_winning_trade_duration: str = Field(
        ...,
    )
    median_losing_trade_duration: str = Field(
        ...,
    )
    max_consecutive_winning_trades: int = Field(..., ge=0)
    max_consecutive_losing_trades: int = Field(..., ge=0)
    profit_loss_ratio: Decimal = Field(
        ...,
    )
    win_loss_ratio: Decimal = Field(
        ...,
    )
    win_rate: Decimal = Field(..., ge=0, le=1)
    loss_rate: Decimal = Field(..., ge=0, le=1)
    average_mae: Decimal = Field(
        ...,
    )
    average_mfe: Decimal = Field(
        ...,
    )
    largest_mae: Decimal = Field(
        ...,
    )
    largest_mfe: Decimal = Field(
        ...,
    )
    maximum_closed_trade_drawdown: Decimal = Field(
        ...,
    )
    maximum_intra_trade_drawdown: Decimal = Field(
        ...,
    )
    profit_loss_standard_deviation: Decimal = Field(
        ...,
    )
    profit_loss_downside_deviation: Decimal = Field(
        ...,
    )
    profit_factor: Decimal = Field(
        ...,
    )
    sharpe_ratio: Decimal = Field(
        ...,
    )
    sortino_ratio: Decimal = Field(
        ...,
    )
    profit_to_max_drawdown_ratio: Decimal = Field(
        ...,
    )
    maximum_end_trade_drawdown: Decimal = Field(
        ...,
    )
    average_end_trade_drawdown: Decimal = Field(
        ...,
    )
    maximum_drawdown_duration: str = Field(
        ...,
    )
    total_fees: Decimal = Field(..., ge=0)

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


class PortfolioStatistics(BaseLeanBacktestSchema):
    """Portfolio statistics from Lean backtest results for quantitative analysis."""

    average_win_rate: Decimal = Field(
        ...,
    )
    average_loss_rate: Decimal = Field(
        ...,
    )
    profit_loss_ratio: Decimal = Field(
        ...,
    )
    win_rate: Decimal = Field(..., ge=0, le=1)
    loss_rate: Decimal = Field(..., ge=0, le=1)
    expectancy: Decimal = Field(
        ...,
    )
    start_equity: Decimal = Field(..., gt=0)
    end_equity: Decimal = Field(..., gt=0)
    compounding_annual_return: Decimal = Field(
        ...,
    )
    drawdown: Decimal = Field(
        ...,
    )
    total_net_profit: Decimal = Field(
        ...,
    )
    sharpe_ratio: Decimal = Field(
        ...,
    )
    probabilistic_sharpe_ratio: Decimal = Field(
        ...,
    )
    sortino_ratio: Decimal = Field(
        ...,
    )
    alpha: Decimal = Field(
        ...,
    )
    beta: Decimal = Field(
        ...,
    )
    annual_standard_deviation: Decimal = Field(
        ...,
    )
    annual_variance: Decimal = Field(
        ...,
    )
    information_ratio: Decimal = Field(
        ...,
    )
    tracking_error: Decimal = Field(
        ...,
    )
    treynor_ratio: Decimal = Field(
        ...,
    )
    portfolio_turnover: Decimal = Field(
        ...,
    )
    value_at_risk_99: Decimal = Field(
        ...,
    )
    value_at_risk_95: Decimal = Field(
        ...,
    )

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


class RuntimeStatistics(BaseLeanBacktestSchema):
    """Runtime statistics from Lean backtest results."""

    equity: str = Field(
        ...,
    )
    fees: str = Field(
        ...,
    )
    holdings: str = Field(
        ...,
    )
    net_profit: str = Field(
        ...,
    )
    probabilistic_sharpe_ratio: str = Field(
        ...,
    )
    return_percentage: str = Field(
        ...,
    )
    unrealized: str = Field(
        ...,
    )
    volume: str = Field(
        ...,
    )

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


class State(BaseLeanBacktestSchema):
    """Backtest execution state information."""

    start_time: str = Field(
        ...,
    )
    end_time: str = Field(
        ...,
    )
    runtime_error: str = Field(
        ...,
    )
    stack_trace: str = Field(
        ...,
    )
    log_count: str = Field(
        ...,
    )
    order_count: str = Field(
        ...,
    )
    insight_count: str = Field(
        ...,
    )
    name: str = Field(
        ...,
    )
    hostname: str = Field(
        ...,
    )
    status: str = Field(
        ...,
    )

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


class AlgorithmConfiguration(BaseLeanBacktestSchema):
    """Algorithm configuration from Lean backtest."""

    name: str = Field(
        ...,
        description="Algorithm name",
    )
    tags: List[str] = Field(
        default_factory=list,
        description="Algorithm tags",
    )
    account_currency: str = Field(
        ...,
        description="Base account currency",
    )
    brokerage: int = Field(
        ...,
        description="Brokerage ID",
    )
    account_type: int = Field(
        ...,
        description="Account type ID",
    )
    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="Algorithm parameters",
    )
    out_of_sample_max_end_date: Optional[str] = Field(
        ...,
        description="Out-of-sample max end date",
    )
    out_of_sample_days: int = Field(
        default=0,
        ge=0,
        description="Number of out-of-sample days",
    )
    start_date: str = Field(
        ...,
        description="Algorithm start date",
    )
    end_date: str = Field(
        ...,
        description="Algorithm end date",
    )
    trading_days_per_year: int = Field(
        default=252,
        gt=0,
        description="Trading days per year",
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


class DataRequest(BaseLeanBacktestSchema):
    """Data request information from Lean backtest for quantitative trading analysis."""

    security_type: str = Field(
        ...,
        description="Type of security (e.g., crypto, equity)",
    )
    market: str = Field(
        ...,
        description="Market identifier (e.g., binance, nasdaq)",
    )
    resolution: str = Field(
        ...,
        description="Data resolution (e.g., minute, hour, daily)",
    )
    symbol: str = Field(
        ...,
        description="Trading symbol",
    )
    date: datetime = Field(
        ...,
        description="Date of the data request",
    )
    data_type: str = Field(
        ...,
        description="Type of data (e.g., trade, quote)",
    )
    path: str = Field(
        ...,
        description="File path to the data",
    )

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


class SymbolInfo(BaseLeanBacktestSchema):
    """Symbol information for closed trades."""

    value: str = Field(
        ...,
        description="Symbol value (e.g., ETHUSDT)",
    )
    id: str = Field(
        ...,
        description="Symbol ID (e.g., ETHUSDT 18N)",
    )
    permtick: str = Field(
        ...,
        description="Permanent ticker symbol",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"value": "ETHUSDT", "id": "ETHUSDT 18N", "permtick": "ETHUSDT"}
        }
    )


class ClosedTrade(BaseLeanBacktestSchema):
    """Individual closed trade information from Lean backtest results."""

    symbol: SymbolInfo = Field(
        ...,
        description="Trading symbol information",
    )
    entry_time: datetime = Field(
        ...,
        description="Trade entry timestamp",
    )
    entry_price: Decimal = Field(
        ...,
        description="Entry price per unit",
    )
    direction: int = Field(
        ...,
        description="Trade direction (0=short, 1=long)",
    )
    quantity: Decimal = Field(
        ...,
        description="Trade quantity",
        ge=0,
    )
    exit_time: datetime = Field(
        ...,
        description="Trade exit timestamp",
    )
    exit_price: Decimal = Field(
        ...,
        description="Exit price per unit",
    )
    profit_loss: Decimal = Field(
        ...,
        description="Trade profit/loss",
    )
    total_fees: Decimal = Field(
        ...,
        description="Total transaction fees",
        ge=0,
    )
    mae: Decimal = Field(
        ...,
        description="Maximum Adverse Excursion",
    )
    mfe: Decimal = Field(
        ...,
        description="Maximum Favorable Excursion",
    )
    duration: str = Field(
        ...,
        description="Trade duration (HH:MM:SS format)",
    )
    end_trade_drawdown: Decimal = Field(
        ...,
        description="Drawdown at trade end",
    )
    is_win: bool = Field(
        ...,
        description="Whether trade was profitable",
    )

    @field_validator("entry_time", "exit_time", mode="before")
    @classmethod
    def parse_datetime(cls, v):
        """Parse datetime strings to datetime objects."""
        if isinstance(v, str):
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        return v

    @model_validator(mode="after")
    def validate_trade_logic(self):
        """Validate trade logic consistency."""
        if self.exit_time <= self.entry_time:
            raise ValueError("Exit time must be after entry time")
        return self

    @field_serializer("entry_time", "exit_time")
    def serialize_datetime(self, v: datetime) -> str:
        """Serialize datetime to ISO format."""
        return v.isoformat()

    @field_serializer(
        "entry_price",
        "exit_price",
        "profit_loss",
        "total_fees",
        "mae",
        "mfe",
        "end_trade_drawdown",
        "quantity",
    )
    def serialize_decimal(self, v: Decimal) -> str:
        """Serialize Decimal values to strings for precision preservation."""
        return str(v)

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "symbol": {
                    "value": "ETHUSDT",
                    "id": "ETHUSDT 18N",
                    "permtick": "ETHUSDT",
                },
                "entryTime": "2024-10-01T18:57:00Z",
                "entryPrice": "2508.67",
                "direction": 1,
                "quantity": "0.0038961",
                "exitTime": "2024-10-01T18:59:00Z",
                "exitPrice": "2511.6",
                "profitLoss": "-0.01",
                "totalFees": "0.019579053",
                "mae": "-0.02",
                "mfe": "0.00",
                "duration": "00:02:00",
                "endTradeDrawdown": "-0.01",
                "isWin": False,
            }
        },
    )


class RollingWindowSection(BaseLeanBacktestSchema):
    """A single rolling window section containing statistics and closed trades."""

    trade_statistics: TradeStatistics
    portfolio_statistics: PortfolioStatistics
    closed_trades: List[ClosedTrade]

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "tradeStatistics": {
                    "startDateTime": "2024-01-01T00:00:00+00:00",
                    "endDateTime": "2024-01-31T23:59:59+00:00",
                    "totalNumberOfTrades": 25,
                    "numberOfWinningTrades": 15,
                    "numberOfLosingTrades": 10,
                },
                "portfolioStatistics": {
                    "startEquity": "100000",
                    "endEquity": "105000",
                    "totalNetProfit": "5000.00",
                },
                "closedTrades": [],
            }
        },
    )


class RollingWindow(BaseLeanBacktestSchema):
    """Rolling window analysis containing time-series performance data."""

    # Dictionary mapping window keys (e.g., "M1_20241031") to their sections
    window_data: Dict[str, RollingWindowSection] = Field(
        default_factory=dict,
        description="Rolling window sections keyed by time period identifiers",
    )

    def __getitem__(self, key: str) -> RollingWindowSection:
        """Allow dictionary-style access to window sections."""
        return self.window_data[key]

    def __setitem__(self, key: str, value: RollingWindowSection) -> None:
        """Allow dictionary-style assignment to window sections."""
        self.window_data[key] = value

    def keys(self):
        """Return window section keys."""
        return self.window_data.keys()

    def values(self):
        """Return window sections."""
        return self.window_data.values()

    def items(self):
        """Return window section items."""
        return self.window_data.items()

    @model_serializer
    def serialize(self) -> Dict[str, Any]:
        """Serialize window_data directly without wrapper."""
        return {key: section.model_dump() for key, section in self.window_data.items()}

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RollingWindow":
        """Create RollingWindow from dictionary data."""
        window_data = {}

        def window_is_empty(window: Dict[str, Any]):
            startDateTime = window.get("tradeStatistics").get("startDateTime")
            return startDateTime is None

        for key, window_values in data.items():
            # check for null rolling windows
            if not window_is_empty(window_values):
                window_data[key] = RollingWindowSection(**window_values)
        return cls(window_data=window_data)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "M1_20241031": {
                    "tradeStatistics": {
                        "startDateTime": "2024-10-01T00:00:00Z",
                        "endDateTime": "2024-10-31T23:59:59Z",
                        "totalNumberOfTrades": 50,
                    },
                    "portfolioStatistics": {
                        "startEquity": "100000",
                        "endEquity": "105000",
                    },
                    "closedTrades": [],
                }
            }
        }
    )


class Statistics(BaseLeanBacktestSchema):
    """
    Unified statistics schema combining the most important metrics from both
    trade and portfolio statistics for comprehensive backtest analysis.
    """

    # Core Performance Metrics
    total_orders: int = Field(..., description="Total number of orders executed")
    compounding_annual_return: str = Field(
        ..., description="Annualized return percentage"
    )
    drawdown: str = Field(..., description="Maximum drawdown percentage")
    expectancy: str = Field(..., description="Expected value per trade")
    start_equity: str = Field(..., description="Initial portfolio value")
    end_equity: str = Field(..., description="Final portfolio value")
    net_profit: str = Field(..., description="Net profit percentage")

    # Risk and Performance Ratios
    sharpe_ratio: str = Field(..., description="Risk-adjusted return metric")
    sortino_ratio: str = Field(..., description="Downside risk-adjusted return")
    probabilistic_sharpe_ratio: str = Field(
        ..., description="Probability that Sharpe ratio is positive"
    )

    # Win/Loss Metrics
    loss_rate: str = Field(..., description="Percentage of losing trades")
    win_rate: str = Field(..., description="Percentage of winning trades")
    profit_loss_ratio: str = Field(
        ..., description="Average profit to average loss ratio"
    )
    average_win: str = Field(..., description="Average winning trade percentage")
    average_loss: str = Field(..., description="Average losing trade percentage")

    # Risk Analysis
    alpha: str = Field(..., description="Excess return over benchmark")
    beta: str = Field(..., description="Market correlation coefficient")
    annual_standard_deviation: str = Field(..., description="Annualized volatility")
    annual_variance: str = Field(..., description="Annualized variance")
    information_ratio: str = Field(..., description="Risk-adjusted active return")
    tracking_error: str = Field(..., description="Standard deviation of excess returns")
    treynor_ratio: str = Field(..., description="Return per unit of systematic risk")

    # Cost and Capacity Analysis
    total_fees: str = Field(..., description="Total transaction fees")
    estimated_strategy_capacity: str = Field(
        ..., description="Maximum capital the strategy can handle"
    )
    lowest_capacity_asset: str = Field(
        ..., description="Asset that limits strategy capacity"
    )
    portfolio_turnover: str = Field(..., description="Portfolio turnover rate")


class TotalPerformance(BaseLeanBacktestSchema):
    """Total performance section containing aggregated statistics and trades."""

    trade_statistics: TradeStatistics = Field(
        ...,
    )
    portfolio_statistics: PortfolioStatistics = Field(
        ...,
    )
    closed_trades: List[ClosedTrade] = Field(
        default_factory=list,
    )

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "tradeStatistics": {
                    "startDateTime": "2024-01-01T00:00:00+00:00",
                    "endDateTime": "2024-12-31T23:59:59+00:00",
                    "totalNumberOfTrades": 100,
                    "numberOfWinningTrades": 60,
                    "numberOfLosingTrades": 40,
                },
                "portfolioStatistics": {
                    "startEquity": "100000",
                    "endEquity": "115000",
                    "totalNetProfit": "15000.00",
                },
                "closedTrades": [],
            }
        },
    )


class LeanBacktestParameters(BaseLeanBacktestSchema):
    """Schema for all Lean backtest parameters structure."""

    rolling_window: RollingWindow = Field(
        description="Rolling window analysis data",
    )
    total_performance: TotalPerformance = Field(
        ...,
        description="Total performance statistics",
    )
    statistics: Statistics = Field(
        ...,
        description="Unified statistics",
    )
    runtime_statistics: RuntimeStatistics = Field(
        ...,
        description="Runtime execution statistics",
    )
    state: State = Field(
        ...,
        description="Backtest execution state",
    )
    algorithm_configuration: AlgorithmConfiguration = Field(
        ...,
        description="Algorithm configuration",
    )
    succeeded_data_requests: List[DataRequest] = Field(
        default_factory=list,
        description="Successfully processed data requests",
    )
    failed_data_requests: List[DataRequest] = Field(
        default_factory=list,
        description="Failed data requests",
    )

    @field_validator("rolling_window", mode="before")
    @classmethod
    def validate_rolling_window(cls, v):
        """
        Validate and create RollingWindow from dictionary data.

        This validator handles the creation of RollingWindow objects from raw JSON data
        by calling the RollingWindow.from_dict() method.
        """
        if v is None:
            return None

        if isinstance(v, dict):
            # Use the from_dict class method to properly create RollingWindow
            return RollingWindow.from_dict(v)

        if isinstance(v, RollingWindow):
            # Already a RollingWindow instance
            return v

        # Handle empty or invalid data
        if not v:
            return RollingWindow(window_data={})

        raise ValueError(f"Invalid rolling_window data type: {type(v)}")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "statistics": {
                    "totalOrders": "152",
                    "compoundingAnnualReturn": "-0.002%",
                    "drawdown": "0.000%",
                    "expectancy": "-0.219",
                },
                "runtimeStatistics": {
                    "equity": "99999.56",
                    "fees": "$1.04",
                    "holdings": "0.00",
                    "netProfit": "-0.44",
                },
                "state": {
                    "startTime": "2024-10-07 19:39:31",
                    "endTime": "2024-10-07 19:40:01",
                    "status": "Completed",
                },
            }
        },
    )


class LeanBacktest(BaseLeanBacktestSchema):
    """Complete Lean backtest data model for FastAPI integration."""

    id: Optional[int] = Field(None, description="Unique backtest identifier")
    strategy_id: int = Field(..., description="Associated strategy ID")
    name: str = Field(..., min_length=1, max_length=255, description="Backtest name")
    description: str = Field(..., description="Backtest description")

    starting_date: datetime = Field(..., description="Backtest start date and time")
    ending_date: datetime = Field(..., description="Backtest end date and time")
    engine: str = Field(default="LEAN", description="Backtest engine used")

    total_performance: TotalPerformance = Field(
        ..., description="Total performance statistics"
    )
    statistics: Statistics = Field(..., description="Unified statistics")
    runtime_statistics: "RuntimeStatistics" = Field(
        ..., description="Runtime execution statistics"
    )

    state: "State" = Field(..., description="Backtest execution state")
    algorithm_configuration: "AlgorithmConfiguration" = Field(
        None, description="Algorithm configuration"
    )

    succeeded_data_requests: List["DataRequest"] = Field(
        default_factory=list, description="Succeeded requests"
    )
    failed_data_requests: List["DataRequest"] = Field(
        default_factory=list, description="Failed requests"
    )

    rolling_window: Optional[RollingWindow] = Field(
        None, description="Rolling window analysis data"
    )

    @model_validator(mode="after")
    def validate_dates(self):
        if self.ending_date <= self.starting_date:
            raise ValueError("ending_date must be after starting_date")
        return self

    @field_serializer("starting_date", "ending_date")
    def serialize_datetimes(self, dt: datetime, _info):
        return dt.isoformat()

    def to_backtest_read(self) -> "BacktestRead":
        """
        Transform LeanBacktest to BacktestRead schema for API responses.

        Returns:
            BacktestRead: Standardized backtest response schema
        """
        # Extract parameters from the LeanBacktest data
        parameters = {
            "rollingWindow": self.rolling_window.model_dump()
            if self.rolling_window
            else None,
            "totalPerformance": self.total_performance.model_dump(),
            "statistics": self.statistics.model_dump(),
            "runtimeStatistics": self.runtime_statistics.model_dump(),
            "state": self.state.model_dump(),
            "algorithmConfiguration": self.algorithm_configuration.model_dump()
            if self.algorithm_configuration
            else {},
            "succeededDataRequests": [
                req.model_dump() for req in self.succeeded_data_requests
            ],
            "failedDataRequests": [
                req.model_dump() for req in self.failed_data_requests
            ],
        }

        return BacktestRead(
            id=self.id,
            name=self.name,
            description=self.description,
            starting_date=self.starting_date,
            ending_date=self.ending_date,
            strategy_id=self.strategy_id,
            engine=self.engine,
            parameters=parameters,
            created_at=getattr(self, "created_at", None),
            updated_at=getattr(self, "updated_at", None),
        )

    @staticmethod
    def get_parameters(lean_backtest):
        return LeanBacktestParameters(
            **lean_backtest.model_dump(
                include={
                    "rolling_window",
                    "total_performance",
                    "statistics",
                    "runtime_statistics",
                    "state",
                    "algorithm_configuration",
                    "succeeded_data_requests",
                    "failed_data_requests",
                }
            )
        )

    @classmethod
    def from_backtest_model(cls, backtest_model: "BacktestModel") -> "LeanBacktest":
        parameters_data = backtest_model.parameters or {}

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

        # Create LeanBacktestParameters object
        parameters = LeanBacktestParameters(
            rolling_window=RollingWindow.from_dict(
                parameters_data.get("rollingWindow")
            ),
            total_performance=parameters_data.get("totalPerformance"),
            runtime_statistics=parameters_data.get("runtimeStatistics"),
            algorithm_configuration=parameters_data.get("algorithmConfiguration"),
            state=parameters_data.get("state"),
            statistics=parameters_data.get("statistics"),
            succeeded_data_requests=safe_create_data_requests(
                parameters_data.get("succeededDataRequests", [])
            ),
            failed_data_requests=safe_create_data_requests(
                parameters_data.get("failedDataRequests", [])
            ),
        )

        return cls(
            id=backtest_model.id,
            strategy_id=backtest_model.strategy_id,
            name=backtest_model.name,
            description=backtest_model.description or "",
            starting_date=backtest_model.starting_date,
            ending_date=backtest_model.ending_date,
            engine=backtest_model.engine,
            rolling_window=parameters.rolling_window,
            runtime_statistics=parameters.runtime_statistics,
            algorithm_configuration=parameters.algorithm_configuration,
            state=parameters.state,
            statistics=parameters.statistics,
            total_performance=parameters.total_performance,
            succeeded_data_requests=parameters.succeeded_data_requests,
            failed_data_requests=parameters.failed_data_requests,
        )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": 1,
                "strategyId": 1,
                "name": "Momentum Strategy Backtest",
                "description": "Testing momentum strategy with ETH/USD",
                "startingDate": "2024-01-01T00:00:00Z",
                "endingDate": "2024-12-31T23:59:59Z",
                "engine": "LEAN",
                "parameters": {
                    "statistics": {
                        "tradeStatistics": {
                            "totalOrders": "152",
                            "averageWin": "0.00%",
                            "averageLoss": "0.00%",
                            "compoundingAnnualReturn": "-0.002%",
                            "drawdown": "0.000%",
                            "expectancy": "-0.219",
                            "startDateTime": "2024-01-01T00:00:00Z",
                            "endDateTime": "2024-12-31T23:59:59Z",
                            "netProfit": "0.00%",
                            "sharpeRatio": "0.000",
                            "lossRate": "100%",
                            "winRate": "0%",
                            "profitLossRatio": "0.00",
                            "alpha": "-0.002",
                            "beta": "0.997",
                            "annualStandardDeviation": "0.179",
                            "annualVariance": "0.032",
                            "informationRatio": "-0.011",
                            "trackingError": "0.179",
                            "treynorRatio": "-0.002",
                            "probabilisticSharpeRatio": "49.432%",
                            "probabilisticSortino": "0.000%",
                            "sortino": "0.000",
                            "maximumClosedTradeDrawdown": "0.00%",
                            "maximumIntratradeDrawdown": "0.10%",
                            "capacity": "$18000.00",
                            "lowestCapacityAsset": "ETHUSD E2",
                            "portfolioTurnover": "1.01%",
                            "orderListHash": "d41d8cd98f00b204e9800998ecf8427e",
                            "numberOfWinningTrades": 0,
                            "numberOfLosingTrades": 40,
                        },
                        "portfolioStatistics": {
                            "startEquity": "100000",
                            "endEquity": "115000",
                            "totalNetProfit": "15000.00",
                        },
                    },
                    "runtimeStatistics": {
                        "equity": "99999.56",
                        "fees": "$1.04",
                        "holdings": "0.00",
                        "netProfit": "-0.44",
                        "unrealized": "0",
                        "volume": "0",
                        "return": "0%",
                    },
                    "state": {
                        "startTime": "2024-10-07T19:39:31",
                        "endTime": "2024-10-07T19:40:01",
                        "status": "Completed",
                    },
                    "algorithmConfiguration": {},
                    "totalPerformance": {},
                    "succeededDataRequests": [],
                    "failedDataRequests": [],
                },
            }
        },
    )
