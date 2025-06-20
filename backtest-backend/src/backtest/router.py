import time
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from datetime import datetime
from schemas.backtest import OrderRead
from sqlalchemy import and_

# from backtest.lean.LeanBacktestSaver import *
from database import get_db
from sqlalchemy.orm import Session
from schemas.backtest import BacktestCreate, BacktestRead
from models import Backtest
from typing import List, Optional
from backtest.BacktestEngine import BacktestEngine
from backtest.BacktestSaver import BacktestSaver
from backtest.BactestSaverFactory import BacktestSaverFactory
from backtest.DataHandlerFactory import DataHandlerFactory
from backtest.Exceptions import (
    BacktestDataException,
)
from logger import logger
from models import Order

router = APIRouter(prefix="/backtest")

# CRUD for stratagies -> next js
# CRUD for backtests -> fast api


# TODO
@router.get("/{backtest_id}/symbols/")
async def get_symbols(backtest_id: int, db: Session = Depends(get_db)):
    # Retrieve the backtest by the provided ID.
    backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()

    # Check that the backtest exists
    if not backtest:
        raise HTTPException(
            status_code=404, detail=f"Backtest with ID {backtest_id} not found"
        )

    # Create a data handler to retrieve the candles
    dataHandler = DataHandlerFactory.create_handler(backtest)

    # Obtain and return the symbols
    symbols = await dataHandler.get_available_symbols()
    return symbols


@router.get("/{backtest_id}/candles/")
async def get_candles(
    backtest_id: int, symbol: str, start: int, end: int, db: Session = Depends(get_db)
):
    # Retrieve the backtest by the provided ID.
    backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()

    # Check that the backtest exists
    if not backtest:
        raise HTTPException(
            status_code=404, detail=f"Backtest with ID {backtest_id} not found"
        )

    # Create a data handler to retrieve the candles
    dataHandler = DataHandlerFactory.create_handler(backtest)

    try:
        return await dataHandler.get_candles(
            symbol, datetime.fromtimestamp(start), datetime.fromtimestamp(end)
        )
    except BacktestDataException as e:
        raise HTTPException(status_code=400, detail={"message": e.message} | e.details)


@router.get("/{backtest_id}/orders", response_model=List[OrderRead])
async def get_backtest_orders(
    backtest_id: int, start: int, end: int, db: Session = Depends(get_db)
):
    """
    Get orders for a specific backtest within a time range.

    Parameters:
    - backtest_id: ID of the backtest
    - start: Start timestamp (Unix epoch)
    - end: End timestamp (Unix epoch)
    - symbol: Optional trading symbol to filter orders
    """
    # Verify the backtest exists
    backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()
    if not backtest:
        raise HTTPException(
            status_code=404, detail=f"Backtest with ID {backtest_id} not found"
        )

    # Convert timestamps to datetime
    start_date = datetime.fromtimestamp(start)
    end_date = datetime.fromtimestamp(end)

    # Build the query
    query = db.query(Order).filter(
        and_(
            Order.backtest_id == backtest_id,
            Order.time >= start_date,
            Order.time <= end_date,
        )
    )

    # Execute query and return orders
    orders = query.all()

    # Return the orders
    return orders


# Upload a new backtest for a strategy
@router.post("/", response_model=BacktestRead)
async def upload_backtest(
    engine: BacktestEngine = Form(...),
    strategy_id: int = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    """
    try:
        engine_enum = BacktestEngine(engine)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid engine: {engine}")
    """
    start_time_processing = time.time()

    saver: BacktestSaver = BacktestSaverFactory.create(
        engine, name=name, description=description, strategy_id=strategy_id, files=files
    )

    await saver.process()

    # Validate data using Pydantic schema
    backtest_data = BacktestCreate(
        name=saver.name,
        description=saver.description,
        starting_date=saver.starting_date,
        ending_date=saver.ending_date,
        engine=saver.engine,
        strategy_id=saver.strategy_id,
        parameters=saver.parameters,
    )

    # Create SQLAlchemy model instance from validated data
    new_backtest = Backtest(**backtest_data.model_dump())

    # Add to the session
    db.add(new_backtest)
    db.commit()
    db.refresh(new_backtest)
    processing_time = time.time() - start_time_processing
    logger.info(f"Saved backtest: {new_backtest.name} in {processing_time:.2f} seconds")

    start_time_processing = time.time()

    # Convert pydantic schemas to ORM models
    orm_orders = []
    for order in saver.orders:
        order_dict = order.model_dump()
        order_dict["backtest_id"] = new_backtest.id
        orm_order = Order(**order_dict)
        orm_orders.append(orm_order)

    # Save the orders
    db.add_all(orm_orders)
    db.commit()

    processing_time = time.time() - start_time_processing
    logger.info(f"Saved {len(orm_orders)} orders in {processing_time:.2f} seconds")

    return new_backtest


# Retrieve one backtests of a strategy
@router.get("/details/{backtest_id}", response_model=BacktestRead)
async def get_one_backtest(backtest_id: int, db: Session = Depends(get_db)):
    backtests = db.query(Backtest).filter(Backtest.id == backtest_id).first()
    return backtests


# Retrieve all backtests of a strategy
@router.get("/{strategy_id}", response_model=List[BacktestRead])
async def get_backtests_by_strategy(strategy_id: int, db: Session = Depends(get_db)):
    backtests = db.query(Backtest).filter(Backtest.strategy_id == strategy_id).all()
    return backtests
