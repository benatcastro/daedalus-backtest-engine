"""
Main data handler module providing high-level interface for candlestick data access.

This module provides the primary interface for accessing candlestick data
from various backtest engines. It abstracts away the complexity of different
data formats and provides a unified API.
"""

from typing import List, Optional, Dict
from datetime import datetime
from abc import ABC, abstractmethod
from backtest.Candle import Candle


class DataHandler(ABC):
    """
    High-level interface for accessing candlestick data.

    This class provides a simplified API for retrieving candlestick data
    while handling the complexity of different data sources, caching,
    and error handling behind the scenes.
    """

    def __init__(self):
        """
        Initialize the DataHandler with configuration.

        Args:
            config: DataConfig object containing settings for data access
        """

    @abstractmethod
    async def get_candles(
        self,
        symbol: str,
        start_time: datetime,
        end_time: datetime,
        resolution: str = "1m",
    ) -> List[Candle]:
        """
        Retrieve candlestick data for the specified parameters.

        Args:
            symbol: Trading symbol (e.g., "BTCUSD")
            start_time: Start of the time range
            end_time: End of the time range
            resolution: Time resolution (e.g., "1m", "1h", "1d")

        Returns:
            List of Candle objects

        Raises:
            DataException: If data retrieval fails
        """
        pass

    @abstractmethod
    async def get_available_symbols(self) -> Dict[str, List[str]]:
        """
        Get a list of all available trading symbols.

        Returns:
            List of symbol strings
        """
        pass

    @abstractmethod
    async def get_date_range_for_symbol(
        self, symbol: str
    ) -> Optional[tuple[datetime, datetime]]:
        """
        Get the available date range for a specific symbol.

        Args:
            symbol: Trading symbol to check

        Returns:
            Tuple of (start_date, end_date) or None if no data available
        """
