/*
  Warnings:

  - You are about to drop the `balance_snapshots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `investment_transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "balance_snapshots" DROP CONSTRAINT "balance_snapshots_userId_fkey";

-- DropForeignKey
ALTER TABLE "investment_transactions" DROP CONSTRAINT "investment_transactions_userId_fkey";

-- DropTable
DROP TABLE "balance_snapshots";

-- DropTable
DROP TABLE "investment_transactions";

-- DropEnum
DROP TYPE "TransactionType";
