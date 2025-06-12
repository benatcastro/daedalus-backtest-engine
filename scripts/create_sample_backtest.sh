#!/bin/bash
curl -X POST http://localhost:8000/api/v1/backtest/ \
                                                                -F "engine=LEAN" \
                                                                -F "strategy_id=1" \
                                                                -F "name=Lean Backtest Upload Test" \
                                                                -F "description=Testing upload with actual sample files" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/backtest/1217966458-log.txt" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/backtest/1217966458-order-events.json" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/backtest/1217966458-summary.json" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/backtest/1217966458.json" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/backtest/data-monitor-report-20250407194012683.json" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/backtest/succeeded-data-requests-20250407193956377.txt" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/backtest/failed-data-requests-20250407193956377.txt" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/backtest/log.txt" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/backtest/config" \
                                                                -H "Accept: application/json"
