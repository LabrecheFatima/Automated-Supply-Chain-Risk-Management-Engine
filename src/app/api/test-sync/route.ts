
import { NextResponse } from "next/server";
// 🌟 Four levels up reaches the root directory, then into scripts
import { runMultiTenantOrchestrator } from "../../../../scripts/runSync"; 

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("Browser-triggered email sync sweeper initiated...");
    
    // Fire the orchestrator logic directly inside the healthy container
    await runMultiTenantOrchestrator();

    return NextResponse.json({ 
      success: true, 
      message: "Email extraction and background synchronization completed successfully!" 
    });
  } catch (error: any) {
    console.error("❌ Synchronization route fault:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An internal error occurred." }, 
      { status: 500 }
    );
  }
}