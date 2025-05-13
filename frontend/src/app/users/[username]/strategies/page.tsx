import { Input } from "@/components/ui/input";
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma'
import { User, Strategy } from '@prisma/client';
import { Button } from "@/components/ui/button"
import Link from 'next/link';
import { notFound } from 'next/navigation';
import StrategyCard from '@/components/strategy-card';
import { StrategySearchBar } from "@/components/strategy-search-bar";

async function DisplayMyStrategies({session, userSlug}: { session: Session, userSlug: string }) {

  // Fetch Strategies

  if (!session?.user?.email) {
    notFound()
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    })
    if (!user) {
      notFound()
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
    })
    if (strategies.length === 0)
      return (
        <div className='flex-row content-center'>
          <p>You don't have any stragies</p>
          <Link href={`/users/${userSlug}/strategies/new`}>
            <Button>New Strategy</Button>
          </Link>
        </div>
    )
    else {
      return (
        <section className='flex flex-col w-full'>
          {strategies.map((strategy) => (
            <Link href={`/strategy/${strategy.id}/`}>
              <StrategyCard strategy={strategy} />
            </Link>
          ))}
        </section>
      )
    }
  } catch (error) {
    return (<p>Error obtaining strategies</p>)
  }
}

type DisplayUserStragiesProps = {
  userSlug: string | null | undefined;
};

async function DisplayUserStragies({ userSlug: user_slug }: DisplayUserStragiesProps) {
  return (<p>Viewing {user_slug} public strategies</p>)
}

type ChooseViewProps = {
  userSlug: string
};

async function ChooseView( {userSlug }: ChooseViewProps ) {
  const session  = await getServerSession(authOptions);

  if (!session)
    return (<p>User must be logged in</p>)



  if (session?.user?.name === userSlug) {
    return (<DisplayMyStrategies session={session} userSlug={userSlug} />)
  }
  else {
    return (<DisplayUserStragies userSlug={userSlug} />)
  }

}
export default async function Page({ params }: { params: { username: string, q?: string }}) {
  const { username } = await params;

  if (!username) {
    notFound()
  }

  const query = params.q || "";

  return (
    <main className="grid grid-cols-3 grid-rows-1 w-full h-screen">
      <section className=''>

      </section>
      <section className="">
        <ChooseView userSlug={username}/>
      </section>
      <section className=''>

      </section>
    </main>
  )

}
