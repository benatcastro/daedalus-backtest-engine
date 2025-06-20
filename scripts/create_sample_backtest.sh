#!/bin/bash
curl -X POST http://localhost:8000/api/v1/backtest/ \
                                                                -F "engine=LEAN" \
                                                                -F "strategy_id=1" \
                                                                -F "name=Lean Backtest Upload Test" \
                                                                -F "description=Testing upload with actual sample files" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/1217966458-log.txt" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/1217966458-order-events.json" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/1217966458-summary.json" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/1217966458.json" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/data-monitor-report-20250407194012683.json" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/succeeded-data-requests-20250407193956377.txt" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/failed-data-requests-20250407193956377.txt" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/log.txt" \
                                                                -F "files=@/home/bena/Projects/daedalus/backtest-backend/sample/config" \
                                                                -H "Accept: application/json"
