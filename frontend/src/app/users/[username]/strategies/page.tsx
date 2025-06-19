import { Input } from "@/components/ui/input";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { User, Strategy } from "@prisma/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import StrategyCard from "@/components/strategy-card";
import { StrategySearchBar } from "@/components/strategy-search-bar";

async function DisplayMyStrategies({
  session,
  userSlug,
}: {
  session: Session;
  userSlug: string;
}) {
  // Fetch Strategies

  if (!session?.user?.email) {
    notFound();
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });
    if (!user) {
      notFound();
    }

    const strategies = await prisma.strategy.findMany({
      where: {
        name: {
          mode: "insensitive",
        },
        users: {
          some: {
            id: user.id, // strategy linked to this user
          },
        },
      },
    });
    if (strategies.length === 0)
      return (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">You don't have any strategies</p>
          <Link href={`/users/${userSlug}/strategies/new`}>
            <Button>New Strategy</Button>
          </Link>
        </div>
      );
    else {
      return (
        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            {strategies.map((strategy) => (
              <Link
                key={strategy.id}
                href={`/strategy/${strategy.id}/backtests`}
              >
                <StrategyCard strategy={strategy} />
              </Link>
            ))}
          </div>
        </div>
      );
    }
  } catch (error) {
    return <p>Error obtaining strategies</p>;
  }
}

type DisplayUserStragiesProps = {
  userSlug: string | null | undefined;
};

async function DisplayUserStragies({
  userSlug: user_slug,
}: DisplayUserStragiesProps) {
  return <p>Viewing {user_slug} public strategies</p>;
}

type ChooseViewProps = {
  userSlug: string;
};

async function ChooseView({ userSlug }: ChooseViewProps) {
  const session = await getServerSession(authOptions);

  if (!session) return <p>User must be logged in</p>;

  if (session?.user?.name === userSlug) {
    return <DisplayMyStrategies session={session} userSlug={userSlug} />;
  } else {
    return <DisplayUserStragies userSlug={userSlug} />;
  }
}
export default async function Page({
  params,
}: {
  params: { username: string; q?: string };
}) {
  const { username } = await params;

  if (!username) {
    notFound();
  }

  const query = params.q || "";

  return (
    <main className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="">
            {/* Left sidebar - could be used for filters or navigation */}
          </section>
          <section className="lg:col-span-1">
            <ChooseView userSlug={username} />
          </section>
          <section className="">
            {/* Right sidebar - could be used for additional content */}
          </section>
        </div>
      </div>
    </main>
  );
}
