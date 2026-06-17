from pathlib import Path
import os
from glob import glob
from typing import Dict, Any, List, Optional
from BacktestChooseModes import BacktestChooseModes
import json
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime, timezone
from SerieTypes import SerieTypes


class BacktestVisualizer:
    def __init__(self, strategy_name: str, config: Dict[str, Any]):
        self.__config: Dict[str, Any] = config
        self.__strategy_name: str = strategy_name
        self.__backtest_path: Optional[Path] = None

        self._load_backtest_folder()
        print(f"Visualizing: {self.__backtest_path}")
        assert self.__backtest_path != None

        self.__files: List[Path] = [x for x in self.__backtest_path.iterdir() if x.is_file()]
        self.__directories: List[Path] = [x for x in self.__backtest_path.iterdir() if x.is_dir()]
        self.__backtest_id: int = self.__get_backtest_id()
        self.__charts: Optional[Dict[str, Any]] = None
        self.__orders:Optional[Dict[str, Any]] = None 


        # Assert that the backtest folder is loaded
        print("Backtest folder: ", os.listdir(self.__backtest_path))

    def _choose_most_recent_backtest(self, backtests: List[Path]) -> Path:
        """Returns the newest folder from the list of paths"""
        return max(backtests, key=lambda path: os.path.getctime(path))
    
    def _load_backtest_folder(self) -> None:
        """Navigates to the directory where the strategy is located and chooses the backtest to analyze"""
        strategy_backtest_folder: Path = Path(self.__config.get("strategy_directory"),
                                                self.__strategy_name,
                                                self.__config.get("backtest_folder"))

        # Exit if the backtest folder doesn't exist
        if not strategy_backtest_folder.exists():
            raise Exception(f"Strategy {self.__strategy_name} doesn't exist in {self.__config.get('strategy_directory')}")
            
        # Get all the subdirectories inside the strategy backtests folder
        backtests: List[Path] = [Path(f.path) for f in os.scandir(strategy_backtest_folder) if f.is_dir()]

        # Based on the configured backtest_choose_mode we filter the possible backtests
        # TODO: Create a factory, improve choosing method calling, polymorphism...
        match self.__config.get("backtest_choose_mode"):
            case BacktestChooseModes.MOST_RECENT:
                self.__backtest_path = self._choose_most_recent_backtest(backtests)
            case BacktestChooseModes.ASK:
                pass

    def __get_backtest_id(self) -> int:
        # Get the backtest id
        config_file = next(filter(lambda x: x.name == "config", self.__files))
        with config_file.open("r") as file:
            data = json.load(file)

        # Extract the id
        return data.get("id")

    def parse_results(self) -> None:
        result_file: Path = next(filter(lambda x: x.stem == str(self.__backtest_id) and x.suffix == ".json",
                                        self.__files))
        with result_file.open("r") as file:
            data = json.load(file)
        
        #TODO: Handle other results, right now we will only focus on processing charts
        self.__charts = data["charts"]
        self.__orders = data["orders"]
    
    def display_chart(self, chart_name: str):
        # Retrieve chart

        fig  = go.Figure()
        chart_data: Optional[Dict[str, Any]] = self.__charts.get(chart_name, None)

        assert chart_data is not None

        # Process the series
        for serie in chart_data["series"].values():
            self.__process_chart_serie(fig, serie)
        
        # Display the orders on the candlestic
        #self.__add_orders_to_chart(fig, self.__orders.values())


        # Show plot
        fig.show()

    def __plot_serie_maker(self, figure, serie):
        pass

    def __add_orders_to_chart(self, figure, orders):
        """Adds buy and sell orders to an existing candlestick chart."""
        order_times = []
        order_prices = []
        order_types = []

        for order in orders.values():
            order_time = datetime.fromisoformat(order["time"].replace("Z", "+00:00"))
            order_price = order["price"]
            order_direction = "BUY" if order["direction"] == 0 else "SELL"
            
            order_times.append(order_time)
            order_prices.append(order_price)
            order_types.append(order_direction)

        # Add order markers
        figure.add_trace(go.Scatter(
            x=order_times,
            y=order_prices,
            mode="markers",
            marker=dict(
                size=10,
                color=["green" if t == "BUY" else "red" for t in order_types],
                symbol=["triangle-up" if t == "BUY" else "triangle-down" for t in order_types]
            ),
            name="Orders"
        ))
        order_types.append(order_direction)

        # Add order markers
        figure.add_trace(go.Scatter(
            x=order_times,
            y=order_prices,
            mode="markers",
            marker=dict(
                size=10,
                color=["green" if t == "BUY" else "red" for t in order_types],
                symbol=["triangle-up" if t == "BUY" else "triangle-down" for t in order_types]
            ),
            name="Orders"
        ))


    def __candlestick_serie_maker(self, figure, serie):
        name = serie["name"]
        values = serie["values"]
        
        # TODO: take serieType into account
        # Convert to DataFrame
        df = pd.DataFrame(values, columns=["timestamp", "open", "high", "low", "close"])
        # Convert timestamp to datetime

        df["timestamp"] = df["timestamp"].apply(lambda x: datetime.fromtimestamp(x, tz=timezone.utc))
        figure.add_trace(go.Candlestick(
            x=df["timestamp"],
            open=df["open"],
            high=df["high"],
            low=df["low"],
            close=df["close"],
            name=name  # Name for the legend
        ))

        figure.update_layout(
            title="Candlestick Chart",
            xaxis_title="Time",
            yaxis_title="Price ($)",
            xaxis_rangeslider_visible=False,
            xaxis=dict(
                rangebreaks=[
                    dict(bounds=["sat", "mon"]),  # Hide weekends
                    dict(pattern="hour", bounds=[20, 13.5])  # Hide market closing hours (16:00 to 09:00)
                ]
            )
        )

        #fig.update_layout(xaxis_type="category")
        print("Serie: ", str(serie))

    def __serie_processor_factory(self, type: SerieTypes):
        serie_maker_dict = {
            SerieTypes.CANDLESTICK: self.__candlestick_serie_maker,
            SerieTypes.PLOT: self.__plot_serie_maker
        }
        return serie_maker_dict.get(type)


    
    def __process_chart_serie(self, figure, serie: Dict[str, Any]):

        type_as_int: SerieTypes = serie["seriesType"]
        serie_type: Optional[SerieTypes] = None 

        # TODO: Improve the way of serializing the serie type value
        if (serie["seriesType"] == 2):
            serie_type = SerieTypes.CANDLESTICK
        else:
            serie_type = SerieTypes.PLOT

        maker = self.__serie_processor_factory(serie_type)
        maker(figure, serie)
        #fig.update_layout(xaxis_type="category")
        print("Serie: ", str(serie))
