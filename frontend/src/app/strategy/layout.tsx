'use client'
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link";
import { useSession } from "next-auth/react";
import { notFound, unauthorized, usePathname } from "next/navigation";

const navItems = [
  { name: "Backtests", href: "/backtests"},
  { name: "Code", href: "/todo" },
  { name: "Users", href: "/todo" },
  { name: "Settings", href: "/todo" },
];


type NavLabelProps = {
  item: { name: string; href: string };
  pathname: string;
};

function NavLabel({ item, pathname }: NavLabelProps) {
  return (
    <div className="flex-row">
      <Link
        href={item.href}
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === item.name.toLowerCase() ? "text-primary" : "text-muted-foreground"
        )}
      >
        {item.name}
      </Link>
      <div
        className={cn(
          "w-full h-1",
          pathname === item.name.toLowerCase() ? "bg-accent-foreground" : "bg-accent"
        )}
      />
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname().split('/').pop();
  const { data: session } = useSession();

  console.log(pathname)
  console.log(navItems[0].name.toLowerCase())
  if (!pathname) {
    notFound()
  }


  return (
    <>
      <header className="w-full border-b border-border bg-background">
        <div className="max-w-screen h-12 flex items-center justify-between">
          <nav className="hidden md:flex items-center gap-4">
            {navItems.map((item) =>
              <NavLabel key={item.name} item={item} pathname={pathname} />
            )}
          </nav>
        </div>
      </header>
      <div className="px-16 sm:px-8 lg:px-64 pt-8">
        {children}
      </div>
    </>
  )


}
