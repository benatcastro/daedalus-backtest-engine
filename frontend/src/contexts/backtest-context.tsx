"use client";

import { BacktestSidebarItem } from "@/components/backtest/backtest-sidebar";
import { createContext, useContext, useState, ReactNode } from "react";

// Define possible view types
export type BacktestViewType = "chart" | "results" | "code";

// Define the context structure
interface BacktestContextType {
  sidebarItems: BacktestSidebarItem[];
  setSidebarItems: (items: BacktestSidebarItem[]) => void;
}

// Create the context with undefined default value
const BacktestContext = createContext<BacktestContextType | undefined>(undefined);

// Provider component to wrap application
export function BacktestProvider({ children }: { children: ReactNode }) {
  const [sidebarItems, setSidebarItems] = useState<BacktestSidebarItem[]>([]);

  return (
    <BacktestContext.Provider value={{ sidebarItems, setSidebarItems }}>
      {children}
    </BacktestContext.Provider>
  );
}

// Custom hook to access the context
export function useBacktestContext() {
  const context = useContext(BacktestContext);
  if (context === undefined) {
    throw new Error("useBacktestContext must be used within a BacktestProvider");
  }
  return context;
}
