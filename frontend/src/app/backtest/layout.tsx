"use client";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    notFound,
    ReadonlyURLSearchParams,
    unauthorized,
    usePathname,
    useSearchParams,
} from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createContext, useState } from "react";
import BacktestSidebar, { BacktestSidebarItem } from "@/components/backtest/backtest-sidebar";
import { BacktestProvider } from "@/contexts/backtest-context";

const navItems = [
    { name: "Results", tab: "results" },
    { name: "Chart", tab: "chart" },
    { name: "Code", tab: "code" },
];

type NavLabelProps = {
    item: { name: string; tab: string };
    searchParams: ReadonlyURLSearchParams;
};

export const TAB_PARAM = "tab";
export const DEFAULT_TAB = navItems[0].tab;

function NavLabel({ item, searchParams }: NavLabelProps) {
    // Handle selecting a backtest for visualization
    const currentTab = searchParams.get(TAB_PARAM) || DEFAULT_TAB;
    const handleSelectTab = (selectedTab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(TAB_PARAM, selectedTab);
        window.history.pushState(null, "", `?${params.toString()}`);
    };

    return (
        <button
            onClick={() => {
                handleSelectTab(item.tab);
            }}
            className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                currentTab === item.tab.toLowerCase()
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
        >
            {item.name}
        </button>
    );
}

export default function Layout({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();
    return (
        <div className="h-full flex flex-col">
            {/* Top Navigation Bar */}
            <div className="border-b bg-muted/30 ">
                <div className="flex h-14 items-center px-4 sm:px-6">
                    <div className="flex gap-2">
                        {navItems.map((item) => (
                            <NavLabel key={item.tab} item={item} searchParams={searchParams} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area with Sidebars */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Drawing Tools */}
                <BacktestProvider>
                    <BacktestSidebar />

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-scroll">{children}</div>
                </BacktestProvider>
            </div>
        </div>
    );
}
