"use client";
import useSWR from "swr";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Strategy } from "@prisma/client";
import Backtest from "@/app/types/backtest";
import { BacktestList } from "@/components/backtest/backtest-list";
import { BacktestVisualization } from "@/components/backtest/backtest-visualization";
import { useEffect } from "react";

interface Props {
  params: {
    id: string;
  };
}

export default function Page({ params }: Props) {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const selectedBacktestId = searchParams.get("view");

  const { data, error, isLoading } = useSWR<[Strategy, Backtest[]]>([
    `/api/strategies/${id}/`,
    `/api/v1/backtest/${id}`,
  ]);

  if (isBacktestLoading || isStrategyLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
      </div>
    );
  }

  if (error) {
    console.error(error);
    return <p>Error loading strategy.</p>;
  }

  console.log("back: ", backtests, strategy)

  // Search bar for the backtests
  const selectedBacktest = selectedBacktestId
    ? backtests.find((bt) => bt.id.toString() === selectedBacktestId)
    : null;

  // Handle selecting a backtest for visualization
  const handleSelectBacktest = (backtest: Backtest) => {
    const newUrl = `/strategy/${id}/backtests?view=${backtest.id}`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", backtest.id.toString());
    window.history.pushState(null, "", `?${params.toString()}`);
  };

  // Show visualization if a backtest is selected
  if (selectedBacktest) {
    return (
      <BacktestVisualization strategy={strategy} backtest={selectedBacktest} />
    );
  } else {
    return (
      <BacktestList
        strategy={strategy}
        backtests={backtests}
        onSelectBacktest={handleSelectBacktest}
      />
    );
  }
}
