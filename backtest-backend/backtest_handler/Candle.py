"""
Core domain models for candlestick data handling.
These are immutable value objects representing the fundamental data types.
"""
from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Candle:
    """
    Immutable value object representing a single candlestick.

    Attributes:
        timestamp: Unix timestamp or datetime of the candle
        open: Opening price
        high: Highest price during the period
        low: Lowest price during the period
        close: Closing price
        volume: Trading volume during the period
    """
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float = 0.0

    def __post_init__(self):
        """Validate OHLC constraints after initialization."""
        if not self._validate_ohlc():
            raise ValueError(
                f"Invalid OHLC data: high ({self.high}) must be >= max(open, close), "
                f"low ({self.low}) must be <= min(open, close)"
            )

        if self.volume < 0:
            raise ValueError(f"Volume cannot be negative: {self.volume}")

    def _validate_ohlc(self) -> bool:
        """Validate that OHLC values follow proper constraints."""
        max_price = max(self.open, self.close)
        min_price = min(self.open, self.close)

        return (
            self.high >= max_price and
            self.low <= min_price and
            self.high >= self.low
        )

    @property
    def datetime(self) -> datetime:
        """Get datetime representation of timestamp."""
        if isinstance(self.timestamp, datetime):
            return self.timestamp
        return datetime.fromtimestamp(self.timestamp)

