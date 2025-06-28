import time
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from datetime import datetime, timedelta
from backtest.schemas import OrderRead, BacktestCreate, BacktestRead
from sqlalchemy import and_

# from backtest.lean.LeanBacktestSaver import *
from database import get_db
from sqlalchemy.orm import Session
from backtest.models import BacktestModel
from typing import List, Optional
from backtest.BacktestEngine import BacktestEngine
from backtest.BacktestSaver import BacktestSaver
from backtest.BactestSaverFactory import BacktestSaverFactory
from backtest.DataHandlerFactory import DataHandlerFactory
from backtest.Exceptions import (
    BacktestDataException,
)
from logger import logger
from backtest.models import OrderModel
from backtest.Candle import Candle

router = APIRouter(prefix="/backtest")

# CRUD for stratagies -> next js
# CRUD for backtests -> fast api


# TODO
@router.get("/{backtest_id}/symbols/")
async def get_symbols(backtest_id: int, db: Session = Depends(get_db)):
    # Retrieve the backtest by the provided ID.
    backtest = db.query(BacktestModel).filter(BacktestModel.id == backtest_id).first()

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
    backtest_id: int,
    symbol: str,
    start: Optional[int] = None,
    end: Optional[int] = None,
    entries: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Get candlestick data for a specific backtest.

    Parameters:
    - backtest_id: ID of the backtest
    - symbol: Trading symbol (e.g., "BTCUSD")
    - start: Optional start timestamp (Unix epoch in seconds)
    - end: Optional end timestamp (Unix epoch in seconds)
    - entries: Optional number of candles to return

    When using entries:
    - If end is provided: Returns 'entries' number of candles ending at the 'end' timestamp
    - If start is provided: Returns 'entries' number of candles starting from the 'start' timestamp
    - If both start and end are provided: 'entries' is ignored and the time range is used
    - If neither start nor end are provided: Returns an error
    """
    # Validate parameters
    if start is None and end is None:
        raise HTTPException(
            status_code=400, detail="Either 'start' or 'end' parameter must be provided"
        )

    # Retrieve the backtest by the provided ID.
    backtest = db.query(BacktestModel).filter(BacktestModel.id == backtest_id).first()

    # Check that the backtest exists
    if not backtest:
        raise HTTPException(
            status_code=404, detail=f"Backtest with ID {backtest_id} not found"
        )

    # Create a data handler to retrieve the candles
    dataHandler = DataHandlerFactory.create_handler(backtest)

    try:
        print(f"***********{start}*{end}*{entries}*")
        # Case 1: Both start and end provided - use time range, ignore entries
        if start is not None and end is not None and entries is None:
            return await dataHandler.get_candles(
                symbol, datetime.fromtimestamp(start), datetime.fromtimestamp(end)
            )

        # Case 2: entries and end provided - return N entries ending at end time
        elif entries is not None and end is not None:
            # For backward fetching (before end timestamp)
            end_time = datetime.fromtimestamp(end)

            batch_start_time = end_time - timedelta(days=1)
            batch_end_time = end_time
            # Get data and limit to requested entries
            candles: List[Candle] = []
            while len(candles) < entries:
                batch = await dataHandler.get_candles(
                    symbol, batch_start_time, batch_end_time
                )
                candles += batch
            batch_end_time = batch_start_time
            batch_start_time = batch_start_time - timedelta(days=1)

            # Ensure we don't return more than requested entries
            # Take the most recent ones if we got more than requested
            if len(candles) > entries:
                candles = candles[len(candles) - entries :]
            logger.debug(f"Entries and End Obtained {len(candles)}")
            return candles

        # Case 3: entries and start provided - return N entries starting from start time
        elif entries is not None and start is not None:
            # For forward fetching (after start timestamp)
            start_time = datetime.fromtimestamp(start)
            # Estimate end time based on entries (assuming daily candles)
            estimated_end_time = start_time + timedelta(days=entries)

            # Get data and limit to requested entries
            candles = await dataHandler.get_candles(
                symbol, start_time, estimated_end_time
            )
            # Ensure we don't return more than requested entries
            if len(candles) > entries:
                return candles[:entries]
            logger.log(f"Obtained {len(candles)}")
            return candles

    except BacktestDataException as e:
        raise HTTPException(status_code=400, detail={"message": e.message} | e.details)


@router.get("/{backtest_id}/orders", response_model=List[OrderRead])
async def get_backtest_orders(
    backtest_id: int,
    start: Optional[int] = None,
    end: Optional[int] = None,
    entries: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Get orders for a specific backtest with flexible time and entry options.

    Parameters:
    - backtest_id: ID of the backtest
    - start: Optional start timestamp (Unix epoch in seconds)
    - end: Optional end timestamp (Unix epoch in seconds)
    - entries: Optional number of orders to return

    When using entries:
    - If end is provided: Returns 'entries' number of orders ending at the 'end' timestamp
    - If start is provided: Returns 'entries' number of orders starting from the 'start' timestamp
    - If both start and end are provided: 'entries' is ignored and the time range is used
    - If neither start nor end are provided: Returns an error
    """
    # Validate parameters
    if start is None and end is None:
        raise HTTPException(
            status_code=400, detail="Either 'start' or 'end' parameter must be provided"
        )

    # Verify the backtest exists
    backtest = db.query(BacktestModel).filter(BacktestModel.id == backtest_id).first()
    if not backtest:
        raise HTTPException(
            status_code=404, detail=f"Backtest with ID {backtest_id} not found"
        )

    try:
        # Case 1: Both start and end provided - use time range, ignore entries
        if start is not None and end is not None:
            start_date = datetime.fromtimestamp(start)
            end_date = datetime.fromtimestamp(end)

            query = db.query(OrderModel).filter(
                and_(
                    OrderModel.backtest_id == backtest_id,
                    OrderModel.time >= start_date,
                    OrderModel.time <= end_date,
                )
            )

            # Execute query and return orders
            orders = query.all()
            return orders

        # Case 2: entries and end provided - return N entries ending at end time
        elif entries is not None and end is not None:
            end_date = datetime.fromtimestamp(end)

            # Query orders before the end date, ordered by time descending (newest first)
            # Limit to entries requested
            query = (
                db.query(OrderModel)
                .filter(
                    and_(
                        OrderModel.backtest_id == backtest_id,
                        OrderModel.time <= end_date,
                    )
                )
                .order_by(OrderModel.time.desc())
                .limit(entries)
            )

            # Execute query
            orders = query.all()
            orders.reverse()
            return orders

        # Case 3: entries and start provided - return N entries starting from start time
        elif entries is not None and start is not None:
            start_date = datetime.fromtimestamp(start)

            # Query orders after the start date, ordered by time ascending
            # Limit to entries requested
            query = (
                db.query(OrderModel)
                .filter(
                    and_(
                        OrderModel.backtest_id == backtest_id,
                        OrderModel.time >= start_date,
                    )
                )
                .order_by(OrderModel.time.desc())
                .limit(entries)
            )

            # Execute query and return orders
            orders = query.all()
            return orders

    except Exception as e:
        logger.error(f"Error retrieving orders: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error retrieving orders: {str(e)}"
        )


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
    new_backtest = BacktestModel(**backtest_data.model_dump())

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
        orm_order = OrderModel(**order_dict)
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
    backtests = db.query(BacktestModel).filter(BacktestModel.id == backtest_id).first()
    return backtests


# Retrieve all backtests of a strategy
@router.get("/{strategy_id}", response_model=List[BacktestRead])
async def get_backtests_by_strategy(strategy_id: int, db: Session = Depends(get_db)):
    backtests = db.query(BacktestModel).filter(BacktestModel.strategy_id == strategy_id).all()
    return backtests
