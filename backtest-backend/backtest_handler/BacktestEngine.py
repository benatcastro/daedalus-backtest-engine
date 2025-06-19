from enum import Enum


class BacktestEngine(str, Enum):
    LEAN = ("LEAN",)
    PLACEHOLDER = "PLACEHOLDER"
