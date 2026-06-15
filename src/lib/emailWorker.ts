import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { PrismaClient, Prisma } from '@prisma/client'; 

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { prisma } = require('./db');
const { extractTrackingId } = require('./extractor');
const { processIncomingLog } = require('./nlp');

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
        // 🛠️ DAY 16 STEP 1: Fetch the user's active preferences dynamically from the DB
        const userSettings = await prisma.inboxSetting.findFirst({
          where: { emailAddress: this.config.auth.user },
        });

        // Pull keywords array from DB, fallback to generic keywords if unconfigured
        const activeKeywords: string[] = userSettings?.trackingKeywords || ['shipment', 'order', 'delivery'];
        console.log(`🎯 [Firewall Config] Loaded active filters for ${this.config.auth.user}:`, activeKeywords);

        console.log('🔍 [Email Worker] Searching for unread messages...');
        const searchResult = await this.imap.search({ seen: false });
        
        let unreadIds = Array.isArray(searchResult) ? searchResult : [];
        console.log(`📬 [Email Worker] Found ${unreadIds.length} unread email payloads.`);

        if (unreadIds.length > 0) {
          unreadIds.sort((a, b) => b - a); // Newest first
          const batchLimit = 20;
          unreadIds = unreadIds.slice(0, batchLimit);
          console.log(`⚡ [Email Worker] Throttling execution: Processing the ${unreadIds.length} most recent payloads.`);
        }

        // Pass the live database-driven keywords down into the message processor loop
        for (const uid of unreadIds) {
          await this.processEmailMessage(uid, activeKeywords);
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

  // 🛠️ DAY 16 STEP 2: Accept the active filtering array parameters
  private async processEmailMessage(uid: number, trackingKeywords: string[]) {
    if (!this.imap) return;

    const messageContent = await this.imap.fetchOne(uid.toString(), { source: true });
    if (!messageContent || !messageContent.source) return;

    const parsedEmail = await simpleParser(messageContent.source);
    const subject = parsedEmail.subject || 'No Subject';
    const rawBody = parsedEmail.text || '';
    const sender = parsedEmail.from?.text || '';

    // Convert metadata text pools to lowercase for bulletproof comparison matches
    const subjectLower = subject.toLowerCase();
    const bodyLower = rawBody.toLowerCase();
    const senderLower = sender.toLowerCase();

    // 🛠️ DAY 16 STEP 3: Validate text chunks against the dynamic user parameters
    const matchesUserPreference = trackingKeywords.some(keyword => {
      const standardKeyword = keyword.trim().toLowerCase();
      return (
        subjectLower.includes(standardKeyword) || 
        bodyLower.includes(standardKeyword) || 
        senderLower.includes(standardKeyword)
      );
    });

    if (!matchesUserPreference) {
      console.log(`⏩ [Filter Firewall] Skipping email (No match for active keywords). Subject: "${subject}"`);
      // Mark it as read so it isn't repeatedly evaluated in future synchronization sweeps
      await this.imap.messageFlagsAdd(uid.toString(), ['\\Seen']);
      return; // Fast exit to save local AI model computing overhead!
    }

    console.log(`🔥 [Match Found] Processing tracking target email: "${subject}" (${rawBody.length} characters)`);

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

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const shipment = await tx.shipment.upsert({
        where: { trackingNumber: activeTrackingNumber },
        update: {
          status: sentimentLabel === 'NEGATIVE' ? 'CRITICAL' : 'ON_TIME'
        },
        create: {
          trackingNumber: activeTrackingNumber,
          origin: sender || "Unknown Email Sender",
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
    await this.imap.messageFlagsAdd(uid.toString(), ['\\Seen']);
  }
}