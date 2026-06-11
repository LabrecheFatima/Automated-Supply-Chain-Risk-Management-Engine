import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/db';
import { extractTrackingId } from '@/lib/extractor';
import { processIncomingLog } from '@/lib/nlp';

export class EmailSyncWorker {
  private imap: ImapFlow | null = null;
  private config: any;

  constructor(inboxSetting: {
    imapHost: string;
    emailAddress: string;
    encryptedPass: string;
  }) {
    this.config = {
      host: inboxSetting.imapHost,
      port: 993,
      secure: true,
      auth: {
        user: inboxSetting.emailAddress,
        pass: inboxSetting.encryptedPass,
      },
      logger: false,
    };
  }

  async startSync() {
    this.imap = new ImapFlow(this.config);

    try {
      console.log(`🔌 [Email Worker] Connecting to inbox: ${this.config.auth.user}...`);
      await this.imap.connect();

      const clientLock = await this.imap.getMailboxLock('INBOX');
      
      try {
        console.log('🔍 [Email Worker] Searching for unread messages...');
        
        const searchResult = await this.imap.search({ seen: false });
        
        // FIX 1: Defensively convert searchResult to an empty array if it returns false
        const unreadIds = Array.isArray(searchResult) ? searchResult : [];
        console.log(`📬 [Email Worker] Found ${unreadIds.length} unread email payloads.`);

        for (const uid of unreadIds) {
          await this.processEmailMessage(uid);
        }

      } finally {
        clientLock.release();
      }

      await this.imap.logout();
      console.log('🔌 [Email Worker] Sync batch completed successfully. Disconnected.');

    } catch (error) {
      console.error('❌ [Email Worker] Critical runtime sync fault:', error);
      if (this.imap) await this.imap.logout().catch(() => {});
    }
  }

  private async processEmailMessage(uid: number) {
    if (!this.imap) return;

    const messageContent = await this.imap.fetchOne(uid.toString(), { source: true });
    if (!messageContent || !messageContent.source) return;

    const parsedEmail = await simpleParser(messageContent.source);
    const subject = parsedEmail.subject || 'No Subject';
    const rawBody = parsedEmail.text || '';

    console.log(`✉️ [Processing Email] Subject: "${subject}" (${rawBody.length} characters)`);

    const { trackingId, cleanedText } = extractTrackingId(rawBody);
    const activeTrackingNumber = trackingId || `UNASSIGNED-MAIL-${Date.now()}`;

    let sentimentLabel = 'POSITIVE';
    let confidence = 0.95;
    let summaryText = `Automated Email Capture: ${subject}`;

    if (cleanedText.length >= 10) {
      const { sentiment, summary } = await processIncomingLog(cleanedText);
      sentimentLabel = sentiment.label;
      confidence = sentiment.score;
      summaryText = summary;
    }

    await prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.upsert({
        where: { trackingNumber: activeTrackingNumber },
        update: {
          status: sentimentLabel === 'NEGATIVE' ? 'CRITICAL' : 'ON_TIME'
        },
        create: {
          trackingNumber: activeTrackingNumber,
          origin: parsedEmail.from?.text || "Unknown Email Sender",
          destination: "Dashboard Sync Queue",
          status: sentimentLabel === 'NEGATIVE' ? 'CRITICAL' : 'ON_TIME',
          currentLocation: "Email Ingestion Inbound",
        },
      });

      await tx.rawLog.create({
        data: {
          shipmentId: shipment.id,
          rawText: `SUBJECT: ${subject}\n\n${cleanedText}`,
          processed: true,
        },
      });

      const severity = sentimentLabel === 'NEGATIVE' ? Math.ceil(confidence * 5) : 1;
      await tx.aIAnalysis.upsert({
        where: { shipmentId: shipment.id },
        update: {
          nlpLabel: sentimentLabel,
          confidenceScore: confidence,
          severityLevel: severity,
          summary: summaryText,
        },
        create: {
          shipmentId: shipment.id,
          nlpLabel: sentimentLabel,
          confidenceScore: confidence,
          severityLevel: severity,
          summary: summaryText,
        },
      });
    });

    console.log(`✅ [Email Worker] Successfully ingested and synced Tracking Reference: ${activeTrackingNumber}`);

    // FIX 2: Use the official imapflow method 'messageFlagsAdd' instead of 'addFlags'
    await this.imap.messageFlagsAdd(uid.toString(), ['\\Seen']);
  }
}