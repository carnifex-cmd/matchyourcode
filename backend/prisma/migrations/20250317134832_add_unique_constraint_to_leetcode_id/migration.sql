/*
  Warnings:

  - You are about to drop the column `isLeetcode75` on the `Problem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[leetcodeId]` on the table `Problem` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "isLeetcode75";

-- CreateIndex
CREATE UNIQUE INDEX "Problem_leetcodeId_key" ON "Problem"("leetcodeId");
