"use client";

import { useParams, useSearchParams } from "next/navigation";
import { DEFAULT_TAB, TAB_PARAM } from "../layout";
import { BacktestVisualization } from "@/components/backtest/backtest-visualization";
import Backtest from "@/types/backtest";
import { Strategy } from "@prisma/client";
import useSWR from "swr";

interface Props {
    params: {
        id: number;
    };
}

export default function Page({ params }: Props) {
    const { id: backtestId } = useParams();
    const searchParams = useSearchParams();
    const selectedTab = searchParams.get(TAB_PARAM) || DEFAULT_TAB;

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

    if (!strategy || !backtest) {
        return <h1>Error fetching data</h1>;
    }

    switch (selectedTab) {
        case "chart":
            return <BacktestVisualization strategy={strategy} backtest={backtest} />;
    }
}
