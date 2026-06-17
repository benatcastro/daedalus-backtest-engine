from ConfigParser import ConfigParser
from BacktestVisualizer import BacktestVisualizer
import sys

def main():
    configParser: ConfigParser = ConfigParser.default()
    strat = sys.argv[1]
    backtestVisualizer: BacktestVisualizer = BacktestVisualizer(strat, configParser.get_config())
    backtestVisualizer.parse_results()
    backtestVisualizer.display_chart("CandleATR")

if __name__ == "__main__":
    main()
