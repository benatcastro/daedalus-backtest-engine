from typing import Dict, Optional
from datetime import datetime
from pydantic import BaseModel
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

    class Config:
        orm_mode = True  # Include this to work well with FastAPI/SQLAlchemy


class BacktestRead(BacktestCreate):
    id: int

    class Config:
        orm_mode = True
