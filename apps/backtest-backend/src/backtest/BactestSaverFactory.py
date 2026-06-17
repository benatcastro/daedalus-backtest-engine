from backtest.BacktestEngine import BacktestEngine
from backtest.BacktestSaver import BacktestSaver


class BacktestSaverFactory:
    @staticmethod
    def create(engine_type: BacktestEngine, **kwargs) -> "BacktestSaver":
        if engine_type == BacktestEngine.LEAN:
            from backtest.lean.LeanBacktestSaver import LeanBacktestSaver

            return LeanBacktestSaver(**kwargs)
        else:
            raise ValueError(f"Unsupported engine type: {engine_type}")
