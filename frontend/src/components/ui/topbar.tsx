"use client";

import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { useAppContext } from "../../contexts/app-context";
import { useState } from "react";
import { Strategy } from "@prisma/client";
import Backtest from "@/types/backtest";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SlashIcon } from "lucide-react";

const navItems = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/#features" },
    { name: "Docs", href: "/docs" },
];

export function TopBar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { strategy, backtest } = useAppContext();

    return (
        <header className="w-full border-border bg-muted/30 h-16">
            <div className="h-full flex items-center justify-between px-4">
                <div className="flex items-center gap-6">
                    <Link href="/">
                        <span className="font-bold text-xl cursor-pointer">QuanticView</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-4">
                        <Breadcrumb>
                            <BreadcrumbList>
                                {session ? (
                                    strategy ? (
                                        <>
                                            <BreadcrumbItem>
                                                <BreadcrumbLink
                                                    href={`/users/${session?.user?.name ?? ""}/strategies`}
                                                >
                                                    {session?.user?.name ?? ""}
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator>
                                                <SlashIcon />
                                            </BreadcrumbSeparator>
                                        </>
                                    ) : (
                                        <>
                                            <BreadcrumbPage>{session.user?.name}</BreadcrumbPage>
                                            <BreadcrumbSeparator>
                                                <SlashIcon />
                                            </BreadcrumbSeparator>
                                        </>
                                    )
                                ) : null}
                                {strategy ? (
                                    backtest ? (
                                        <BreadcrumbItem>
                                            <BreadcrumbLink href={`/strategy/${strategy.id}`}>
                                                {strategy.name}
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                    ) : (
                                        <BreadcrumbPage>{strategy.name}</BreadcrumbPage>
                                    )
                                ) : null}
                                {backtest ? (
                                    <>
                                        <BreadcrumbSeparator>
                                            <SlashIcon />
                                        </BreadcrumbSeparator>
                                        <BreadcrumbPage>{backtest.name}</BreadcrumbPage>
                                    </>
                                ) : null}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    {session?.user ? (
                        <>
                            <Button onClick={() => signOut()} variant="outline" size="sm">
                                Sign Out
                            </Button>
                            <Link href={`/users/${session.user.name}/strategies/new`}>
                                <Image
                                    src={session.user.image || "/default-avatar.png"}
                                    alt="User Avatar"
                                    width={32}
                                    height={32}
                                    className="rounded-full cursor-pointer"
                                />
                            </Link>
                        </>
                    ) : (
                        <Button onClick={() => signIn()} variant="outline" size="sm">
                            Sign In
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
