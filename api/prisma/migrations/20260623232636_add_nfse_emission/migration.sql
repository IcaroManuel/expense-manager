-- CreateTable
CREATE TABLE "nfse_emission" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "numeroDps" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "chaveAcesso" TEXT,
    "rawResponse" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfse_emission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nfse_emission_year_month_key" ON "nfse_emission"("year", "month");
