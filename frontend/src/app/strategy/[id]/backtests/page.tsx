'use client'
import { prisma } from "@/lib/prisma"
import useSWR from 'swr'
import { Separator } from "@/components/ui/separator"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Strategy } from "@prisma/client"
import Backtest from "@/app/types/backtest"
import BacktestEngine from "@/app/types/backtest-engine"
import { BacktestChooser } from "@/components/backtest-chooser"
import BacktestHistoricalChart from "@/components/backtest-historical-chart"
import { Time } from "lightweight-charts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Eye } from "lucide-react"
import { UploadBacktestButton } from "@/components/upload-backtest-button"
import Link from "next/link"

interface Props {
  params: {
    id: string;
  }
}

export default function Page({params}: Props) {

  const { id } = useParams()
  const [search, setSearch] = useState("")
  const { data, error, isLoading} = useSWR<[Strategy, Backtest[]]>([`/api/strategies/${id}/`, `/api/v1/backtest/${id}`])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
      </div>
    );
  }
  if (error) {
    console.error(error)
    return <p>Error loading strategy.</p>;
  }
  const [strategy, backtests] = data!;
  console.log(`loading ${isLoading} error: ${error} fetched data: ${JSON.stringify(strategy)} ${JSON.stringify(backtests)}`)

  // Filter backtests based on search term
  const filteredBacktests = backtests.filter(bt =>
    bt.id.toString().toLowerCase().includes(search.toLowerCase()) ||
    bt.name.toLowerCase().includes(search.toLowerCase()) ||
    bt.description.toLowerCase().includes(search.toLowerCase()) ||
    Object.keys(bt.parameters).some(key =>
      key.toLowerCase().includes(search.toLowerCase()) ||
      bt.parameters[key].toString().toLowerCase().includes(search.toLowerCase())
    )
  )

  // Helper function to format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined
    };

    const startFormatted = start.toLocaleDateString('en-US', formatOptions);
    const endFormatted = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `${startFormatted} - ${endFormatted}`;
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="w-full flex flex-row gap-x-4">
        <Input
          placeholder="Search backtests by name, description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <UploadBacktestButton strategy={strategy} />
      </div>

      {filteredBacktests.length === 0 ? (
        <>
          <a>{search ? 'No backtests match your search' : 'No backtests found'} </a>
          {!search && <UploadBacktestButton strategy={strategy}/>}
        </>
      ) : (
        <div className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBacktests.map(bt => (
                <TableRow key={bt.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{bt.name}</div>
                      <div className="text-sm text-muted-foreground">{bt.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDateRange(bt.starting_date, bt.ending_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/strategy/${id}/backtests/${bt.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
