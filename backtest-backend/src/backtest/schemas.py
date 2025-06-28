from typing import Dict, Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from enum import Enum
from backtest.BacktestEngine import BacktestEngine as StrategyEngine
from backtest.models import ChartType, DataType


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




class BacktestCreate(BaseModel):
    name: str
    description: Optional[str] = None
    starting_date: datetime
    ending_date: datetime
    strategy_id: int
    engine: StrategyEngine
    parameters: Dict

    model_config = ConfigDict(from_attributes=True)


class BacktestRead(BacktestCreate):
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

class OrderRead(OrderCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ChartCreate(BaseModel):
    name: str = Field(..., description="Display name for the chart")
    type: ChartType = Field(..., description="Visual representation type (area, candle, line, etc.)")
    data_type: DataType = Field(..., description="Source of chart data (stored in DB or external)")
    backtest_id: int = Field(..., description="Associated backtest identifier")

    model_config = ConfigDict(from_attributes=True)


class ChartRead(ChartCreate):
    id: int = Field(..., description="Unique chart identifier")

    model_config = ConfigDict(from_attributes=True)
