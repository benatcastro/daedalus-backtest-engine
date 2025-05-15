from typing import Union, Dict, Optional
from pydantic import BaseModel
from enum import Enum

class StrategyEngine(str, Enum):
    LEAN = "LEAN"
    BACKTESTING = "BACKTESTING"


class BacktestRead(BaseModel):
    id: int
    engine: str
    strategy_id: int
    parameters: Dict

    class Config:
        orm_mode = True

# Main create schema
class BacktestCreate(BaseModel):
    strategy_id: int
    engine: StrategyEngine
    parameters: Dict  # Accept raw JSON for now

class BacktestRead(BacktestCreate):
    id: int

    class Config:
        orm_mode = True
