"use client";

import * as React from "react";
import { ThemeProvider, ThemeProviderProps } from "next-themes";
import { useState, useEffect } from "react";

type ProvidersProps = ThemeProviderProps & {
    children: React.ReactNode;
};

export function Providers({ children, ...props }: ProvidersProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <>{children}</>; // Render children without ThemeProvider during SSR
    }

    return <ThemeProvider {...props}>{children}</ThemeProvider>; // Wrap children with ThemeProvider after mount
}
