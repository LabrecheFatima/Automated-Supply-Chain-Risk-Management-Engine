import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db'; 
import { processIncomingLog } from '../../../lib/nlp';
import { extractTrackingId } from '../../../lib/extractor';
import { IngestPayloadSchema } from '../../../lib/validation';
// ylfq wlye xqsx jlfk
export async function POST(request: Request) {
  try {
    // 1. Structural Body Check
    let jsonBody: unknown;
    try {
      jsonBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed request body. Invalid JSON format.' },
        { status: 400 }
      );
    }

    const validation = IngestPayloadSchema.safeParse(jsonBody); //
      if (!validation.success) {
        const errorMessages = validation.error.issues.map((err) => err.message);
        
        return NextResponse.json(
          { success: false, error: 'Validation failed.', details: errorMessages },
          { status: 400 }
        );
      }

    // Capture rawText and the incoming deep emailUrl string from request payload
    // Ensure your Zod schema (IngestPayloadSchema) supports emailUrl as an optional string field!
    const { rawText, emailUrl, email } = validation.data as any; 

    if (!email) {
      return NextResponse.json({ success: false, error: "Missing identity tracking context (email)." }, { status: 400 });
    }

    const userSetting = await prisma.inboxSetting.findFirst({
      where: { 
        emailAddress: email.toLowerCase().trim() },
    });

    if (!userSetting) {
      return NextResponse.json({ error: "No configured mailbox workspace discovered for this identity profile." }, { status: 404 });
    }

    
    const userId = userSetting.userId;

    // 3. Compute AI Analytics & Extract Tracking Code
    const { sentiment, summary } = await processIncomingLog(rawText);
    const { trackingId, cleanedText } = extractTrackingId(rawText);

    const activeTrackingNumber = trackingId || `UNASSIGNED-${Date.now()}`;

    console.log(`[API Ingest] Upserting Shipment & logging data for: ${activeTrackingNumber}`);

    // 4. PERSISTENCE LAYER: Safe transaction block utilizing compound unique mappings
    const databaseTransaction = await prisma.$transaction(async (tx) => {
      
      // Look up via multi-column unique compound key structure: userId_trackingNumber
      const shipment = await tx.shipment.upsert({
        where: { 
          userId_trackingNumber: {
            userId: userId,
            trackingNumber: activeTrackingNumber
          }
        },
        update: {
          status: sentiment.label === 'NEGATIVE' ? 'CRITICAL' : 'ON_TIME',
          emailUrl: emailUrl || undefined // Safely update string column reference if provided
        },
        create: {
          userId: userId,
          trackingNumber: activeTrackingNumber,
          origin: "Unknown Ingest Point",
          destination: "Pending Operations",
          status: sentiment.label === 'NEGATIVE' ? 'CRITICAL' : 'ON_TIME',
          currentLocation: "Ingestion Routing System",
          emailUrl: emailUrl || null // Persists direct email content access reference link
        },
      });

      // B. Save the Email Text log metrics
      const rawLog = await tx.rawLog.create({
        data: {
          shipmentId: shipment.id,
          rawText: cleanedText,
          processed: true,
        },
      });

      // C. Save or update AI evaluation results
      const severity = sentiment.label === 'NEGATIVE' ? Math.ceil(sentiment.score * 5) : 1;
      
      const aiAnalysis = await tx.aIAnalysis.upsert({
        where: { shipmentId: shipment.id },
        update: {
          nlpLabel: sentiment.label,
          confidenceScore: sentiment.score,
          severityLevel: severity,
          summary: summary,
        },
        create: {
          shipmentId: shipment.id,
          nlpLabel: sentiment.label,
          confidenceScore: sentiment.score,
          severityLevel: severity,
          summary: summary,
        },
      });

      return { shipment, rawLog, aiAnalysis };
    });

// 5. Success Response Output
    return NextResponse.json({
      success: true,
      message: 'Log pipeline executed and saved to your tracking records structure.',
      databaseIds: {
        shipmentId: databaseTransaction.shipment.id,
        logId: databaseTransaction.rawLog.id,
        analysisId: databaseTransaction.aiAnalysis.id
      },
      extractedData: {
        trackingNumber: databaseTransaction.shipment.trackingNumber,
        status: databaseTransaction.shipment.status,
        summary: databaseTransaction.aiAnalysis.summary,
      }
    });

  } catch (error: any) {
    console.error(' [API Ingest] Relational database save operation failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal pipeline relational storage fault.' },
      { status: 500 }
    );
  }
}