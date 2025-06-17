"""
Lean-specific DataHandler implementation.

This module provides a minimal implementation of DataHandler for Lean engine
backtests, focusing on extracting symbol information and providing basic
candlestick data access capabilities.
"""
import csv
import io
import logging
import time
import zipfile
from config import settings
from logger import logger
from datetime import datetime
from models import Backtest
from backtest_handler.Candle import Candle
from typing import List, Optional, Set, Dict
from backtest_handler.DataHandler import DataHandler
from schemas.LeanBacktest import LeanBacktest, DataRequest
from backtest_handler.lean.LeanExceptions import UnexpectedZipContentError
from backtest_handler.Exceptions import (
    BacktestDataException,
    CandlestickDataNotAvailableException,
    SymbolNotAvailableException,
    ResolutionNotAvailableException,
    TimeRangeNotAvailableException
)

# TODO Normalize the exceptions in abstract class
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
            resolution: Time resolution (e.g., "minute", "hour", "day")

        Returns:
            List of Candle objects

        Raises:
            SymbolNotAvailableException: If symbol not available in backtest
            ResolutionNotAvailableException: If resolution not available for symbol
            DataRangeNotAvailableException: If requested time range is outside data coverage
            NoDataAvailableException: If no data available at all
        """

        start_time_processing = time.time()
        logger.debug(f"Starting to retrieve candles for {symbol} ({resolution}) from {start_time} to {end_time}")

        # Get available symbols to validate the request
        available_symbols = await self.get_available_symbols()

        # Validate symbol availability
        symbol_upper = symbol.upper()
        if symbol_upper not in available_symbols:
            logger.warning(f"Symbol '{symbol}' not found in backtest data")
            raise SymbolNotAvailableException(
                symbol=symbol,
                available_symbols=list(available_symbols.keys())
            )

        # Validate resolution availability for this symbol
        available_resolutions = available_symbols[symbol_upper]
        resolution_lower = resolution.lower()
        if resolution_lower not in available_resolutions:
            logger.warning(f"Resolution '{resolution}' not available for symbol '{symbol}'")
            raise ResolutionNotAvailableException(
                symbol=symbol,
                resolution=resolution,
                available_resolutions=available_resolutions
            )

        # TODO Manage Quote/Trade files better
        # filter the data request for the correspondendt symbol
        data_requests = list(
            filter(lambda dr: dr.symbol.lower() == symbol.lower() and dr.resolution.lower() == resolution.lower() and dr.data_type == "trade",
                   self._backtest.succeeded_data_requests))

        if not data_requests:
            logger.warning(f"No data requests found for {symbol} with resolution {resolution}")
            raise CandlestickDataNotAvailableException(
                symbol=symbol,
                resolution=resolution,
                message=f"No trade data available for {symbol} at {resolution} resolution"
            )

        result: List[Candle] = []

        for data_request in data_requests:
            zip_path = settings.LEAN_BASE_DATA_PATH.joinpath(data_request.path)
            #logger.debug(f"Proccesing file: {zip_path}")

            if not zip_path.exists():
                raise FileNotFoundError(f"ZIP file not found: {zip_path}")
            try:
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    # Get list of all files in the ZIP
                    file_list = zip_ref.namelist()

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
                            # TODO investigate how to handle last candle of the day 00:00
                            if start_time <= candle_date <= end_time:
                                result.append(
                                    Candle(
                                        timestamp=candle_date,
                                        open=open,
                                        high=float(high),
                                        low=float(low),
                                        close=float(close),
                                        volume=float(volume)
                                    ))

            except zipfile.BadZipFile as e:
                logger.error(f"Invalid ZIP file {zip_path}: {e}")
                raise
            except UnicodeDecodeError as e:
                logger.error(f"Unable to decode file content as UTF-8: {e}")
                raise

        processing_time = time.time() - start_time_processing

        # Validate that we have data for the requested time range
        if not result:
            # Get the available date range for this symbol to provide helpful feedback
            date_range = await self.get_date_range_for_symbol(symbol)
            available_date_range = None
            if date_range:
                available_date_range = {
                    "start": date_range[0],
                    "end": date_range[1]
                }

            logger.warning(f"No candlestick data found for {symbol} in time range {start_time} to {end_time}")
            raise TimeRangeNotAvailableException(
                symbol=symbol,
                resolution=resolution,
                start_time=start_time,
                end_time=end_time,
                available_date_range=available_date_range
            )

        logger.info(f"Obtained {len(result)} candles for {symbol} in {processing_time:.2f} seconds")
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
