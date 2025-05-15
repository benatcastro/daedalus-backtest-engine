from backtest_handler.BacktestEngine import BacktestEngine
from backtest_handler.lean.LeanBacktestSaver import LeanBacktestSaver
from backtest_handler.BacktestSaver import BacktestSaver

class BacktestSaverFactory:
	@staticmethod
	def create(engine_type: BacktestEngine, **kwargs) -> 'BacktestSaver':

		if engine_type == BacktestEngine.LEAN:
			from backtest_handler.lean.LeanBacktestSaver import LeanBacktestSaver
			return LeanBacktestSaver(**kwargs)
		else:
			raise ValueError(f"Unsupported engine type: {engine_type}")
