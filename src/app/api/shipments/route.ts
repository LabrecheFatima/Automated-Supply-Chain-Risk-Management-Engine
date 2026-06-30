
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth"; // 🌟 For secure server-side session fetching
import { authOptions } from "../auth/[...nextauth]/route"; // Update this path to where your authOptions are exported
import { prisma } from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // 1. Inspect the encrypted browser session cookie directly on the server
    const session = await getServerSession(authOptions);

    // 2. Strict Security Boundary Check
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Authentication token invalid or expired." }, 
        { status: 401 }
      );
    }

    // 3. Extract the unique authenticated database user ID
    const userId = (session.user as any).id;

    // 4. Multi-Tenant Isolated Data Query
    const shipments = await prisma.shipment.findMany({
      where: {
        userId: userId //  Guarantees complete data isolation across multiple users
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
    console.error("[API Error] Failed to fetch isolated dashboard metrics stream:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}