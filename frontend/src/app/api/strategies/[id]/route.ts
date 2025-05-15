// app/api/strategies/[id]/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// TODO Authentication between microservices
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    return new NextResponse('Invalid ID', { status: 400 });
  }

  try {
    const strategy = await prisma.strategy.findUnique({
      where: { id },
    });

    if (!strategy) {
      return new NextResponse('Strategy not found', { status: 404 });
    }

    return NextResponse.json(strategy);
  } catch (error) {
    console.error('Error fetching strategy by ID:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
