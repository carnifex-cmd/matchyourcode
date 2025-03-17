const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Delete existing problems
  await prisma.problem.deleteMany();

  // Create initial problems
  const problems = [
    {
      title: 'Two Sum',

      difficulty: 'Easy',
      topic: 'Arrays'
    },
    {
      title: 'Reverse Linked List',

      difficulty: 'Easy',
      topic: 'LinkedLists'
    },
    {
      title: 'Binary Tree Level Order Traversal',

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