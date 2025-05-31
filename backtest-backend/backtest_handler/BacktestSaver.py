from abc import ABC, abstractmethod
from backtest_handler.BacktestEngine import BacktestEngine
from typing import Dict
from schemas.backtest import BacktestCreate
import datetime

class BacktestSaver(ABC):
	def __init__(self, name: str, description: str, strategy_id: int, engine: BacktestEngine):
		self._name = name
		self._description = description
		self._strategy_id = strategy_id
		self._engine = engine
		super().__init__()

	@abstractmethod
	def get_starting_date(self) -> datetime:
		pass

	@abstractmethod
	async def process(self):
		pass

	@abstractmethod
	def get_ending_date(self) -> datetime:
		pass

	def get_name(self) -> str:
		pass

	def get_description(self) -> str:
		pass

	def get_engine(self) -> BacktestEngine:
		pass

	@abstractmethod
	def get_parameters(self) -> Dict:
		pass

	def get_backtest_create_schema(self) -> BacktestCreate:
		return


