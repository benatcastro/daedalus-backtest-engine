"use client";

import { useParams, useSearchParams } from "next/navigation";
import { DEFAULT_TAB, TAB_PARAM } from "../layout";
import { BacktestVisualization } from "@/components/backtest/backtest-visualization";
import { BacktestResults } from "@/components/backtest/backtest-results";
import Backtest from "@/types/backtest";
import { Strategy } from "@prisma/client";
import useSWR from "swr";
import { useAppContext } from "@/contexts/app-context";
import { useEffect } from "react";

interface Props {
    params: {
        id: number;
    };
}

export default function Page({ params }: Props) {
    const { id: backtestId } = useParams();
    const searchParams = useSearchParams();
    const selectedTab = searchParams.get(TAB_PARAM) || DEFAULT_TAB;
    const strategyId = searchParams.get("strategy");
    const appContext = useAppContext();

    // Fetch backtests
    const {
        data: backtest,
        error: backtestError,
        isLoading: isBacktestLoading,
    } = useSWR<Backtest>(`/api/v1/backtest/details/${backtestId}`);

    // Fetch strategy
    const {
        data: strategy,
        error: strategyError,
        isLoading: isStrategyLoading,
    } = useSWR<Strategy>(backtest ? `/api/strategies/${backtest.strategy_id}/` : null);
    // Update app context with strategy and backtest after they're loaded
    useEffect(() => {
        if (strategy) {
            appContext.setStrategy(strategy);
        }
    }, [strategy, appContext.setStrategy]);

    useEffect(() => {
        if (backtest) {
            appContext.setBacktest(backtest);
        }
    }, [backtest, appContext.setBacktest]);

    if (!strategy || !backtest) {
        return <h1>Error fetching data</h1>;
    }

    // Update app context with strat and backtest
    switch (selectedTab) {
        case "chart":
            return <BacktestVisualization strategy={strategy} backtest={backtest} />;
        case "results":
            return <BacktestResults strategy={strategy} backtest={backtest} />;
        default:
            return <BacktestResults strategy={strategy} backtest={backtest} />;
    }
}
