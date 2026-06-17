import ccxt
from datetime import datetime
from config import LEAN_DATA_FOLDER
from pathlib import Path
from SecurityTypes import SecurityTypes
from Markets import Markets
from Resolutions import Resolutions

def build_result_path(ticker: str, security_type: SecurityTypes, market_name: Markets, resolution: Resolutions) -> Path:
    result_path: Path = Path(LEAN_DATA_FOLDER, security_type.name.lower(), market_name.name.lower(), resolution.name.lower(), ticker.lower())
    return result_path

def fetch():
    exchange = ccxt.binance()
    ohlcv = exchange.fetch_ohlcv("ETH/USDT", timeframe='1d', limit=10)
    

    for candle in ohlcv:
        timestamp, open_, high, low, close, volume = candle
        date = datetime.utcfromtimestamp(timestamp / 1000)  # Convert to seconds
        print(f"[{date.strftime('%Y-%m-%d %H:%M:%S')}] Open: {open_}, Close: {close}, Volume: {volume}")

if __name__== "__main__":
    print(SecurityTypes.CRYPTO.name)
    print(SecurityTypes["CRYPTO"].name)
    print(build_result_path("ETHUSDT", SecurityTypes.CRYPTO, Markets.BINANCE, Resolutions.MINUTE))