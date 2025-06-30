from typing import Dict, Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_serializer
from enum import Enum
from backtest.BacktestEngine import BacktestEngine as StrategyEngine
from backtest.models import SeriesType, DataType


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class OrderStatus(str, Enum):
    NEW = "new"
    SUBMITTED = "submitted"
    FILLED = "filled"
    CANCELED = "canceled"
    REJECTED = "rejected"
    PARTIALLY_FILLED = "partially_filled"


class TimeStampSchemaMixin:
    created_at: datetime
    updated_at: datetime


class BacktestCreate(BaseModel):
    name: str
    description: Optional[str] = None
    starting_date: datetime
    ending_date: datetime
    strategy_id: int
    engine: StrategyEngine
    parameters: Dict

    model_config = ConfigDict(from_attributes=True)


class BacktestRead(BacktestCreate, TimeStampSchemaMixin):
    id: int

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    order_id: int = Field(..., description="Unique order identifier")
    engine: StrategyEngine = Field(..., description="Backtesting Engine")
    time: datetime = Field(..., description="Order timestamp")
    symbol: str = Field(..., description="Trading symbol")
    side: OrderSide = Field(..., description="Buy or sell")
    quantity: float = Field(..., description="Order quantity")
    status: OrderStatus = Field(..., description="Order status")
    parameters: Dict


class OrderRead(OrderCreate, TimeStampSchemaMixin):
    id: int

    model_config = ConfigDict(from_attributes=True)


class TimeBasedData(BaseModel):
    time: datetime = Field(..., description="Python datetime")

    @field_serializer("time")
    def time_to_timestamp(self, dt: datetime, _info):
        return dt.timestamp()


class CandleData(TimeBasedData):
    """
    Pydantic validation schema representing a single candlestick.

    Attributes:
        open: Opening price
        high: Highest price during the period
        low: Lowest price during the period
        close: Closing price
        volume: Trading volume during the period
    """

    open: float = Field(..., description="Opening price")
    high: float = Field(..., description="Highest price during the period")
    low: float = Field(..., description="Lowest price during the period")
    close: float = Field(..., description="Closing price")
    volume: Optional[float] = Field(0.0, description="Trading volume during the period")


class LineData(TimeBasedData):
    value: float = Field(..., description="Line value")


class BarData(TimeBasedData):
    height: float = Field(..., description="Height of the bar")


class Series(BaseModel):
    name: str = Field(..., description="Display name for the chart")
    type: SeriesType = Field(
        ..., description="Visual representation type (area, candle, line, etc.)"
    )
    data_type: DataType = Field(
        ..., description="Source of chart data (stored in DB or external)"
    )
    data: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Chart data in JSON format containing time-based series data",
    )
    parameters: Dict[str, Any] = Field(
        default_factory=dict, description="Chart parameters and configuration options"
    )

    model_config = ConfigDict(from_attributes=True)


class SeriesCreate(Series):
    backtest_id: int = Field(..., description="Associated backtest identifier")
    model_config = ConfigDict(from_attributes=True)


class SeriesRead(SeriesCreate):
    id: int = Field(..., description="Unique chart identifier")

    model_config = ConfigDict(from_attributes=True)


class SeriesMetadata(BaseModel):
    """Series metadata without the data field for listing purposes"""

    id: int = Field(..., description="Unique chart identifier")
    backtest_id: int = Field(..., description="Associated backtest identifier")
    name: str = Field(..., description="Display name for the chart")
    type: SeriesType = Field(
        ..., description="Visual representation type (area, candle, line, etc.)"
    )
    data_type: DataType = Field(
        ..., description="Source of chart data (stored in DB or external)"
    )
    parameters: Dict[str, Any] = Field(
        default_factory=dict, description="Chart parameters and configuration options"
    )

    model_config = ConfigDict(from_attributes=True)
