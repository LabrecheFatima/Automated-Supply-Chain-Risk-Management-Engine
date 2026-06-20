import { NextResponse } from 'next/server';
import { createRequire } from 'module';
import {prisma} from '../../../lib/db';

const require = createRequire(import.meta.url);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // 💡 In a full production environment, retrieve this ID from your NextAuth/Clerk session
    // For local Phase 3 development, we will fetch the first seeded user ID dynamically
    const defaultUser = await prisma.user.findFirst();
    
    if (!defaultUser) {
      return NextResponse.json({ error: "No active users found in database." }, { status: 404 });
    }

    const userId = defaultUser.id;

    // Fetch all shipments for this specific user, including related logs & AI results
    const shipments = await prisma.shipment.findMany({
      where: {
        userId: userId
      },
      include: {
        aiAnalysis: true,
        rawLogs: {
          orderBy: { receivedAt: 'desc' }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, data: shipments });

  } catch (error: any) {
    console.error("🚨 [API Error] Failed to fetch dashboard metrics stream:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}