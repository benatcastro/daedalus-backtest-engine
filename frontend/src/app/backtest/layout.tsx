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
        <div className="flex-row">
            <h1
                onClick={() => {
                    handleSelectTab(item.tab);
                }}
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    currentTab === item.tab.toLowerCase()
                        ? "text-primary"
                        : "text-muted-foreground",
                )}
            >
                {item.name}
            </h1>
            <div
                className={cn(
                    "w-full h-1",
                    currentTab === item.tab.toLowerCase() ? "bg-accent-foreground" : "bg-accent",
                )}
            />
        </div>
    );
}

export default function Layout({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();

    return (
        <div className="h-full flex flex-col">
            <header className="w-full border-b border-border bg-background h-12 flex-shrink-0">
                <nav className="hidden md:flex items-center gap-4 h-full px-4">
                    {navItems.map((item) => (
                        <NavLabel key={item.name} item={item} searchParams={searchParams} />
                    ))}
                </nav>
            </header>
            <div className="flex-1 overflow-hidden">{children}</div>
        </div>
    );
}
