# app/models.py
from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Enum,
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


class TimestampMixin:
    """Mixin to add created_at and updated_at timestamps to models"""

    @declared_attr
    def created_at(cls):
        return Column(DateTime, nullable=False, server_default=func.now())

    @declared_attr
    def updated_at(cls):
        return Column(
            DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
        )


class Backtest(Base, TimestampMixin):
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

    # Relationship
    orders = relationship(
        "Order", back_populates="backtest", cascade="all, delete-orphan"
    )


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    backtest_id = Column(Integer, ForeignKey("backtests.id"), nullable=False)
    engine = Column(Enum(BacktestEngine), nullable=False)
    order_id = Column(String, nullable=False)
    time = Column(DateTime, nullable=False)
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    status = Column(String, nullable=False)
    parameters = Column(JSON, default=dict)

    backtest = relationship("Backtest", back_populates="orders")
