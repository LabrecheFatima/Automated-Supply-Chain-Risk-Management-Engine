/*
  Warnings:

  - You are about to drop the column `senderWhitelist` on the `InboxSetting` table. All the data in the column will be lost.
  - You are about to drop the column `subjectKeywords` on the `InboxSetting` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[emailAddress]` on the table `InboxSetting` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,trackingNumber]` on the table `Shipment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Shipment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RawLog" DROP CONSTRAINT "RawLog_shipmentId_fkey";

-- DropIndex
DROP INDEX "Shipment_trackingNumber_key";

-- AlterTable
ALTER TABLE "InboxSetting" DROP COLUMN "senderWhitelist",
DROP COLUMN "subjectKeywords",
ADD COLUMN     "trackingSentence" TEXT NOT NULL DEFAULT 'Track all my incoming updates, alerts, and transaction statuses.';

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "InboxSetting_emailAddress_key" ON "InboxSetting"("emailAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_userId_trackingNumber_key" ON "Shipment"("userId", "trackingNumber");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawLog" ADD CONSTRAINT "RawLog_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
