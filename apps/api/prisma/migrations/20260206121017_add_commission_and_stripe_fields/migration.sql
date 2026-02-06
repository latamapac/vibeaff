-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN     "stripeAccountId" TEXT;

-- AlterTable
ALTER TABLE "Conversion" ADD COLUMN     "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "commissionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "payoutId" TEXT;

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "stripeAccountId" TEXT;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "stripeTransferId" TEXT;

-- AddForeignKey
ALTER TABLE "Conversion" ADD CONSTRAINT "Conversion_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
