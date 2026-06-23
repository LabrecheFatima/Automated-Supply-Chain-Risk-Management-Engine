import { PrismaClient } from '@prisma/client';
import { encryptPassword } from '../src/lib/crypto';
import bcrypt from 'bcryptjs';

// Self-contained instantiation ensures the client reads the fresh schema updates
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Multi-Tenant Database Seeding Strategy...');

  // 1. Clean slate: Flush tables in order of dependencies to avoid foreign key violations
  await prisma.aIAnalysis.deleteMany({});
  await prisma.rawLog.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.inboxSetting.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Database cleared. Inserting fresh multi-tenant profiles and logistics records...');

  const secureHashedSecret = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'fatimalabreche438@gmail.com',
      name: 'Fatima Zohra Labreche',
      password: secureHashedSecret, // 👈 3. ADD THIS LINE HERE
      inboxSettings: {
        create: {
          emailAddress: 'fatimalabreche438@gmail.com',
          imapHost: 'imap.gmail.com',
          encryptedPass: encryptPassword(process.env.EMAIL_ACCOUNT_PASSWORD || 'mock_pass_1'),
          trackingSentence: 'I want to track all incoming logistics messages, delivery status updates, package transit logs, and carrier alerts.',
          isActive: true
        }
      }
    }
  });

  // 4. Create User 2: Education & Research Focus (Amine)
  const user2 = await prisma.user.create({
    data: {
      email: 'student.test@univ-algiers.dz',
      name: 'Amine Algiers Dev',
      password: secureHashedSecret, // 👈 4. ADD THIS LINE HERE TOO
      inboxSettings: {
        create: {
          emailAddress: 'student.test@univ-algiers.dz',
          imapHost: 'imap.gmail.com',
          encryptedPass: encryptPassword('mock_pass_2'),
          trackingSentence: 'Monitor my inbox strictly for computer engineering course alerts, academic research paper references, and university schedule modifications.',
          isActive: true
        }
      }
    }
  });

  // 4. Seeding Historic Logistics Pipelines Linked to User 1 (Fatima)
  console.log('📦 Attaching premium mock tracking pipelines to logistics user instance...');

  // Record A: Delayed Shipment
  await prisma.shipment.create({
    data: {
      userId: user1.id, // Linked to Fatima
      trackingNumber: "TRK-9821-DZ",
      origin: "Port of Algiers, DZ",
      destination: "Constantine, DZ",
      status: "DELAYED",
      currentLocation: "Blida Transit Hub",
      emailUrl: "https://mail.google.com/mail/u/0/#inbox/18f4a123b4c5de6f", // 🔗 Added direct email content link
      rawLogs: {
        create: [
          {
            rawText: "CARRIER UPDATE: Shipment TRK-9821-DZ ran into heavy traffic congestion and structural delays near Blida. Estimated arrival pushed by 6 hours.",
            processed: true
          }
        ]
      },
      aiAnalysis: {
        create: {
          nlpLabel: "NEGATIVE",
          confidenceScore: 0.942,
          severityLevel: 3,
          summary: "Carrier alert indicates traffic congestion delays near Blida. The estimated delivery timeline has been shifted back by 6 hours."
        }
      }
    }
  });

  // Record B: Critical Alert Shipment
  await prisma.shipment.create({
    data: {
      userId: user1.id, // Linked to Fatima
      trackingNumber: "TRK-4412-INT",
      origin: "Marseille, FR",
      destination: "Algiers Port, DZ",
      status: "CRITICAL",
      currentLocation: "Mediterranean Maritime Boundary",
      emailUrl: "https://mail.google.com/mail/u/0/#inbox/18f4b567c8d9ef0a", // 🔗 Added direct email content link
      rawLogs: {
        create: [
          {
            rawText: "CRITICAL INCIDENT REPORT: Custom clearance exceptions raised for order TRK-4412-INT. Discrepancies found in dangerous goods freight manifest documents. Hold applied.",
            processed: true
          }
        ]
      },
      aiAnalysis: {
        create: {
          nlpLabel: "NEGATIVE",
          confidenceScore: 0.989,
          severityLevel: 5,
          summary: "Critical customs hold applied at the Algiers Port due to documentation errors in the freight manifest. Immediate attention required to resolve paperwork discrepancies."
        }
      }
    }
  });

  // Record C: On-Time Shipment
  await prisma.shipment.create({
    data: {
      userId: user1.id, // Linked to Fatima
      trackingNumber: "TRK-1044-DZ",
      origin: "Oran, DZ",
      destination: "Algiers, DZ",
      status: "ON_TIME",
      currentLocation: "Chlef Highway Checkpoint",
      emailUrl: "https://mail.google.com/mail/u/0/#inbox/18f4c901e2f3ad4b", // 🔗 Added direct email content link
      rawLogs: {
        create: [
          {
            rawText: "Automated standard ping: TRK-1044-DZ cleared checkpoint smoothly. Proceeding on original transit timeline.",
            processed: true
          }
        ]
      },
      aiAnalysis: {
        create: {
          nlpLabel: "POSITIVE",
          confidenceScore: 0.975,
          severityLevel: 1,
          summary: "Automated tracking alert indicates that the shipment has successfully cleared the Chlef Highway checkpoint on its normal schedule."
        }
      }
    }
  });

  console.log(`\n✅ Multi-tenant seeding completed successfully!`);
  console.log(`👤 Profile 1: ${user1.email} -> 3 Logistics Shipments Configured.`);
  console.log(`👤 Profile 2: ${user2.email} -> 0 Active Watchers (Ready for onboarding loop testing).`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });