from typing import Dict, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from enum import Enum


class StrategyEngine(str, Enum):
    LEAN = "LEAN"
    BACKTESTING = "BACKTESTING"


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


class Order(BaseModel):
    order_id: int = Field(..., description="Unique order identifier")
    engine: StrategyEngine = Field(..., description="Backtesting Engine")
    time: datetime = Field(..., description="Order timestamp")
    symbol: str = Field(..., description="Trading symbol")
    side: OrderSide = Field(..., description="Buy or sell")
    quantity: float = Field(..., description="Order quantity")
    status: OrderStatus = Field(..., description="Order status")
    parameters: Dict


class BacktestCreate(BaseModel):
    name: str
    description: Optional[str] = None
    starting_date: datetime
    ending_date: datetime
    strategy_id: int
    engine: StrategyEngine
    parameters: Dict

    model_config = ConfigDict(from_attributes=True)


class OrderRead(Order):
    id: int

    model_config = ConfigDict(from_attributes=True)


class BacktestRead(BacktestCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
