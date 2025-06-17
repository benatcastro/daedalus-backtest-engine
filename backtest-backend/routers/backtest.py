from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from datetime import datetime
#from backtest_handler.lean.LeanBacktestSaver import *
from database import get_db
from sqlalchemy.orm import Session
from schemas.backtest import BacktestCreate, StrategyEngine, BacktestRead
from schemas.LeanBacktest import LeanBacktest
from models import Backtest
from typing import List, Optional
import csv
import json
from backtest_handler.BacktestEngine import BacktestEngine
from backtest_handler.BacktestSaver import BacktestSaver
from backtest_handler.DataHandler import DataHandler
from backtest_handler.BactestSaverFactory import BacktestSaverFactory
from backtest_handler.DataHandlerFactory import DataHandlerFactory
from backtest_handler.Exceptions import (
    BacktestDataException,
    SymbolNotAvailableException,
    ResolutionNotAvailableException,
    TimeRangeNotAvailableException,
    CandlestickDataNotAvailableException
)

router = APIRouter(prefix="/backtest")

# CRUD for stratagies -> next js
# CRUD for backtests -> fast api

# TODO
@router.get("/{backtest_id}/symbols/")
async def get_symbols(
    backtest_id: int,
    db: Session = Depends(get_db)
):
    #Retrieve the backtest by the provided ID.
    backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()

    # Check that the backtest exists
    if not backtest:
        raise HTTPException(status_code=404, detail=f"Backtest with ID {backtest_id} not found")

    # Create a data handler to retrieve the candles
    dataHandler = DataHandlerFactory.create_handler(backtest)

    # Obtain and return the symbols
    symbols = await dataHandler.get_available_symbols()
    return symbols

@router.get("/{backtest_id}/candles/")
async def get_candles(
    backtest_id: int,
    symbol: str,
    start: int,
    end: int,
    db: Session = Depends(get_db)
):
    #Retrieve the backtest by the provided ID.
    backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()

    # Check that the backtest exists
    if not backtest:
        raise HTTPException(status_code=404, detail=f"Backtest with ID {backtest_id} not found")

    # Create a data handler to retrieve the candles
    dataHandler = DataHandlerFactory.create_handler(backtest)

    try:
        return await dataHandler.get_candles(
            symbol,
            datetime.fromtimestamp(start),
            datetime.fromtimestamp(end))
    except BacktestDataException as e:
        raise HTTPException(status_code=400, detail={"message": e.message } | e.details)





# Upload a new backtest for a strategy
@router.post("/", response_model=BacktestRead)
async def upload_backtest(
    engine: BacktestEngine = Form(...),
    strategy_id: int = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    print(f'Name: {name}')
    print(f'Description: {description}')
    print(f'Engine: {engine}')
    print(f'Strategy ID: {strategy_id}')

    """
    try:
        engine_enum = BacktestEngine(engine)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid engine: {engine}")
    """


    saver: BacktestSaver = BacktestSaverFactory.create(
        engine,
        name=name,
        description=description,
        strategy_id=strategy_id,
        files=files)

    await saver.process()

    # Step 1: Validate data using Pydantic schema
    backtest_data = BacktestCreate(
        name=saver.name,
        description=saver.description,
        starting_date=saver.starting_date,
        ending_date=saver.ending_date,
        engine=saver.engine,
        strategy_id=saver.strategy_id,
        parameters=saver.parameters
    )
    print(f"Validated BacktestCreate: {backtest_data}")

    # Step 2: Create SQLAlchemy model instance from validated data
    new_backtest = Backtest(**backtest_data.model_dump())

    # Add to the session
    db.add(new_backtest)
    db.commit()
    db.refresh(new_backtest)
    return new_backtest


# Retrieve all backtests of a strategy
@router.get("/{strategy_id}", response_model=List[BacktestRead])
async def get_backtests_by_strategy(strategy_id: int, db: Session = Depends(get_db)):
    backtests = db.query(Backtest).filter(Backtest.strategy_id == strategy_id).all()
    return backtests
