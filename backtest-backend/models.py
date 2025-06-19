# app/models.py
from sqlalchemy import Column, Integer, Enum, JSON, String, Text, DateTime

from database import Base
from datetime import datetime, timezone
from backtest_handler.BacktestEngine import BacktestEngine


class Backtest(Base):
    __tablename__ = "backtests"

    id = Column(Integer, primary_key=True)
    strategy_id = Column(Integer)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    starting_date = Column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    ending_date = Column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    engine = Column(Enum(BacktestEngine))
    parameters = Column(JSON)
