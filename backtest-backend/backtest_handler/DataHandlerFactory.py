"""
Factory for creating DataHandler instances based on backtest engine type.

This factory provides a centralized way to create appropriate DataHandler
instances for different backtest engines while maintaining type safety
and extensibility.
"""
from typing import Dict, Type, Optional
from abc import ABC, abstractmethod
import logging
from models import Backtest
from backtest_handler.BacktestEngine import BacktestEngine
from backtest_handler.DataHandler import DataHandler
from backtest_handler.lean.LeanDataHandler import LeanDataHandler

class DataHandlerFactory:
    """
    Factory for creating DataHandler instances based on backtest engine type.

    This factory uses the registry pattern to allow easy extension for new
    backtest engines while maintaining type safety and proper error handling.
    """

    _handlers: Dict[BacktestEngine, Type[DataHandler]] = {
        BacktestEngine.LEAN: LeanDataHandler
    }

    @classmethod
    def create_handler(cls, backtest: Backtest) -> DataHandler:
        """
        Create a DataHandler instance for the given backtest.

        Args:
            backtest: The backtest model containing engine information

        Returns:
            Configured DataHandler instance

        Raises:
            ValueError: If no handler is registered for the backtest engine
        """
        engine = BacktestEngine(backtest.engine)
        if backtest.engine not in cls._handlers:
            available_engines = list(cls._handlers.keys())
            raise ValueError(
                f"No DataHandler registered for engine '{engine.value}'. "
                f"Available engines: {[e.value for e in available_engines]}"
            )

        handler_class = cls._handlers[engine]

        try:
            return handler_class(backtest)
        except Exception as e:
            raise RuntimeError(f"Failed to create DataHandler: {e}") from e
