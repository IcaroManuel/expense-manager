-- AlterTable
ALTER TABLE "billings" ADD COLUMN     "monthCreated" INTEGER,
ADD COLUMN     "yearCreated" INTEGER;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "monthCreated" INTEGER,
ADD COLUMN     "yearCreated" INTEGER;
