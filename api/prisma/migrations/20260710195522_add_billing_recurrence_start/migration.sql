-- AlterTable
ALTER TABLE "billings" ADD COLUMN     "startMonth" INTEGER,
ADD COLUMN     "startYear" INTEGER;

-- Backfill: recurring billings created before this migration had no start date,
-- so treat their creation month as the start to preserve existing history.
UPDATE "billings"
SET "startYear" = COALESCE("yearCreated", EXTRACT(YEAR FROM "createdAt")::int),
    "startMonth" = COALESCE("monthCreated", EXTRACT(MONTH FROM "createdAt")::int)
WHERE "recurring" = true AND "startYear" IS NULL;
