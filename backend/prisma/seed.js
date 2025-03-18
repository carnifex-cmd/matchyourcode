const { PrismaClient } = require('@prisma/client');
const { fetchLeetCodeProblems } = require('../src/utils/leetcode');
const prisma = new PrismaClient();

async function main() {
  // Delete all problems
  await prisma.problem.deleteMany();
  console.log('Database has been emptied of all problems');

  // Fetch and store problems from LeetCode
  console.log('Fetching problems from LeetCode...');
  const problems = await fetchLeetCodeProblems(true);
  
  if (problems.length > 0) {
    console.log(`Storing ${problems.length} problems in database...`);
    await prisma.problem.createMany({
      data: problems,
      skipDuplicates: true
    });
    console.log('Problems stored successfully!');
  } else {
    console.log('No problems fetched from LeetCode');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });