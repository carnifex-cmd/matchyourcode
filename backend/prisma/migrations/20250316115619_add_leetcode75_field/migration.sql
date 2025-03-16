-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "isLeetcode75" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "selectedDifficulties" TEXT[] DEFAULT ARRAY['Easy', 'Medium', 'Hard']::TEXT[],
ADD COLUMN     "selectedTopics" TEXT[] DEFAULT ARRAY['Array', 'Linked List', 'Tree', 'Hash Table', 'String', 'Dynamic Programming', 'Math', 'Depth-First Search', 'Binary Search', 'Two Pointers']::TEXT[];
