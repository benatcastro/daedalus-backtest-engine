from fastapi import FastAPI
from routers import backtest
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from config import settings

# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.DEBUG,
    version="1.0.0",
    description="API for managing and retrieving backtest data for trading strategies",
)

# Include routers with API version prefix
app.include_router(backtest.router, prefix=settings.API_V1_STR)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def hello_world():
    """Root endpoint to check if the API is running"""
    return {
        "message": "Hello from Daedalus Backtest API!",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs",
    }
