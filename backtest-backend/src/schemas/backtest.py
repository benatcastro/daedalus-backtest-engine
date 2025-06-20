from typing import Dict, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from enum import Enum


class StrategyEngine(str, Enum):
    LEAN = "LEAN"
    BACKTESTING = "BACKTESTING"


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
