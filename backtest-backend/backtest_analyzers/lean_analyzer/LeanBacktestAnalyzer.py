from pathlib import Path
from datetime import datetime
import re
import csv
import zipfile
from io import TextIOWrapper


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
