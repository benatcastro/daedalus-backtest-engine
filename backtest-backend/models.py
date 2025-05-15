# app/models.py
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, Float, String, DateTime, JSON, Enum, ForeignKey
from database import Base
import enum
from datetime import datetime


class Backtest(Base):
    __tablename__ = "backtests"

    id = Column(Integer, primary_key=True)
    engine = Column(Enum("LEAN", "BACKTESTING", name="backtest_status"))
    strategy_id = Column(Integer)
    parameters  = Column(JSON)
