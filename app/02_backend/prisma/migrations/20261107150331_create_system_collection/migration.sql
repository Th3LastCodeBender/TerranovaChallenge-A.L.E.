-- CreateEnum
CREATE TYPE "enum_game_status" AS ENUM ('to_play', 'playing', 'completed');

-- CreateTable
CREATE TABLE "wgUsersGames" (
    "user_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "status" "enum_game_status" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "wgUsersGames_pkey" PRIMARY KEY ("user_id","game_id")
);

-- CreateIndex
CREATE INDEX "wgUsersGames_user_id_status_idx" ON "wgUsersGames"("user_id", "status");

-- AddForeignKey
ALTER TABLE "wgUsersGames" ADD CONSTRAINT "wgUsersGames_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "wgUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wgUsersGames"  ADD CONSTRAINT "wgUserGames_game_id_check"  CHECK ("game_id" > 0);

ALTER TABLE "wgFavourites" ADD CONSTRAINT "wgFavourites_game_id_check" CHECK ("game_id" > 0);

ALTER TABLE "wgSessions" ADD CONSTRAINT "wgSessions_expires_check" CHECK ("expires_at" > "created_at");