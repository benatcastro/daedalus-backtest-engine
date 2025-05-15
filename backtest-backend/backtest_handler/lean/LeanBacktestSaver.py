from pathlib import Path
from datetime import datetime
import re
import csv
import zipfile
from io import TextIOWrapper
from backtest_handler.BacktestSaver import BacktestSaver
from backtest_handler.BacktestEngine import BacktestEngine
from typing import List, Dict, Optional, Any
from fastapi import UploadFile
import json
import os
from dataclasses import dataclass
from enum import Enum

class DataRequestStatus(Enum):
	FAILED = "FAILED",
	SUCCEDED = "SUCCEDED"

@dataclass
class DataRequest:
	security_type: str
	market: str
	resolution: str
	symbol: str
	date: datetime        # extracted from filename like '20241007'
	data_type: str        # extracted from filename like 'trade' or 'quote'
	path: Path            # full Path object

	@staticmethod
	def from_path(path: str | Path) -> "DataRequest":
		p = Path(path)
		parts = p.parts
		# Remove root '/' if present
		parts = parts[1:] if parts[0] == "/" else parts
		# Add better verification
		if len(parts) != 5:
			print(f"Cant handle this path {path}")
			return

		filename = p.name  # e.g. '20241007_trade.zip'
		name_without_ext = filename.replace(".zip", "")  # '20241007_trade'

		date_str, data_type = name_without_ext.split("_")
		date = datetime.strptime(date_str, "%Y%m%d")

		return DataRequest(
			security_type=parts[0],  # 'crypto'
			market=parts[1],         # 'binance'
			resolution=parts[2],     # 'minute'
			symbol=parts[3],         # e.g. 'ethusdt'
			date=date,               # parsed datetime
			data_type=data_type,     # 'trade' or 'quote'
			path=p
		)

class LeanBacktestSaver(BacktestSaver):


	def __init__(self, name: str, description: str, strategy_id: int, files: List[UploadFile]):
		self._files: Dict[UploadFile] = {os.path.basename(file.filename): file for file in files}
		super().__init__(name, description, strategy_id, engine=BacktestEngine.LEAN)
		self._backtest_id: Optional[int]
		self._starting_date = Optional[datetime]
		self._ending_date = Optional[datetime]
		self._succeded_data_requests = Optional[List[DataRequest]]
		self._failed_data_requests = Optional[List[DataRequest]]

	async def _process_data_requests(self, file: UploadFile):
		file_content = await file.read()
		data_requests = file_content.decode().splitlines()
		return [DataRequest.from_path(dr.strip()) for dr in data_requests]


	async def process(self):
		self._backtest_id = await self._get_backtest_id()

		# Obtain the summary data
		summary_file = self._files.get(f"{self._backtest_id}-summary.json")
		summary_data = await self._get_json_data(summary_file)

		# Extract the start date
		iso_starting_date = summary_data.get('totalPerformance').get('tradeStatistics').get('startDateTime')
		self._starting_date = datetime.fromisoformat(iso_starting_date.replace("Z", "+00:00"))

		# Extract the end date
		iso_ending_date = summary_data.get('totalPerformance').get('tradeStatistics').get('endDateTime')
		self._ending_date = datetime.fromisoformat(iso_ending_date.replace("Z", "+00:00"))
		print(f'Dates: {self._starting_date} -> {self._ending_date}')

		pattern = re.compile(r"succeeded-data-requests-\d+\.txt")

		succeded_data_requests_file: UploadFile = next(
			(file for name, file in self._files.items() if pattern.fullmatch(name)),
			None
		)
		self._succeded_data_requests = await self._process_data_requests(succeded_data_requests_file)

		pattern = re.compile(r"failed-data-requests-\d+\.txt")

		failed_data_requests_file: UploadFile = next(
			(file for name, file in self._files.items() if pattern.fullmatch(name)),
			None
		)
		self._failed_data_requests = await self._process_data_requests(failed_data_requests_file)


	# Handle if the backtest is not processed
	def get_starting_date(self) -> datetime:
		return self._starting_date

	# Handle if the backtest is not processed
	def get_ending_date(self) -> datetime:
		return self._ending_date

	def get_parameters():
		pass


	async def _get_json_data(self, file: UploadFile) -> Dict[Any, Any]:
		try:
			data = await file.read()
			return json.loads(data)
		except json.JSONDecodeError:
			print(f"❌ Failed to parse Config File")

	async def _get_backtest_id(self):
		data = await self._get_json_data(self._files['config'])
		return data['id']





def millis_to_hour_minute(ms: int) -> tuple[int, int]:
	total_minutes = (ms // 1000) // 60
	hour = (total_minutes // 60) % 24
	minute = total_minutes % 60
	return hour, minute


def filter_minute_data(data, start: datetime, end: datetime):
	return filter(lambda entry: start <= entry[0] <= end, data)



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
