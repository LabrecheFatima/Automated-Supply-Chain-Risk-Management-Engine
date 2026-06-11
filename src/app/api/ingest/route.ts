import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db'; 
import { processIncomingLog } from '../../../lib/nlp';
import { extractTrackingId } from '../../../lib/extractor';
import { IngestPayloadSchema } from '../../../lib/validation';

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

    // 2. Zod Firewall Security Check
    const validation = IngestPayloadSchema.safeParse(jsonBody);
    if (!validation.success) {
      const errorMessages = validation.error.errors.map((err) => err.message);
      return NextResponse.json({ success: false, error: 'Validation failed.', details: errorMessages }, { status: 400 });
    }

    const { rawText } = validation.data;

    // 3. Compute AI Analytics & Extract Tracking Code
    const { sentiment, summary } = await processIncomingLog(rawText);
    const { trackingId, cleanedText } = extractTrackingId(rawText);

    // Defensive default token fallback if no tracking ID is discovered in the text
    const activeTrackingNumber = trackingId || `UNASSIGNED-${Date.now()}`;

    console.log(` [API Ingest] Upserting Shipment & logging data for: ${activeTrackingNumber}`);

    // 4. PERSISTENCE LAYER: Find or Create the parent Shipment, then link Log + Analysis
    // We use a safe transaction block or sequence to map everything down natively
    const databaseTransaction = await prisma.$transaction(async (tx) => {
      
      // A. Ensure the parent Shipment record exists
      const shipment = await tx.shipment.upsert({
        where: { trackingNumber: activeTrackingNumber },
        update: {
          // If it exists and the email shows a critical error, flag the shipping state dynamically
          status: sentiment.label === 'NEGATIVE' ? 'CRITICAL' : 'ON_TIME'
        },
        create: {
          trackingNumber: activeTrackingNumber,
          origin: "Unknown Ingest Point",
          destination: "Pending Operations",
          status: sentiment.label === 'NEGATIVE' ? 'CRITICAL' : 'ON_TIME',
          currentLocation: "Ingestion Routing System",
        },
      });

      // B. Save the Messy Email Text into your RawLog model
      const rawLog = await tx.rawLog.create({
        data: {
          shipmentId: shipment.id,
          rawText: cleanedText,
          processed: true,
        },
      });

      // C. Save or update the AI local compilation parameters inside your AIAnalysis model
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
      },
      nlpMetrics: {
        sentiment: databaseTransaction.aiAnalysis.nlpLabel,
        confidenceScore: databaseTransaction.aiAnalysis.confidenceScore,
        severity: databaseTransaction.aiAnalysis.severityLevel
      },
    });

  } catch (error: any) {
    console.error(' [API Ingest] Relational database save operation failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal pipeline relational storage fault.' },
      { status: 500 }
    );
  }
}