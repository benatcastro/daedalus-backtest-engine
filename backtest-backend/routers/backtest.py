from fastapi import APIRouter, Depends
from datetime import datetime
from backtest_analyzers.lean_analyzer.LeanBacktestAnalyzer import *
from database import get_db
from sqlalchemy.orm import Session
from schemas.backtest import BacktestCreate, StrategyEngine, BacktestRead
from models import Backtest
from typing import List


router = APIRouter(prefix="/backtest")

# CRUD for stratagies -> next js
# CRUD for backtests -> fast api

# TODO
# Retrieve backtest info
# Retrieve the historical data used for a backtest (candles)
@router.get("/{backtest_id}/")
async def get_candles_for_backtes(symbol: str, start: int, end: int):
	pass

# Upload a new backtest for a strategy
@router.post("/")
async def create_backtest(backtest: BacktestCreate, db: Session = Depends(get_db)):
	db_backtest = Backtest(
		engine=backtest.engine,
		strategy_id = backtest.strategy_id,
		parameters=backtest.parameters
	)
	db.add(db_backtest)
	db.commit()
	print(backtest)


# Retrieve all backtests of a strategy
@router.get("/{strategy_id}", response_model=List[BacktestRead])
async def get_backtests_by_strategy(strategy_id: int, db: Session = Depends(get_db)):
    backtests = db.query(Backtest).filter(Backtest.strategy_id == strategy_id).all()
    return backtests


"""
@router.get("/backtest/{backtest_id}/")
async def get_strat_info():
	with open("./sample/backtest/1217966458-summary.json") as json_file:
		json_data = json.load(json_file)
		return json_data


@router.get("/backtest/{backtest_id}/candles/")
async def get_candles(symbol: str, start: int, end: int):
	# Convert timestamps to datetime
	starting_date = datetime.fromtimestamp(start / 1000)
	ending_date = datetime.fromtimestamp(end / 1000)
	print(starting_date, ending_date)
	# Check if the request is within the limits
	# TODO
	# Obtain list of files that are needed
	pattern = re.compile(r"^succeeded-data-requests-\d+\.txt$")

	# Filter files
	succeded_data_request_file = [f for f in os.listdir("./sample/backtest/") if pattern.match(f)][0]

	print(succeded_data_request_file)
	data_files = []

	# TODO Update regex to work with any symbol
	date_pattern = re.compile(r"^/crypto/binance/minute/ethusdt/(\d+)_trade\.zip$")
	with open(f"./sample/backtest/{succeded_data_request_file}") as file:
		for line in file:
			match = date_pattern.match(line)
			if match:
				date_obj = datetime.strptime(match.group(1), "%Y%m%d")
				is_in_range = starting_date <= date_obj <= ending_date
				if is_in_range:
					data_files.append(line)

	#print(f"Data Files: {data_files}")

	candles = []

	for idx, data_file in enumerate(data_files):
		file_data = get_ohclv_from_zip_file(data_file)
		#print(file_data)
		if idx == 0 or idx == len(data_files):
			file_data = filter_minute_data(file_data, starting_date, ending_date)

		candles.extend(file_data)

	print(f'candles: {candles}')

	# format the result
	result = []

	for entry in candles:
		candle = {
				"time": entry[0].timestamp(),
				"open": float(entry[1]),
				"high": float(entry[2]),
				"low": float(entry[3]),
				"close": float(entry[4])
			}
		result.append(candle)



	return result[1::]
"""


