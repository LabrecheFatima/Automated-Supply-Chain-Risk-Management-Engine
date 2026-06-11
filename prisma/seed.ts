// seed.ts
import { PrismaClient } from '../src/generated/prisma/client';

// 💡 Prisma 6 automatically resolves the correct file maps from this root folder layout
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding mock logistics data...');

  // Clear existing records to avoid unique constraint crashes on rerun
  await prisma.aIAnalysis.deleteMany({});
  await prisma.rawLog.deleteMany({});
  await prisma.shipment.deleteMany({});

  // 1. Create a Delayed Shipment
  await prisma.shipment.create({
    data: {
      trackingNumber: "TRK-9821-DZ",
      origin: "Port of Algiers, DZ",
      destination: "Constantine, DZ",
      status: "DELAYED",
      currentLocation: "Blida Transit Hub",
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
          summary: "Carrier alert indicates mechanical or transit holdups. Logistics footprint metrics updated to delayed status."
        }
      }
    }
  });

  // 2. Create a Critical Alert Shipment
  await prisma.shipment.create({
    data: {
      trackingNumber: "TRK-4412-INT",
      origin: "Marseille, FR",
      destination: "Algiers Port, DZ",
      status: "CRITICAL",
      currentLocation: "Mediterranean Maritime Boundary",
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
          summary: "Critical safety risk flag raised. Custom manifest documentation mismatch. Immediate desk audit recommended."
        }
      }
    }
  });

  // 3. Create an On-Time Shipment
  await prisma.shipment.create({
    data: {
      trackingNumber: "TRK-1044-DZ",
      origin: "Oran, DZ",
      destination: "Algiers, DZ",
      status: "ON_TIME",
      currentLocation: "Chlef Highway Checkpoint",
      rawLogs: {
        create: [
          {
            rawText: "Automated standard ping: TRK-1044-DZ cleared checkpoint smoothly. Proceeding on original transit timeline.",
            processed: true
          }
        ]
      }
    }
  });

  console.log('✅ Seeding complete! 3 distinct logistics pipelines created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });