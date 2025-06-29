"use client";

import { useState } from "react";
import { Strategy } from "@prisma/client";
import Backtest from "@/types/backtest";
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
import { Eye, Loader2 } from "lucide-react";
import { UploadBacktestButton } from "@/components/backtest/upload-backtest-button";
import { Container } from "@/components/ui/container";
import useSWR from "swr";
import Link from "next/link";

interface BacktestListProps {
    strategy: Strategy;
}

export function BacktestList({ strategy }: BacktestListProps) {
    const [search, setSearch] = useState("");
    // Fetch backtests
    const {
        data: backtests,
        error: backtestError,
        isLoading: isBacktestLoading,
        mutate,
    } = useSWR<Backtest[]>(`/api/v1/backtest/${strategy.id}`);

    if (isBacktestLoading || !backtests) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
            </div>
        );
    }

    // Filter backtests based on search term
    const filteredBacktests = backtests.filter(
        (bt) =>
            bt.id.toString().toLowerCase().includes(search.toLowerCase()) ||
            bt.name.toLowerCase().includes(search.toLowerCase()) ||
            bt.description.toLowerCase().includes(search.toLowerCase()) ||
            Object.keys(bt.parameters).some(
                (key) =>
                    key.toLowerCase().includes(search.toLowerCase()) ||
                    bt.parameters[key].toString().toLowerCase().includes(search.toLowerCase()),
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

    // Helper function to format upload date
    const formatUploadDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // If less than 7 days ago, show relative time
        if (diffDays === 1) {
            return "1 day ago";
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            // Otherwise show the formatted date
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
            });
        }
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
                    <UploadBacktestButton
                        strategy={strategy}
                        onNewBacktest={() => (mutate ? mutate() : undefined)}
                    />
                </div>

                {filteredBacktests.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">
                            {search ? "No backtests match your search" : "No backtests found"}
                        </p>
                        {!search && (
                            <UploadBacktestButton
                                strategy={strategy}
                                onNewBacktest={() => (mutate ? mutate() : undefined)}
                            />
                        )}
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Date Range</TableHead>
                                        <TableHead>Uploaded</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
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
                                                    {formatDateRange(
                                                        bt.starting_date,
                                                        bt.ending_date,
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-muted-foreground">
                                                    {formatUploadDate(bt.created_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-2"
                                                    asChild
                                                >
                                                    <Link href={`/backtest/${bt.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                        View
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>
        </Container>
    );
}
