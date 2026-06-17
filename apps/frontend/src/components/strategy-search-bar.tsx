"use client";

import { Input } from "@/components/ui/input"; // if you are using shadcn UI
import { useState } from "react";

export function StrategySearchBar({ onSearch }: { onSearch: (query: string) => void }) {
    const [searchValue, setSearchValue] = useState("");

    return (
        <div className="flex items-center gap-2">
            <Input
                type="text"
                placeholder="Search strategies..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        onSearch(searchValue);
                    }
                }}
            />
        </div>
    );
}
