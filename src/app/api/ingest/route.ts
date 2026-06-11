import { NextResponse } from 'next/server';
import { processIncomingLog } from '../../../lib/nlp';
import { extractTrackingId } from '../../../lib/extractor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rawText } = body;

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing rawText payload.' },
        { status: 400 }
      );
    }

    console.log(`[API Ingest] Forwarding text to local pipeline layers...`);

    // 1. Run the Multi-Task NLP Engine
    const { sentiment, summary } = await processIncomingLog(rawText);

    // 2. Deterministic Layer: Defensive Regex String Extraction
    const { trackingId, cleanedText } = extractTrackingId(rawText);

    // Return the unified intelligence payload back to the client
    return NextResponse.json({
      success: true,
      message: 'Log processed successfully via multi-task mixed intelligence pipeline.',
      extractedData: {
        trackingId,
        hasValidTracking: trackingId !== null,
        normalizedText: cleanedText,
        summary: summary, 
      },
      nlpMetrics: {
        sentiment: sentiment.label,
        confidenceScore: sentiment.score,
  },
});

  } catch (error: any) {
    console.error('[API Ingest] Pipeline execution failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal pipeline execution fault.' },
      { status: 500 }
    );
  }
}