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

#TODO: Update the data request to use the pydantic schema
from schemas.LeanBacktest import DataRequest

class LeanBacktestSaver(BacktestSaver):


    def __init__(self, name: str, description: str, strategy_id: int, files: List[UploadFile]):
        self._files: Dict[UploadFile] = {os.path.basename(file.filename): file for file in files}
        super().__init__(name, description, strategy_id, engine=BacktestEngine.LEAN)
        self._backtest_id: Optional[int] = None
        self._starting_date: Optional[datetime] = None
        self._ending_date: Optional[datetime] = None
        self._succeeded_data_requests: Optional[List[DataRequest]] = None
        self._failed_data_requests: Optional[List[DataRequest]] = None

        # Parameters data
        self._trade_statistics: Optional[Dict[Any, Any]] = None
        self._portfolio_statistics: Optional[Dict[Any, Any]] = None
        self._general_statistics: Optional[Dict[Any, Any]] = None
        self._runtime_statistics: Optional[Dict[Any, Any]] = None
        self._state: Optional[Dict[Any, Any]] = None
        self._algorithm_configuration: Optional[Dict[Any, Any]] = None

    #TODO: Update the data request to use the pydantic schema
    async def _process_data_requests(self, file: UploadFile, ):
        file_content = await file.read()
        data_requests = file_content.decode().splitlines()
        unique_requests = set()
        result = []

        for dr in data_requests:
            new_dr = DataRequest.from_path(dr.strip())
            if new_dr:
                dr_dict = new_dr.to_dict()
                dr_tuple = tuple(dr_dict.items())  # Convert dictionary to tuple for hashing
                if dr_tuple not in unique_requests:
                    unique_requests.add(dr_tuple)
                    result.append(new_dr)

        return result


    async def process(self):
        self._backtest_id = await self._get_backtest_id()

        # Obtain the summary data
        summary_file = self._files.get(f"{self._backtest_id}-summary.json")
        summary_data = await self._get_json_data(summary_file)

        self._extract_backtest_bounds(summary_data)
        print(f'Dates: {self._starting_date} -> {self._ending_date}')

        # Load data requests for parameters
        await self._obtain_data_requests()

        # Save summary data for parameters
        self._trade_statistics = summary_data.get("totalPerformance").get("tradeStatistics")
        self._portfolio_statistics = summary_data.get("totalPerformance").get("portfolioStatistics")
        self._general_statistics = summary_data.get("statistics")
        self._runtime_statistics = summary_data.get("runtimeStatistics")
        self._state = summary_data.get("state")
        self._algorithm_configuration = summary_data.get("algorithmConfiguration")



    async def _obtain_data_requests(self) -> None:
        pattern = re.compile(r"succeeded-data-requests-\d+\.txt")

        succeeded_data_requests_file: UploadFile = next(
            (file for name, file in self._files.items() if pattern.fullmatch(name)),
            None
        )
        self._succeeded_data_requests = await self._process_data_requests(succeeded_data_requests_file)

        pattern = re.compile(r"failed-data-requests-\d+\.txt")

        failed_data_requests_file: UploadFile = next(
            (file for name, file in self._files.items() if pattern.fullmatch(name)),
            None
        )
        self._failed_data_requests = await self._process_data_requests(failed_data_requests_file)


    def _extract_backtest_bounds(self, summary_data: json) -> None:
        # Extract the start date
        iso_starting_date = summary_data.get('totalPerformance').get('tradeStatistics').get('startDateTime')
        self._starting_date = datetime.fromisoformat(iso_starting_date.replace("Z", "+00:00"))

        # Extract the end date
        iso_ending_date = summary_data.get('totalPerformance').get('tradeStatistics').get('endDateTime')
        self._ending_date = datetime.fromisoformat(iso_ending_date.replace("Z", "+00:00"))



    # Handle if the backtest is not processed
    @property
    def starting_date(self) -> datetime:
        return self._starting_date

    # Handle if the backtest is not processed
    @property
    def ending_date(self) -> datetime:
        return self._ending_date

    @property
    def parameters(self):

        # Convert DataRequest objects to dictionaries for JSON serialization
        succeeded_requests = []
        if self._succeeded_data_requests:
            succeeded_requests = [request.to_dict() for request in self._succeeded_data_requests]

        failed_requests = []
        if self._failed_data_requests:
            failed_requests = [request.to_dict() for request in self._failed_data_requests]

        return {
            "trade_statistics": self._trade_statistics,
            "portfolio_statistics": self._portfolio_statistics,
            "general_statistics": self._general_statistics,
            "runtime_statistics": self._runtime_statistics,
            "state": self._state,
            "algorithm_configuration": self._algorithm_configuration,
            "succeeded_data_requests": succeeded_requests,
            "failed_data_requests": failed_requests
        }


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
