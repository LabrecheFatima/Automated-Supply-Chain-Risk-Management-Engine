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
  private userId: string;

  // 🛠️ PHASE 2: Accept the explicitly decrypted app password and the corresponding userId
  constructor(inboxSetting: {
    id: string;
    userId: string;
    imapHost: string;
    emailAddress: string;
  }, decryptedPass: string) {
    this.userId = inboxSetting.userId;
    this.config = {
      host: inboxSetting.imapHost,
      port: 993,
      secure: true,
      auth: {
        user: inboxSetting.emailAddress,
        pass: decryptedPass, // Decrypted at orchestrator level for safety
      },
      logger: false,
    };
  }

  async startSync() {
    this.imap = new ImapFlow(this.config);

    try {
      console.log(`🔌 [Email Worker] Connecting to multi-tenant inbox: ${this.config.auth.user}...`);
      await this.imap.connect();

      const clientLock = await this.imap.getMailboxLock('INBOX');
      
      try {
        // Fetch setting specific to this configuration row
        const userSettings = await prisma.inboxSetting.findFirst({
          where: { emailAddress: this.config.auth.user, userId: this.userId },
        });

        // Fallback setup: Support keyword arrays or custom tracking parameters
        const activeKeywords: string[] = userSettings?.subjectKeywords 
          ? userSettings.subjectKeywords.split(',').map((k: string) => k.trim()) 
          : ['shipment', 'order', 'delivery'];

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

        for (const uid of unreadIds) {
          await this.processEmailMessage(uid, activeKeywords, userSettings);
        }

      } finally {
        clientLock.release();
      }

      await this.imap.logout();
      console.log(`🔌 [Email Worker] Sync batch completed for ${this.config.auth.user}.`);

    } catch (error) {
      console.error(`❌ [Email Worker] Critical fault for ${this.config.auth.user}:`, error);
      if (this.imap) await this.imap.logout().catch(() => {});
    }
  }

  private async processEmailMessage(uid: number, trackingKeywords: string[], userSettings: any) {
    if (!this.imap) return;

    const messageContent = await this.imap.fetchOne(uid.toString(), { source: true, uid: true, threadId: true});
    if (!messageContent || !messageContent.source) return;

    const parsedEmail = await simpleParser(messageContent.source);
    const subject = parsedEmail.subject || 'No Subject';
    const rawBody = parsedEmail.text || '';
    const sender = parsedEmail.from?.text || '';

    const subjectLower = subject.toLowerCase();
    const bodyLower = rawBody.toLowerCase();
    const senderLower = sender.toLowerCase();

    const { trackingId, cleanedText } = extractTrackingId(rawBody);
    const activeTrackingNumber = trackingId || `UNASSIGNED-MAIL-${Date.now()}`;

    const bodySnippet = cleanedText.slice(0, 300).toLowerCase();
    const intentTarget = userSettings?.trackingSentence?.toLowerCase() || '';

    // 🎯 Task 2.3: Upgraded Semantic Routing Filter Firewall
    let isRelevantIntent = false;

    if (intentTarget.includes('logistics') || intentTarget.includes('package') || intentTarget.includes('delivery')) {
      isRelevantIntent = /shipment|tracking|carrier|package|transit|freight|delivery|order/i.test(bodySnippet) ||
                         /shipment|tracking|delivery/i.test(subjectLower);
    } else if (intentTarget.includes('course') || intentTarget.includes('academic') || intentTarget.includes('university')) {
      isRelevantIntent = /course|schedule|grade|professor|exam|university|research/i.test(bodySnippet) ||
                         /class|exam|schedule/i.test(subjectLower);
    } else if (intentTarget.includes('health') || intentTarget.includes('beauty') || intentTarget.includes('job')) {
      isRelevantIntent = /health|skincare|beauty|job|hiring|interview|resume|career/i.test(bodySnippet) ||
                         /health|beauty|job|interview/i.test(subjectLower);
    } else {
      // General broad-spectrum keyword matching fallback
      isRelevantIntent = trackingKeywords.some(keyword => {
        const standardKeyword = keyword.trim().toLowerCase();
        return (
          subjectLower.includes(standardKeyword) || 
          bodyLower.includes(standardKeyword) || 
          senderLower.includes(standardKeyword)
        );
      });
    }

    if (!isRelevantIntent) {
      console.log(`⏩ [AI Filter Firewall] Skipping unrelated email. Subject: "${subject}"`);
      await this.imap.messageFlagsAdd(uid.toString(), ['\\Seen']);
      return;
    }

    console.log(`🔥 [Match Found] Ingesting tracking target email: "${subject}"`);

    let sentimentLabel = 'POSITIVE';
    let confidence = 0.95;
    let summaryText = `Automated Email Capture: ${subject}`;

    if (cleanedText.length >= 10) {
      const { sentiment, summary } = await processIncomingLog(cleanedText);
      sentimentLabel = sentiment.label;
      confidence = sentiment.score;
      summaryText = summary;
    }

    const targetThreadId = messageContent.threadId || messageContent.uid;
    const directEmailUrl = `https://mail.google.com/mail/u/0/#inbox/${targetThreadId}`;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const shipment = await tx.shipment.upsert({
        where: { 
          userId_trackingNumber: {
            userId: this.userId,
            trackingNumber: activeTrackingNumber
          }
        },
        update: {
          status: sentimentLabel === 'NEGATIVE' ? 'CRITICAL' : 'ON_TIME',
          emailUrl: directEmailUrl // 👈 ADDED LINE: Updates the URL column on matches
        },
        create: {
          userId: this.userId, 
          trackingNumber: activeTrackingNumber,
          origin: sender || "Unknown Email Sender",
          destination: "Dashboard Sync Queue",
          status: sentimentLabel === 'NEGATIVE' ? 'CRITICAL' : 'ON_TIME',
          currentLocation: "Email Ingestion Inbound",
          emailUrl: directEmailUrl, // 👈 ADDED LINE: Saves the deep link to the database
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

    console.log(`✅ [Email Worker] Successfully ingested Tracking Reference: ${activeTrackingNumber}`);
    await this.imap.messageFlagsAdd(uid.toString(), ['\\Seen']);
  }
}