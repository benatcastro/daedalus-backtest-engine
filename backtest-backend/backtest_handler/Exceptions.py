"""
Custom exceptions for backtest data availability and retrieval errors.

This module defines specific exceptions that can be raised when requested
symbols, resolutions, or data ranges are not available in the backtest data.
These exceptions provide structured error information for the frontend to
handle gracefully with appropriate user feedback.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime


class BacktestDataException(Exception):
    """
    Base exception for all backtest data-related errors.

    Provides a common interface for all data availability issues
    with structured error information for API responses.
    """

    def __init__(
        self, message: str, error_code: str, details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API response."""
        return {
            "error": self.error_code,
            "message": self.message,
            "details": self.details,
        }


class CandlestickDataNotAvailableException(BacktestDataException):
    """
    Exception raised when candlestick data is not available for a requested symbol,
    resolution, or time range in the backtest data.

    This exception provides specific context about what data was requested
    and what alternatives might be available.
    """

    def __init__(
        self,
        symbol: str,
        resolution: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        available_symbols: Optional[List[str]] = None,
        available_resolutions: Optional[List[str]] = None,
        available_date_range: Optional[Dict[str, datetime]] = None,
        message: Optional[str] = None,
    ):
        """
        Initialize the candlestick data not available exception.

        Args:
            symbol: The requested symbol that is not available
            resolution: The requested resolution that is not available
            start_time: The requested start time (if applicable)
            end_time: The requested end time (if applicable)
            available_symbols: List of symbols that are available
            available_resolutions: List of resolutions that are available for this symbol
            available_date_range: Dictionary with 'start' and 'end' datetime keys for available range
            message: Custom error message (auto-generated if not provided)
        """
        if message is None:
            time_range = ""
            if start_time and end_time:
                time_range = f" for time range {start_time.isoformat()} to {end_time.isoformat()}"
            elif start_time:
                time_range = f" from {start_time.isoformat()}"
            elif end_time:
                time_range = f" until {end_time.isoformat()}"

            message = f"Candlestick data not available for symbol '{symbol}' at resolution '{resolution}'{time_range}"

        details = {
            "requested_symbol": symbol,
            "requested_resolution": resolution,
            "requested_start_time": start_time.isoformat() if start_time else None,
            "requested_end_time": end_time.isoformat() if end_time else None,
            "available_symbols": available_symbols,
            "available_resolutions": available_resolutions,
            "available_date_range": {
                "start": available_date_range["start"].isoformat()
                if available_date_range and "start" in available_date_range
                else None,
                "end": available_date_range["end"].isoformat()
                if available_date_range and "end" in available_date_range
                else None,
            }
            if available_date_range
            else None,
        }

        super().__init__(
            message=message,
            error_code="CANDLESTICK_DATA_NOT_AVAILABLE",
            details=details,
        )

        # Store original objects for programmatic access
        self.symbol = symbol
        self.resolution = resolution
        self.start_time = start_time
        self.end_time = end_time
        self.available_symbols = available_symbols
        self.available_resolutions = available_resolutions
        self.available_date_range = available_date_range

    def get_suggestions(self) -> Dict[str, Any]:
        """
        Get suggestions for alternative data that might be available.

        Returns:
            Dictionary with suggestions for symbol, resolution, or time range alternatives
        """
        suggestions = {}

        if self.available_symbols and len(self.available_symbols) > 0:
            # Find similar symbols (case-insensitive partial matches)
            similar_symbols = [
                s
                for s in self.available_symbols
                if self.symbol.lower() in s.lower() or s.lower() in self.symbol.lower()
            ]
            if similar_symbols:
                suggestions["similar_symbols"] = similar_symbols[
                    :5
                ]  # Limit to 5 suggestions
            else:
                suggestions["available_symbols"] = self.available_symbols[
                    :10
                ]  # Show first 10

        if self.available_resolutions and len(self.available_resolutions) > 0:
            suggestions["available_resolutions"] = self.available_resolutions

        if self.available_date_range:
            suggestions["available_date_range"] = {
                "start": self.available_date_range["start"].isoformat(),
                "end": self.available_date_range["end"].isoformat(),
            }

        return suggestions

    @classmethod
    def symbol_not_found(
        cls, symbol: str, available_symbols: Optional[List[str]] = None
    ) -> "CandlestickDataNotAvailableException":
        """
        Create exception for when a symbol is not found in the backtest data.

        Args:
            symbol: The requested symbol that was not found
            available_symbols: List of symbols that are available

        Returns:
            CandlestickDataNotAvailableException instance
        """
        return cls(
            symbol=symbol,
            resolution="any",
            available_symbols=available_symbols,
            message=f"Symbol '{symbol}' not found in backtest data",
        )

    @classmethod
    def resolution_not_available(
        cls,
        symbol: str,
        resolution: str,
        available_resolutions: Optional[List[str]] = None,
    ) -> "CandlestickDataNotAvailableException":
        """
        Create exception for when a resolution is not available for a symbol.

        Args:
            symbol: The symbol being requested
            resolution: The resolution that is not available
            available_resolutions: List of resolutions that are available for this symbol

        Returns:
            CandlestickDataNotAvailableException instance
        """
        return cls(
            symbol=symbol,
            resolution=resolution,
            available_resolutions=available_resolutions,
            message=f"Resolution '{resolution}' not available for symbol '{symbol}'",
        )

    @classmethod
    def time_range_not_available(
        cls,
        symbol: str,
        resolution: str,
        start_time: datetime,
        end_time: datetime,
        available_date_range: Optional[Dict[str, datetime]] = None,
    ) -> "CandlestickDataNotAvailableException":
        """
        Create exception for when data is not available for the requested time range.

        Args:
            symbol: The symbol being requested
            resolution: The resolution being requested
            start_time: The requested start time
            end_time: The requested end time
            available_date_range: Dictionary with 'start' and 'end' datetime keys

        Returns:
            CandlestickDataNotAvailableException instance
        """
        return cls(
            symbol=symbol,
            resolution=resolution,
            start_time=start_time,
            end_time=end_time,
            available_date_range=available_date_range,
            message=f"Data not available for symbol '{symbol}' at resolution '{resolution}' "
            f"for time range {start_time.isoformat()} to {end_time.isoformat()}",
        )


class SymbolNotAvailableException(BacktestDataException):
    """
    Exception raised when a requested symbol is not available in the backtest data.

    This exception provides specific context about the requested symbol
    and suggests available alternatives.
    """

    def __init__(
        self,
        symbol: str,
        available_symbols: Optional[List[str]] = None,
        message: Optional[str] = None,
    ):
        """
        Initialize the symbol not available exception.

        Args:
            symbol: The requested symbol that is not available
            available_symbols: List of symbols that are available
            message: Custom error message (auto-generated if not provided)
        """
        if message is None:
            message = f"Symbol '{symbol}' is not available in the backtest data"

        details = {
            "requested_symbol": symbol,
            "available_symbols": available_symbols,
        }

        super().__init__(
            message=message, error_code="SYMBOL_NOT_AVAILABLE", details=details
        )

        self.symbol = symbol
        self.available_symbols = available_symbols


class ResolutionNotAvailableException(BacktestDataException):
    """
    Exception raised when a requested resolution is not available for a specific symbol
    in the backtest data.

    This exception provides specific context about the requested resolution
    and lists available alternatives for the symbol.
    """

    def __init__(
        self,
        symbol: str,
        resolution: str,
        available_resolutions: Optional[List[str]] = None,
        message: Optional[str] = None,
    ):
        """
        Initialize the resolution not available exception.

        Args:
            symbol: The symbol for which the resolution is not available
            resolution: The requested resolution that is not available
            available_resolutions: List of resolutions that are available for this symbol
            message: Custom error message (auto-generated if not provided)
        """
        if message is None:
            message = (
                f"Resolution '{resolution}' is not available for symbol '{symbol}'"
            )

        details = {
            "requested_symbol": symbol,
            "requested_resolution": resolution,
            "available_resolutions": available_resolutions,
            "suggestions": self._get_resolution_suggestions(
                resolution, available_resolutions
            ),
        }

        super().__init__(
            message=message, error_code="RESOLUTION_NOT_AVAILABLE", details=details
        )

        self.symbol = symbol
        self.resolution = resolution
        self.available_resolutions = available_resolutions

    def _get_resolution_suggestions(
        self, resolution: str, available_resolutions: Optional[List[str]]
    ) -> Dict[str, Any]:
        """
        Get suggestions for similar or alternative resolutions.

        Args:
            resolution: The requested resolution
            available_resolutions: List of available resolutions

        Returns:
            Dictionary with resolution suggestions
        """
        suggestions = {}

        if not available_resolutions:
            return suggestions

        # Define resolution hierarchy for suggestions
        resolution_hierarchy = {
            "1m": ["5m", "15m", "30m", "1h"],
            "5m": ["1m", "15m", "30m", "1h"],
            "15m": ["5m", "30m", "1h", "4h"],
            "30m": ["15m", "1h", "4h", "1d"],
            "1h": ["30m", "4h", "1d"],
            "4h": ["1h", "1d", "1w"],
            "1d": ["4h", "1w", "1M"],
            "1w": ["1d", "1M"],
            "1M": ["1w", "1d"],
        }

        # Find exact case-insensitive match
        exact_matches = [
            r for r in available_resolutions if r.lower() == resolution.lower()
        ]
        if exact_matches:
            suggestions["exact_case_insensitive_match"] = exact_matches[0]
            return suggestions

        # Find hierarchical suggestions
        if resolution in resolution_hierarchy:
            hierarchical_suggestions = [
                r
                for r in resolution_hierarchy[resolution]
                if r in available_resolutions
            ]
            if hierarchical_suggestions:
                suggestions["recommended_alternatives"] = hierarchical_suggestions[:3]

        # If no hierarchical matches, just return all available
        if "recommended_alternatives" not in suggestions:
            suggestions["available_resolutions"] = available_resolutions

        return suggestions


class TimeRangeNotAvailableException(BacktestDataException):
    """
    Exception raised when data is not available for the requested time range.

    This exception provides specific context about the requested time range
    and information about the available data range.
    """

    def __init__(
        self,
        symbol: str,
        resolution: str,
        start_time: datetime,
        end_time: datetime,
        available_date_range: Optional[Dict[str, datetime]] = None,
        message: Optional[str] = None,
    ):
        """
        Initialize the time range not available exception.

        Args:
            symbol: The symbol being requested
            resolution: The resolution being requested
            start_time: The requested start time
            end_time: The requested end time
            available_date_range: Dictionary with 'start' and 'end' datetime keys
            message: Custom error message (auto-generated if not provided)
        """
        if message is None:
            message = (
                f"Data not available for symbol '{symbol}' at resolution '{resolution}' "
                f"for time range {start_time.isoformat()} to {end_time.isoformat()}"
            )

        details = {
            "requested_symbol": symbol,
            "requested_resolution": resolution,
            "requested_start_time": start_time.isoformat(),
            "requested_end_time": end_time.isoformat(),
            "available_date_range": {
                "start": available_date_range["start"].isoformat()
                if available_date_range and "start" in available_date_range
                else None,
                "end": available_date_range["end"].isoformat()
                if available_date_range and "end" in available_date_range
                else None,
            }
            if available_date_range
            else None,
            "suggestions": self._get_time_range_suggestions(
                start_time, end_time, available_date_range
            ),
        }

        super().__init__(
            message=message, error_code="TIME_RANGE_NOT_AVAILABLE", details=details
        )

        self.symbol = symbol
        self.resolution = resolution
        self.start_time = start_time
        self.end_time = end_time
        self.available_date_range = available_date_range

    def _get_time_range_suggestions(
        self,
        start_time: datetime,
        end_time: datetime,
        available_date_range: Optional[Dict[str, datetime]],
    ) -> Dict[str, Any]:
        """
        Get suggestions for alternative time ranges.

        Args:
            start_time: The requested start time
            end_time: The requested end time
            available_date_range: Dictionary with available date range

        Returns:
            Dictionary with time range suggestions
        """
        suggestions = {}

        if (
            not available_date_range
            or "start" not in available_date_range
            or "end" not in available_date_range
        ):
            return suggestions

        available_start = available_date_range["start"]
        available_end = available_date_range["end"]

        # Check if requested range overlaps with available range
        if start_time < available_end and end_time > available_start:
            # Partial overlap - suggest adjusted range
            adjusted_start = max(start_time, available_start)
            adjusted_end = min(end_time, available_end)
            suggestions["adjusted_range"] = {
                "start": adjusted_start.isoformat(),
                "end": adjusted_end.isoformat(),
                "reason": "Adjusted to available data range",
            }
        else:
            # No overlap - suggest available range
            suggestions["available_range"] = {
                "start": available_start.isoformat(),
                "end": available_end.isoformat(),
                "reason": "Requested range is outside available data",
            }

        return suggestions
