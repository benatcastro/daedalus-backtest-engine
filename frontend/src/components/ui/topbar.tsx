'use client'

import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/#features" },
  { name: "Docs", href: "/docs" },
];

export function TopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="w-full border-b border-border bg-background">
      <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold text-xl">QuanticView</span>
        <nav className="hidden md:flex items-center gap-4">
        {navItems.map((item) => (
          <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href ? "text-primary" : "text-muted-foreground"
          )}
          >
          {item.name}
          </Link>
        ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {session?.user ? (
          <Link href={`/users/${session.user.name}/strategies/new`}>
            <Image
              src={session.user.image || "/default-avatar.png"}
              alt="User Avatar"
              width={32}
              height={32}
              className="rounded-full cursor-pointer"
            />
            </Link> ) : (
            <Button onClick={() => signIn()} variant="outline" size="sm">
            Sign In
            </Button>
        )}
      </div>
      </div>
    </header>
    );
}
