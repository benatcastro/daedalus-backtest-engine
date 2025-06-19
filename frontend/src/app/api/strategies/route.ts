import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// TODO Authentication between microservices
export async function GET() {
  try {
    const strategies = await prisma.strategy.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(strategies);
  } catch (error) {
    console.error("Error retrieving strategies:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// TODO FORM VALIDATION
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, engine } = body;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const strategy = await prisma.strategy.create({
    data: {
      name,
      description,
      engine,
      users: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  return NextResponse.json(strategy);
}
