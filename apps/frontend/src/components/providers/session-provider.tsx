"use client";

import { SessionProvider as _SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
    return <_SessionProvider>{children}</_SessionProvider>;
}
