-- CreateEnum
CREATE TYPE "public"."CardType" AS ENUM ('GOOD', 'BAD');

-- CreateTable
CREATE TABLE "public"."CardTemplate" (
    "id" TEXT NOT NULL,
    "type" "public"."CardType" NOT NULL,
    "label" TEXT NOT NULL,
    "intensity" INTEGER,
    "tags" TEXT[],
    "locale" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "ownerKey" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),
    "finalCardId" TEXT,
    "finalType" "public"."CardType",
    "finalLabel" TEXT,
    "finalPickIndex" INTEGER,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SessionCard" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "type" "public"."CardType" NOT NULL,
    "cardTemplateId" TEXT,
    "labelSnapshot" TEXT NOT NULL,
    "randomValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyOutcome" (
    "id" TEXT NOT NULL,
    "ownerKey" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "finalCardId" TEXT NOT NULL,
    "finalType" "public"."CardType" NOT NULL,
    "finalLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_ownerKey_startedAt_idx" ON "public"."Session"("ownerKey", "startedAt");

-- CreateIndex
CREATE INDEX "SessionCard_cardTemplateId_idx" ON "public"."SessionCard"("cardTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionCard_sessionId_index_key" ON "public"."SessionCard"("sessionId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "DailyOutcome_sessionId_key" ON "public"."DailyOutcome"("sessionId");

-- CreateIndex
CREATE INDEX "DailyOutcome_ownerKey_date_idx" ON "public"."DailyOutcome"("ownerKey", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyOutcome_ownerKey_date_key" ON "public"."DailyOutcome"("ownerKey", "date");

-- AddForeignKey
ALTER TABLE "public"."SessionCard" ADD CONSTRAINT "SessionCard_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionCard" ADD CONSTRAINT "SessionCard_cardTemplateId_fkey" FOREIGN KEY ("cardTemplateId") REFERENCES "public"."CardTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyOutcome" ADD CONSTRAINT "DailyOutcome_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
