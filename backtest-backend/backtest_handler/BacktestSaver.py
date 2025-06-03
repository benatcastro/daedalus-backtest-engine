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
	async def process(self):
		pass
	@property
	def name(self) -> str:
		return self._name

	@property
	def description(self) -> str:
		return self._description

	@property
	def engine(self) -> BacktestEngine:
		return self._engine

	@property
	def strategy_id(self) -> int:
		return self._strategy_id

	@property
	@abstractmethod
	def starting_date(self) -> datetime:
		pass

	@property
	@abstractmethod
	def ending_date(self) -> datetime:
		pass

	@property
	@abstractmethod
	def parameters(self) -> Dict:
		pass

	def get_backtest_create_schema(self) -> BacktestCreate:
		return


