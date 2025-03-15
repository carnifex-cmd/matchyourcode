/*
  Warnings:

  - You are about to drop the column `description` on the `Problem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "description",
ADD COLUMN     "leetcodeId" TEXT,
ADD COLUMN     "titleSlug" TEXT;
