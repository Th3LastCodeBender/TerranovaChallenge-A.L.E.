-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "enum_game_status" ADD VALUE 'finished';
ALTER TYPE "enum_game_status" ADD VALUE 'to_buy';

-- CreateTable
CREATE TABLE "wgMfa" (
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(3),

    CONSTRAINT "wgMfa_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "wgMfaChallenges" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sent_to" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "last_used_at" TIMESTAMPTZ(3),

    CONSTRAINT "wgMfaChallenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wgMfaChallenges_user_id_idx" ON "wgMfaChallenges"("user_id");

-- AddForeignKey
ALTER TABLE "wgMfa" ADD CONSTRAINT "wgMfa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "wgUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wgMfaChallenges" ADD CONSTRAINT "wgMfaChallenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "wgUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddChecks
ALTER TABLE "wgMfaChallenges" ADD CONSTRAINT "wgMfaChallenges_attempts_check" CHECK ("attempts" >= 0);
ALTER TABLE "wgMfaChallenges" ADD CONSTRAINT "wgMfaChallenges_expires_at_check" CHECK ("expires_at" > "created_at");
ALTER TABLE "wgMfaChallenges" ADD CONSTRAINT "wgMfaChallenges_last_used_at_check" CHECK ("last_used_at" > "created_at");

-- AddUnique che mi sono dimenticato
CREATE UNIQUE INDEX "wgMfaChallenges_token_hash_key" ON "wgMfaChallenges"("token_hash");
