-- DropEnum first
DROP TYPE IF EXISTS "BillingType" CASCADE;
DROP TYPE IF EXISTS "ExpenseType" CASCADE;

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_userId_name_key" ON "categories"("userId", "name");

-- AddForeignKey for categories
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default INCOME categories for all users who have billings
DO $$
DECLARE
    v_user_id TEXT;
    v_category_id TEXT;
BEGIN
    FOR v_user_id IN
        SELECT DISTINCT "userId" FROM "billings"
    LOOP
        INSERT INTO "categories" ("id", "name", "type", "createdAt", "updatedAt", "userId")
        VALUES (gen_random_uuid()::text, 'Sem Categoria (Entrada)', 'INCOME'::"CategoryType", NOW(), NOW(), v_user_id);
    END LOOP;
END $$;

-- Insert default EXPENSE categories for all users who have expenses
DO $$
DECLARE
    v_user_id TEXT;
BEGIN
    FOR v_user_id IN
        SELECT DISTINCT "userId" FROM "expenses"
        WHERE "userId" NOT IN (
            SELECT DISTINCT "userId" FROM "categories" WHERE "type" = 'EXPENSE'::"CategoryType"
        )
    LOOP
        INSERT INTO "categories" ("id", "name", "type", "createdAt", "updatedAt", "userId")
        VALUES (gen_random_uuid()::text, 'Sem Categoria (Saída)', 'EXPENSE'::"CategoryType", NOW(), NOW(), v_user_id);
    END LOOP;
END $$;

-- Add categoryId column to billings (temporary, nullable)
ALTER TABLE "billings" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "billings" ADD COLUMN "description" TEXT;

-- Populate categoryId for billings
DO $$
DECLARE
    v_billing_id TEXT;
    v_user_id TEXT;
    v_category_id TEXT;
BEGIN
    FOR v_billing_id, v_user_id IN
        SELECT "id", "userId" FROM "billings" WHERE "categoryId" IS NULL
    LOOP
        SELECT c."id" INTO v_category_id
        FROM "categories" c
        WHERE c."userId" = v_user_id AND c."type" = 'INCOME'::"CategoryType"
        LIMIT 1;

        IF v_category_id IS NOT NULL THEN
            UPDATE "billings" SET "categoryId" = v_category_id WHERE "id" = v_billing_id;
        END IF;
    END LOOP;
END $$;

-- Drop old columns from billings
ALTER TABLE "billings" DROP COLUMN IF EXISTS "name";
ALTER TABLE "billings" DROP COLUMN IF EXISTS "startMonth";
ALTER TABLE "billings" DROP COLUMN IF EXISTS "startYear";
ALTER TABLE "billings" DROP COLUMN IF EXISTS "type";

-- Make categoryId NOT NULL on billings
ALTER TABLE "billings" ALTER COLUMN "categoryId" SET NOT NULL;

-- Add FK for billings
ALTER TABLE "billings" ADD CONSTRAINT "billings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add categoryId column to expenses (temporary, nullable)
ALTER TABLE "expenses" ADD COLUMN "categoryId" TEXT;

-- Populate categoryId for expenses
DO $$
DECLARE
    v_expense_id TEXT;
    v_user_id TEXT;
    v_category_id TEXT;
BEGIN
    FOR v_expense_id, v_user_id IN
        SELECT "id", "userId" FROM "expenses" WHERE "categoryId" IS NULL
    LOOP
        SELECT c."id" INTO v_category_id
        FROM "categories" c
        WHERE c."userId" = v_user_id AND c."type" = 'EXPENSE'::"CategoryType"
        LIMIT 1;

        IF v_category_id IS NOT NULL THEN
            UPDATE "expenses" SET "categoryId" = v_category_id WHERE "id" = v_expense_id;
        END IF;
    END LOOP;
END $$;

-- Update color default for expenses
ALTER TABLE "expenses" ALTER COLUMN "color" SET DEFAULT '#820AD1';

-- Drop old columns from expenses
ALTER TABLE "expenses" DROP COLUMN IF EXISTS "name";
ALTER TABLE "expenses" DROP COLUMN IF EXISTS "type";

-- Make categoryId NOT NULL on expenses
ALTER TABLE "expenses" ALTER COLUMN "categoryId" SET NOT NULL;

-- Add FK for expenses
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
