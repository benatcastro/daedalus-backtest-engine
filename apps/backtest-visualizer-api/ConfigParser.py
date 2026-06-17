import yaml
from pathlib import Path
from typing import Any, Dict, Optional
from BacktestChooseModes import BacktestChooseModes

class ConfigParser:
    # Config file as parameter
    def __init__(self, config_file: str) -> None:
        self.config_file: str = config_file
        self.config_data: Optional[Dict[str, Any]] = None
        self._load_config()

    # without configFile as parameter
    @classmethod
    def default(cls) -> 'ConfigParser':
        default_config_file = Path(Path.cwd(), "config.yml")
        return cls(default_config_file)

    def _load_config(self) -> None:
        """Load the YAML configuration from the file."""
        try:
            with open(self.config_file, 'r') as file:
                self.config_data = yaml.safe_load(file)

            # TODO: improve typing of config values
            choose_mode: str = self.config_data["backtest_choose_mode"]
            self.config_data["backtest_choose_mode"] = getattr(BacktestChooseModes, choose_mode.upper())

        except FileNotFoundError:
            print(f"Error: {self.config_file} not found.")
        except yaml.YAMLError as e:
            print(f"Error parsing YAML: {e}")

    def get_config(self) -> Optional[Dict[str, Any]]:
        """Returns the yaml as a python dictionary"""
        if self.config_data is None:
            raise Exception("Config data not loaded")

        return self.config_data

    def print_config(self) -> None:
        """Print the loaded configuration data."""
        if self.config_data:
            print(yaml.dump(self.config_data, default_flow_style=False))
        else:
            print("Configuration data is empty.")