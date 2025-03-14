const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Delete existing problems
  await prisma.problem.deleteMany();

  // Create initial problems
  const problems = [
    {
      title: 'Two Sum',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      difficulty: 'Easy',
      topic: 'Arrays'
    },
    {
      title: 'Reverse Linked List',
      description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
      difficulty: 'Easy',
      topic: 'LinkedLists'
    },
    {
      title: 'Binary Tree Level Order Traversal',
      description: 'Given the root of a binary tree, return the level order traversal of its nodes values.',
      difficulty: 'Medium',
      topic: 'Trees'
    }
  ];

  for (const problem of problems) {
    await prisma.problem.create({
      data: problem
    });
  }

  console.log('Database has been seeded with initial problems');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 