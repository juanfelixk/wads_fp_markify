/*
  Warnings:

  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `LecturerInvitation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LecturerInvitation" DROP CONSTRAINT "LecturerInvitation_invitedBy_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "status";

-- DropTable
DROP TABLE "LecturerInvitation";

-- DropEnum
DROP TYPE "UserStatus";
