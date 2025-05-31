from fastapi import APIRouter, Depends, UploadFile, File, Form
from datetime import datetime
#from backtest_handler.lean.LeanBacktestSaver import *
from database import get_db
from sqlalchemy.orm import Session
from schemas.backtest import BacktestCreate, StrategyEngine, BacktestRead
from models import Backtest
from typing import List, Optional
import csv
import json
from backtest_handler.BacktestEngine import BacktestEngine
from backtest_handler.BacktestSaver import BacktestSaver
from backtest_handler.BactestSaverFactory import BacktestSaverFactory

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
async def upload_backtest(
    engine: BacktestEngine = Form(...),
    strategy_id: int = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    files: List[UploadFile] = File(...)
):
    print(f'Name: {name}')
    print(f'Description: {description}')
    print(f'Engine: {engine}')
    print(f'Strategy ID: {strategy_id}')

    saver: BacktestSaver = BacktestSaverFactory.create(
        engine,
        name=name,
        description=description,
        strategy_id=strategy_id,
        files=files)

    await saver.process()

    print(f"dates: [{saver.get_starting_date()}] [{saver.get_ending_date()}]")
    new_backtest = BacktestCreate(
			name=saver.get_name(),
			description=saver.get_description(),
			starting_date=saver.get_starting_date(),
			ending_date=saver.get_ending_date(),
            engine=saver.get_engine(),
			strategy_id=strategy_id,
            parameters=saver.get_parameters())
    print(f"New Backtest: {new_backtest}")

    db = get_db()

    # Add to the session
    db.add(new_backtest)

    # Commit the transaction
    db.commit()

    # Refresh to get the updated instance (e.g., to get auto-generated id)
    db.refresh(new_backtest)

    return new_backtest


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


