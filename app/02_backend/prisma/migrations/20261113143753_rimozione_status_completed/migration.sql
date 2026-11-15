/*
  Warnings:

  - The values [completed] on the enum `enum_game_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "enum_game_status_new" AS ENUM ('to_play', 'playing', 'finished', 'to_buy');
ALTER TABLE "wgUsersGames" ALTER COLUMN "status" TYPE "enum_game_status_new" USING ("status"::text::"enum_game_status_new");
ALTER TYPE "enum_game_status" RENAME TO "enum_game_status_old";
ALTER TYPE "enum_game_status_new" RENAME TO "enum_game_status";
DROP TYPE "public"."enum_game_status_old";
COMMIT;
