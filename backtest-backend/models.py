# app/models.py
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, Enum, JSON, String, Text, DateTime

from database import Base
import enum
from datetime import datetime


class Backtest(Base):
    __tablename__ = "backtests"

    id = Column(Integer, primary_key=True)
    strategy_id = Column(Integer)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    starting_date = Column(DateTime)
    ending_date = Column(DateTime)
    engine = Column(Enum("LEAN", "BACKTESTING", name="backtest_status"))
    parameters  = Column(JSON)
