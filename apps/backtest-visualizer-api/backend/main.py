from fastapi import FastAPI
from datetime import datetime
import os
import re
from pathlib import Path
import zipfile
import pandas as pd
import csv
from io import TextIOWrapper
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def hello_world():
	return {"message": "Hello World!"}


def millis_to_hour_minute(ms: int) -> tuple[int, int]:
	total_minutes = (ms // 1000) // 60
	hour = (total_minutes // 60) % 24
	minute = total_minutes % 60
	return hour, minute


def filter_minute_data(data, start: datetime, end: datetime):
	def filter_fnc(entry):
		in_range = start.hour <= entry[0].hour <= end.hour and start.minute <= entry[0].minute <= end.minute
		return in_range

	return filter(filter_fnc, data)



def get_ohclv_from_zip_file(filename: str):

	lean_data_folder = "/home/bena/Workspace/Synced/algotrading/data"
	file = lean_data_folder + filename.strip()
	print(file)

	with zipfile.ZipFile(file, 'r') as zip_ref:
		# Find all .txt files
		txt_files = [name for name in zip_ref.namelist() if name.endswith('.csv')]
		if len(txt_files) != 1:
			raise ValueError(f"Expected exactly 1 .txt file, found {len(txt_files)}.")

		txt_filename = txt_files[0]
		with zip_ref.open(txt_filename) as file:
			wrapper = TextIOWrapper(file, encoding='utf-8')
			reader = csv.reader(wrapper)
			data = [row for row in reader]

	date_pattern = re.compile(r"^/crypto/binance/minute/ethusdt/(\d+)_trade\.zip$")
	match = date_pattern.match(filename)
	if match:
		date_obj = datetime.strptime(match.group(1), "%Y%m%d")

		for entry in data:
			hour, minute = millis_to_hour_minute(int(entry[0]))
			entry[0] = datetime(year=date_obj.year, month=date_obj.month, day=date_obj.day, hour=hour, minute=minute)
		return data



@app.get("/backtest/{backtest_id}/data/{symbol}")
def get_data(symbol: str, start: int, end: int):
	# Convert timestamps to datetime
	starting_date = datetime.fromtimestamp(start)
	ending_date = datetime.fromtimestamp(end)
	print(starting_date, ending_date)
	# Check if the request is within the limits
	# TODO
	# Obtain list of files that are needed
	pattern = re.compile(r"^succeeded-data-requests-\d+\.txt$")

	# Filter files
	succeded_data_request_file = [f for f in os.listdir("../sample/backtest/") if pattern.match(f)][0]

	print(succeded_data_request_file)
	data_files = []

	# TODO Update regex to work with any symbol
	date_pattern = re.compile(r"^/crypto/binance/minute/ethusdt/(\d+)_trade\.zip$")
	with open(f"../sample/backtest/{succeded_data_request_file}") as file:
		for line in file:
			match = date_pattern.match(line)
			if match:
				date_obj = datetime.strptime(match.group(1), "%Y%m%d")
				is_in_range = starting_date <= date_obj <= ending_date
				if is_in_range:
					data_files.append(line)

	print(data_files)

	candles = []

	for idx, data_file in enumerate(data_files):
		file_data = get_ohclv_from_zip_file(data_file)
		#print(file_data)
		if idx == 0 or idx == len(data_files):
			file_data = filter_minute_data(file_data, starting_date, ending_date)

		candles.extend(file_data)

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
