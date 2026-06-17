"use client";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator"; // Fixed import from Shadcn
import { useState } from "react";
import { Button } from "../ui/button";
import {
    MousePointer,
    TrendingUp,
    Square,
    Type,
    ArrowUpRight,
    Crosshair,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"; // Using Lucide icons for consistency
import { useBacktestContext } from "@/contexts/backtest-context";

// Define the tool item interface
export interface BacktestSidebarItem {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
}

// Define props for the sidebar item component
interface BacktestSidebarItemProps {
    item: BacktestSidebarItem;
    isExpanded: boolean;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

// Sidebar Item Component
function SidebarItem({ item, isExpanded, isSelected, onSelect }: BacktestSidebarItemProps) {
    return (
        <div
            className={cn("flex items-center gap-3 w-full", isExpanded ? "px-2" : "justify-center")}
        >
            <Button
                variant={isSelected ? "secondary" : "ghost"}
                size="icon"
                className="w-10 h-10 rounded flex-shrink-0"
                onClick={() => {
                    onSelect(item.id);
                    item.onClick();
                }}
                title={item.name}
            >
                <span className="sr-only">{item.name}</span>
                {item.icon}
            </Button>
            {isExpanded && (
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
            )}
        </div>
    );
}

// Main Sidebar Component
export default function BacktestSidebar() {
    const [selectedTool, setSelectedTool] = useState<string>("select");
    const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);
    const backtestContext = useBacktestContext();

    const primaryItems: BacktestSidebarItem[] = backtestContext.sidebarItems;
    // Primary drawing tools

    const handleSelectTool = (toolId: string) => {
        setSelectedTool(toolId);
        // Additional logic could be added here, like notifying parent components
    };

    return (
        <div
            className={cn(
                "hidden md:flex border-r bg-muted/30 flex-col py-4 gap-3 transition-all duration-300",
                isSidebarExpanded ? "w-64" : "w-16",
            )}
        >
            {/* Sidebar Toggle Button */}
            <div className="flex justify-center mb-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full"
                    onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                    title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
                >
                    {isSidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    <span className="sr-only">
                        {isSidebarExpanded ? "Collapse" : "Expand"} sidebar
                    </span>
                </Button>
            </div>

            {/* Drawing Tools Section */}
            <div className="flex flex-col gap-3">
                {primaryItems.map((item) => (
                    <SidebarItem
                        key={item.id}
                        item={item}
                        isExpanded={isSidebarExpanded}
                        isSelected={selectedTool === item.id}
                        onSelect={handleSelectTool}
                    />
                ))}
                <Separator className="my-2" />
            </div>
        </div>
    );
}
