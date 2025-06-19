"use client";

import { useState } from "react";
import { Strategy } from "@prisma/client";
import Backtest from "@/app/types/backtest";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { UploadBacktestButton } from "@/components/upload-backtest-button";
import { Container } from "@/components/ui/container";

interface BacktestListProps {
  strategy: Strategy;
  backtests: Backtest[];
  onSelectBacktest: (backtest: Backtest) => void;
}

export function BacktestList({
  strategy,
  backtests,
  onSelectBacktest,
}: BacktestListProps) {
  const [search, setSearch] = useState("");

  // Filter backtests based on search term
  const filteredBacktests = backtests.filter(
    (bt) =>
      bt.id.toString().toLowerCase().includes(search.toLowerCase()) ||
      bt.name.toLowerCase().includes(search.toLowerCase()) ||
      bt.description.toLowerCase().includes(search.toLowerCase()) ||
      Object.keys(bt.parameters).some(
        (key) =>
          key.toLowerCase().includes(search.toLowerCase()) ||
          bt.parameters[key]
            .toString()
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
  );

  // Helper function to format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: start.getFullYear() !== end.getFullYear() ? "numeric" : undefined,
    };

    const startFormatted = start.toLocaleDateString("en-US", formatOptions);
    const endFormatted = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${startFormatted} - ${endFormatted}`;
  };

  return (
    <Container className="py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search backtests by name, description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <UploadBacktestButton strategy={strategy} onNewBacktest={() => mutate ? mutate() : undefined} />
        </div>

        {filteredBacktests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {search ? "No backtests match your search" : "No backtests found"}
            </p>
            {!search && <UploadBacktestButton strategy={strategy} />}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date Range</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBacktests.map((bt) => (
                  <TableRow key={bt.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{bt.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {bt.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDateRange(bt.starting_date, bt.ending_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => onSelectBacktest(bt)}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Container>
  );
}
