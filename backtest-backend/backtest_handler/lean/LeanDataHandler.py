"""
Lean-specific DataHandler implementation.

This module provides a minimal implementation of DataHandler for Lean engine
backtests, focusing on extracting symbol information and providing basic
candlestick data access capabilities.
"""
import logging
import zipfile
import csv
import io
from typing import List, Optional, Set, Dict
from datetime import datetime
from models import Backtest
from backtest_handler.DataHandler import DataHandler
from backtest_handler.data.models import Candle
from schemas.LeanBacktest import LeanBacktest, DataRequest
from config import settings
from backtest_handler.lean.Exceptions import UnexpectedZipContentError
from logger import logger

class LeanDataHandler(DataHandler):
    """
    DataHandler implementation for Lean engine backtests.

    This handler extracts available symbols from Lean backtest parameters
    and provides basic validation for data requests.
    """

    def __init__(self, backtest: Backtest):
        """Initialize the Lean DataHandler."""
        self._backtest: LeanBacktest = LeanBacktest.from_backtest_model(backtest)
        logger.debug(f"Initialized LeanDataHandler for backtest {backtest.id}")

    async def get_candles(
        self,
        symbol: str,
        start_time: datetime,
        end_time: datetime,
        resolution: str = "minute"
    ) -> List[Candle]:
        """
        Retrieve candlestick data for the specified parameters.

        Args:
            symbol: Trading symbol (e.g., "ETHUSDT")
            start_time: Start of the time range
            end_time: End of the time range
            resolution: Time resolution (e.g., "1m", "1h", "1d")

        Returns:
            List of Candle objects

        Raises:
            ValueError: If symbol not available or invalid time range
        """

        # TODO Manage Quote/Trade files better
        # filter the data request for the correspondendt symbol
        data_requests = list(
            filter(lambda dr: dr.symbol == symbol and dr.resolution == resolution and dr.data_type == "trade",
                   self._backtest.succeeded_data_requests))

        result: List[Candle] = []

        for data_request in data_requests:
            zip_path = settings.LEAN_BASE_DATA_PATH.joinpath(data_request.path)
            logger.info(f"Proccesing file: {zip_path}")

            if not zip_path.exists():
                raise FileNotFoundError(f"ZIP file not found: {zip_path}")
            try:
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    # Get list of all files in the ZIP
                    file_list = zip_ref.namelist()
                    logger.info(f"Found {len(file_list)} files in {zip_path}: {file_list}")

                    if len(file_list) != 1:
                        raise UnexpectedZipContentError()
                    # Open the csv data file
                    with zip_ref.open(file_list[0]) as csv_file:
                        # Convert to text stream
                        text_stream = io.TextIOWrapper(csv_file, encoding="utf-8")

                        # Read the stream as a csv
                        csv_reader = csv.reader(text_stream, delimiter=",")

                        for row in csv_reader:
                            # Unpack the row
                            milliseconds_since_midnight, open, high, low, close, volume = row

                            # Calculate minute and hours from milliseconds since midnight
                            minute = (int(milliseconds_since_midnight) // 60000) % 60  # get the minute part as int
                            hour = (int(milliseconds_since_midnight) // 3600000) % 24  # get the hour part as int

                            # Create a new datetime with real date of the candle
                            candle_date = data_request.date.replace(hour=hour, minute=minute)

                            # Append the new candle to the result if his datetime is within range
                            if start_time <= candle_date <= end_time:
                                result.append(Candle(candle_date,open, high, low, close, float(volume)))

            except zipfile.BadZipFile as e:
                logger.error(f"Invalid ZIP file {zip_path}: {e}")
                raise
            except UnicodeDecodeError as e:
                logger.error(f"Unable to decode file content as UTF-8: {e}")
                raise

        return result

    async def get_available_symbols(self) -> Dict[str, List[str]]:
        """
        Get symbols and their available resolutions from this Lean backtest.

        Extracts symbols from backtest data requests (both succeeded and failed).
        For each symbol, collects all unique resolutions that were requested
        during the backtest execution.

        Returns:
            Dictionary mapping symbol names to lists of available resolutions.
            Example: {"ETHUSDT": ["minute"], "BTCBUSD": ["minute", "hour"]}

        Note:
            - Symbol names are normalized to uppercase for consistency
            - Resolutions are deduplicated per symbol
            - Both successful and failed data requests are included to capture
              all attempted symbol/resolution combinations
        """

        symbols: Dict[str, List[str]] = dict()

        def extract_symbols_from_data_requests(data_requests: List[DataRequest]):
            for data_request in data_requests:
                normalized_symbol = data_request.symbol.upper()
                symbol_resolutions = symbols.get(normalized_symbol)

                # First time adding the symbol
                if not symbol_resolutions:
                    symbols[normalized_symbol] = [data_request.resolution]
                elif data_request.resolution not in symbol_resolutions:
                    symbol_resolutions.append(data_request.resolution)

        # Extract the symbols from succeeded and failed data requests
        extract_symbols_from_data_requests(self._backtest.succeeded_data_requests)
        extract_symbols_from_data_requests(self._backtest.failed_data_requests)

        return symbols

    async def get_date_range_for_symbol(self, symbol: str) -> Optional[tuple[datetime, datetime]]:
        """
        Get the available date range for a symbol in this backtest.

        For Lean backtests, this returns the backtest date range if the symbol
        is available, or None if the symbol is not found.

        Args:
            symbol: Trading symbol to check

        Returns:
            Tuple of (start_date, end_date) or None if symbol not available
        """
        available_symbols = await self.get_available_symbols()
        if symbol.upper() not in [s.upper() for s in available_symbols]:
            logger.warning(f"Symbol {symbol} not found in backtest {self._backtest.id}")
            return None

        # For Lean backtests, use the backtest date range
        date_range = (self._backtest.starting_date, self._backtest.ending_date)
        logger.debug(f"Date range for {symbol}: {date_range}")

        return date_range
