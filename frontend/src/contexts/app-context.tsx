'use client'

import { createContext, useContext, useState, ReactNode } from "react";
import { Strategy } from "@prisma/client";
import Backtest from "@/types/backtest";

interface AppContextType {
  strategy: Strategy | null;
  backtest: Backtest | null;
  setStrategy: (strategy: Strategy | null) => void;
  setBacktest: (backtest: Backtest | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [backtest, setBacktest] = useState<Backtest | null>(null);

  return (
    <AppContext.Provider value={{
      strategy,
      backtest,
      setStrategy,
      setBacktest
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
