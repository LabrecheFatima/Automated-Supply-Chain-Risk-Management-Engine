import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { EmailSyncWorker } = require('../src/lib/emailWorker');
const { prisma } = require('../src/lib/db');
const { decryptPassword } = require('../src/lib/crypto');
import * as dotenv from 'dotenv';

dotenv.config();

export async function runMultiTenantOrchestrator() {
  console.log('🚀 Starting Multi-Tenant Email Synchronization Sweeper...');

  try {
    // 1. Fetch all active inbox configurations from the database
    const activeInboxes = await prisma.inboxSetting.findMany({
      where: { isActive: true },
    });

    console.log(`📂 Found ${activeInboxes.length} active multi-tenant inboxes configured for parsing.`);

    if (activeInboxes.length === 0) {
      console.log('💤 No active profiles found. Exiting processing batch safely.');
      return;
    }

    // 2. Loop through every configuration sequentially
    for (const inbox of activeInboxes) {
      console.log(`👤 Processing Inbox Profile: [${inbox.emailAddress}]`);

      try {
        // 3. Try to decrypt user's password on the fly
        let decryptedAppPassword: string;
        try {
          decryptedAppPassword = decryptPassword(inbox.encryptedPass);
        } catch (cryptoErr) {
          console.warn(`⚠️ Crypto Alert: Could not decrypt password for [${inbox.emailAddress}]. The key may have changed. Skipping...`);
          continue; // Skip this user safely and move to the next one
        }

        // 4. Initialize worker passing decrypted variables
        const worker = new EmailSyncWorker(inbox, decryptedAppPassword);
        
        // 5. Execute processing queue
        await worker.startSync();

      } catch (err: any) {
        console.error(`❌ Failed to run synchronization batch for user [${inbox.emailAddress}]:`, err.message);
      }
    } // Closes the for loop cleanly

    console.log('\n✨ All multi-tenant inbox streams processed successfully.');

  } catch (error) {
    console.error('🚨 Multi-Tenant Orchestrator encountered a critical failure:', error);
  } finally {
    await prisma.$disconnect(); // Properly disconnect database client when completely finished
  }
}

runMultiTenantOrchestrator();