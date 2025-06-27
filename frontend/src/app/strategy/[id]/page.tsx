"use client";
import useSWR from "swr";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Strategy } from "@prisma/client";
import { BacktestList } from "@/components/strategy/backtest-list";

interface Props {
    params: {
        id: string;
    };
}

const Tabs = [
    { name: "Backtests", tab: "backtests" },
    { name: "Settings", tab: "settings" },
];

const TAB_PARAM = "tab";
const DEFAULT_TAB = Tabs[0].tab;

export default function Page({ params }: Props) {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const selectedTab = searchParams.get(TAB_PARAM) || DEFAULT_TAB;

    // Fetch strategy
    const {
        data: strategy,
        error: strategyError,
        isLoading: isStrategyLoading,
    } = useSWR<Strategy>(`/api/strategies/${id}/`);

    if (isStrategyLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
            </div>
        );
    }

    if (!strategy || strategyError) {
        console.error(strategyError);
        return <p>Error loading strategy.</p>;
    }

    // Show visualization if a backtest is selected
    switch (selectedTab) {
        default:
            return <BacktestList strategy={strategy} />;
    }
}
