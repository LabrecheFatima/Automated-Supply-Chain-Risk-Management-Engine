import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Native CommonJS wrapper bypasses the strict ESM module lookup rules in ts-node
const { EmailSyncWorker } = require('../src/lib/emailWorker');
import * as dotenv from 'dotenv';

dotenv.config();

async function runDevWorker() {
  // Mock settings simulating a B2B client connecting their corporate inbox
  // For safety, you use App Passwords generated in Gmail/Outlook configurations
  const mockInboxSetting = {
    imapHost: process.env.EMAIL_IMAP_HOST || 'imap.gmail.com',
    emailAddress: process.env.EMAIL_ACCOUNT_USER || 'your-test-email@gmail.com',
    encryptedPass: process.env.EMAIL_ACCOUNT_PASSWORD || 'your-app-password-here',
  };

  console.log('Starting Day 15 Live Email Sync Worker Environment Test...');
  const worker = new EmailSyncWorker(mockInboxSetting);
  await worker.startSync();
}

runDevWorker().catch(console.error);