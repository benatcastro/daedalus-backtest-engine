# app/models.py
from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Enum as SQLAlchemyEnum,
    JSON,
    String,
    Text,
    DateTime,
    Float,
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declared_attr
from database import Base
from datetime import datetime, timezone
from backtest.BacktestEngine import BacktestEngine
from sqlalchemy.sql import func
from enum import Enum as PyEnum


from models import BaseModel

class SeriesType(str, PyEnum):
    AREA = "area"
    CANDLE = "candle"
    LINE = "line"
    BAR = "bar"
    SCATTER = "scatter"

class DataType(str, PyEnum):
    STORED = "stored"
    EXTERNAL = "external"

class BacktestModel(BaseModel):
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
    engine = Column(SQLAlchemyEnum(BacktestEngine))
    parameters = Column(JSON)

    # Relationship
    series = relationship("SeriesModel", back_populates="backtest", cascade="all, delete-orphan")
    orders = relationship("OrderModel", back_populates="backtest", cascade="all, delete-orphan")

class OrderModel(BaseModel):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    backtest_id = Column(Integer, ForeignKey("backtests.id"), nullable=False)
    engine = Column(SQLAlchemyEnum(BacktestEngine), nullable=False)
    order_id = Column(String, nullable=False)
    time = Column(DateTime, nullable=False)
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    status = Column(String, nullable=False)
    parameters = Column(JSON, default=dict)

    # Relationship
    backtest = relationship("BacktestModel", back_populates="orders")

class SeriesModel(BaseModel):
    __tablename__ = "series"

    id = Column(Integer, primary_key=True)
    backtest_id = Column(Integer, ForeignKey("backtests.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(SQLAlchemyEnum(SeriesType), nullable=False)
    data_type = Column(SQLAlchemyEnum(DataType), nullable=False)
    data = Column(JSON, default=dict)
    parameters = Column(JSON, default=dict)

    # Relationship
    backtest = relationship("BacktestModel", back_populates="series")
