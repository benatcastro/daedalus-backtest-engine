"""
Core domain models for candlestick data handling.
These are immutable value objects representing the fundamental data types.
"""

from datetime import datetime
from pydantic import BaseModel, Field


class Candle(BaseModel):
    """
    Pydantic validation schema representing a single candlestick.

    Attributes:
        timestamp: Unix timestamp or datetime of the candle
        open: Opening price
        high: Highest price during the period
        low: Lowest price during the period
        close: Closing price
        volume: Trading volume during the period
    """

    timestamp: datetime = Field(
        ..., description="Unix timestamp or datetime of the candle"
    )
    open: float = Field(..., description="Opening price")
    high: float = Field(..., description="Highest price during the period")
    low: float = Field(..., description="Lowest price during the period")
    close: float = Field(..., description="Closing price")
    volume: float = Field(0.0, description="Trading volume during the period")

    """
    @field_validator("high")
    def validate_high(cls, high, values):
        max_price = max(cls.open, cls.close)
        if high < max_price:
            raise ValueError(f"High ({high}) must be >= max(open, close)")
        return high

    @field_validator("low")
    def validate_low(cls, low, values):
        min_price = min(cls.open, cls.close)
        if low > min_price:
            raise ValueError(f"Low ({low}) must be <= min(open, close)")
        return low

    @field_validator("volume")
    def validate_volume(cls, volume):
        if volume < 0:
            raise ValueError(f"Volume cannot be negative: {volume}")
        return volume
    """
