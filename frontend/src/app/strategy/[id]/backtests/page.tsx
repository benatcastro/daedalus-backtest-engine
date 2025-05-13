import ClientBacktest from "@/components/ui/client-pages/ClientBacktests"
import { prisma } from "@/lib/prisma"

const STRAT_BACKEND = "http://127.0.0.1:8000"

type Props = {
  params: {
    id: string
  }
}

export async function fetchCandles(startIso: string) {
  const startDate = new Date(startIso);
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

  const startEpoch = startDate.getTime(); // in milliseconds
  const endEpoch = endDate.getTime();     // in milliseconds

  console.log(startEpoch, endEpoch)
  const res = await fetch(
    `${STRAT_BACKEND}/backtest/1/candles/?symbol=BTC&start=${startEpoch}&end=${endEpoch}`);

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export default async function Page({params}: Props) {

  const strategyId = Number(params.id)
  const strategy = await prisma.strategy.findUnique({
    where:{
      id: strategyId
    }
  })
  if (!strategy) {
    return <div>Error finding strategy</div>
  }


  console.log(strategy)
  const res = await fetch(`${STRAT_BACKEND}/backtest/1`);
  const all_data = await res.json()
  const data = all_data['totalPerformance']['tradeStatistics']
  const candles = await fetchCandles(data['startDateTime'])
  console.log("candles:", candles)

  return (
    < ClientBacktest strategy={strategy} data={data} candles={candles}/>
  )

}
