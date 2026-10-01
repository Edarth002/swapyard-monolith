import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleRouteError } from '@/lib/errors';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  console.log("Cleaning stale notifications...");

  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const result = await prisma.notification.deleteMany({
      where: {
        read: true,
        updatedAt: {
          lt: fortyEightHoursAgo,
        },
      },
    });

    console.log(`Deleted ${result.count} stale notifications older than 48 hours to optimize database performance.`);
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count 
    });

  } catch (error) {
    return handleRouteError(error);
  }
}
