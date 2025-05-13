from fastapi import FastAPI
from datetime import datetime
import pandas as pd
from routers import backtest
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.include_router(backtest.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def hello_world():
	return {"message": "hola World!"}
