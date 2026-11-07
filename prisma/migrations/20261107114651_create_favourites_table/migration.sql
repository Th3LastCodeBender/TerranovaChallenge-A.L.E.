/*
  Warnings:

  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- DropTable
DROP TABLE "sessions";

-- CreateTable
CREATE TABLE "wgSessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip" INET NOT NULL,
    "device" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "wgSessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wgFavourites" (
    "user_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wgFavourites_pkey" PRIMARY KEY ("user_id","game_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wgSessions_token_hash_key" ON "wgSessions"("token_hash");

-- CreateIndex
CREATE INDEX "wgSessions_user_id_idx" ON "wgSessions"("user_id");

-- AddForeignKey
ALTER TABLE "wgSessions" ADD CONSTRAINT "wgSessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "wgUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wgFavourites" ADD CONSTRAINT "wgFavourites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "wgUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
