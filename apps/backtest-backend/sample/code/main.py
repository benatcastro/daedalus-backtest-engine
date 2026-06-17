# region imports
from AlgorithmImports import *
# endregion


class Cienes(QCAlgorithm):
    MAX_TRADE_COUNT = 12
    STARTING_BUY_SIZE = 0.1  # Percentage of cash
    SL_PIPS = 1000
    TP_PIPS = 10000

    def initialize(self):
        # Locally Lean installs free sample data, to download more data please visit https://www.quantconnect.com/docs/v2/lean-cli/datasets/downloading-data
        self.set_start_date(2024, 10, 1)  # Set Start Date
        self.set_end_date(2025, 1, 1)  # Set End Date
        self.set_cash(100000)  # Set Strategy Cash
        self.set_brokerage_model(BrokerageName.BINANCE)

        self.eth = self.add_crypto("ETHUSDT", Resolution.MINUTE)
        self.eth.set_data_normalization_mode(DataNormalizationMode.RAW)
        self.buy_size = Cienes.STARTING_BUY_SIZE
        self.trade_count = 0
        self.order_ticket = None
        self.previous_price = None

        # Order tickets
        self.order_ticket = None
        self.sl_price = None
        self.tp_ticket = None

    def update_buy_size(self):
        if self.trade_count < Cienes.MAX_TRADE_COUNT:
            self.buy_size += self.trade_count / 100
        else:
            self.buy_size = Cienes.STARTING_BUY_SIZE

    def calculate_pip_size(self, price):
        """
        Estimates pip size based on the number of decimal places in price.

        :param price: The current price of the asset
        :return: Estimated pip size
        """
        decimal_places = str(price)[::-1].find(".")
        pip_size = (
            10**-decimal_places if decimal_places != -1 else 1
        )  # Default to 1 if no decimal
        self.debug(f"Pip Size wtih price {price} is: {pip_size}")
        return 0.01

    def get_pip_value(self, price, position_size, pip_size=0.01):
        pip_size = self.calculate_pip_size(price)

        pip_value = position_size * pip_size
        self.debug(f"Pip Value for price: {position_size} is: {pip_value}")
        return pip_value

    def get_position_price_by_percentage(self, percentage: float, cash: float):
        position_price = cash * percentage * 0.001
        return position_price

    def get_position_size_by_porcentage(
        self, percentage: float, cash: float, symbol_price: float
    ):
        spendable_cash = self.get_position_price_by_percentage(percentage, cash)
        position_size = spendable_cash / symbol_price
        self.debug(
            f"Se calcula el tamano de la posicion con el {percentage}% del total ({cash})"
        )
        self.debug(
            f"Resultado: {position_size} unidades de ETH a precio: {symbol_price} con valor de : {spendable_cash}"
        )
        return position_size

    def check_stop_loss(self):
        holding: Holding = self.portfolio[self.eth.symbol]
        price = self.eth.open
        # Check if there is a sl price to check
        if self.sl_price:
            if holding.is_long:
                if price <= self.sl_price:
                    self.debug("*******************************")
                    self.debug(
                        f"Stop loss triggered (long) price {price} stop loss: {self.sl_price}"
                    )
                    self.debug("*******************************")
                    self.liquidate(self.eth.symbol)
                    self.sl_price = None
                    self.order_ticket = None
                    self.tp_ticket = None
            else:
                if price >= self.sl_price:
                    self.debug("*******************************")
                    self.debug(
                        f"Stop loss triggered (short) price {price} stop loss: {self.sl_price}"
                    )
                    self.debug("*******************************")
                    self.liquidate(self.eth.symbol)
                    self.sl_price = None
                    self.order_ticket = None
                    self.tp_ticket = None

    def on_data(self, data: Slice):
        """on_data event is the primary entry point for your algorithm. Each new data point will be pumped in here.
        Arguments:
            data: Slice object keyed by symbol containing the stock data
        """

        price = self.eth.open
        rounded_price = round(price, 0)
        self.debug(
            f"[{data.time}] Precio redondeado: {rounded_price} O: {self.eth.open} H: {self.eth.high} C: {self.eth.close} L: {self.eth.low} V: {self.eth.volume}"
        )
        self.check_stop_loss()

        if self.previous_price is None:
            self.previous_price = price
            return

        # self.debug(f"Inversiones activas: {self.portfolio.invested}")
        if round(rounded_price, 0) % 100 == 0:
            # self.debug(f'El precio redondeado {rounded_price} es modulo de 100')
            if not self.portfolio.invested:
                self.debug("No hay inversiones activas, se abre una operacion")
                self.update_buy_size()
                position_size = self.get_position_size_by_porcentage(
                    self.buy_size, self.portfolio.cash, price
                )
                position_price = self.get_position_price_by_percentage(
                    self.buy_size, self.portfolio.cash
                )
                if self.previous_price < price:
                    self.debug(
                        f"El precio previo ({self.previous_price}) es menor que el actual ({price}) la direccion es LONG"
                    )
                    # Uptrend, long trade
                    stop_loss_price = price - (Cienes.SL_PIPS * 0.01)
                    take_profit_price = price + (Cienes.TP_PIPS * 0.01)
                    self.order_ticket = self.market_order(
                        self.eth.symbol, position_size
                    )
                    self.tp_ticket = self.limit_order(
                        self.eth.symbol, -position_size, take_profit_price
                    )
                    self.sl_price = stop_loss_price
                    self.debug(
                        f"LONG Trade: {position_price}$ Price: {price} SL: {stop_loss_price} TP: {take_profit_price}"
                    )
                else:
                    self.debug(
                        f"El precio previo ({self.previous_price}) es mayor que el actual ({price}) la direccion es SHORT"
                    )
                    # Downtrend short trade
                    stop_loss_price = price + (Cienes.SL_PIPS * 0.01)
                    take_profit_price = price - (Cienes.TP_PIPS * 0.01)
                    self.order_ticket = self.market_order(
                        self.eth.symbol, -position_size
                    )
                    self.tp_ticket = self.limit_order(
                        self.eth.symbol, position_size, take_profit_price
                    )
                    self.sl_price = stop_loss_price
                    self.debug(
                        f"SHORT Trade: {position_price}$ Price: {price} SL: {stop_loss_price} TP: {take_profit_price}"
                    )
            else:
                self.debug("Ya existen inversiones activas, no se hace nada")

        # Update previous price
        self.previous_price = price
        # self.debug("******************************************************************")

    def on_order_event(self, order_event: OrderEvent):
        order: Order = self.transactions.get_order_by_id(order_event.order_id)
        if self.order_ticket:
            self.debug(f"Order Ticket Id: {self.order_ticket.order_id}")
        if self.tp_ticket:
            self.debug(f"Take Profit Ticket Id: {self.tp_ticket.order_id}")
        self.debug("----- Order Event Triggered -----")
        self.debug(f"Open orders: {self.transactions.get_open_orders(self.eth.symbol)}")
        self.debug(f"Order ID: {order_event.order_id}")
        self.debug(f"Symbol: {order_event.symbol}")
        self.debug(f"Status: {OrderStatus(order_event.status)}")
        self.debug(f"Fill Price: {order_event.fill_price}")
        self.debug(f"Fill Quantity: {order_event.fill_quantity}")
        self.debug(f"Message: {order_event.message}")
        self.debug(f"Is Fill: {order_event.fill_quantity != 0}")
        self.debug(f"Time: {self.time}")
        # if order_event.status == OrderStatus.:
        #     self.debug("**********************************")
        #     self.debug(f"Order: {order_event.order_id} has been closed")
        #     self.debug("**********************************")
        self.debug("----------------------------------")
