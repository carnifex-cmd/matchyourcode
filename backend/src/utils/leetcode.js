const axios = require('axios');

const LEETCODE_API_URL = 'https://leetcode.com/graphql';
const BATCH_SIZE = 100; // LeetCode API pagination limit
const TOTAL_PROBLEMS = 3000; // Target number of problems to fetch

const prisma = require('../config/database');

const fetchLeetCodeProblems = async (force = false) => {
  // Check if we need to refresh the problems
  const lastUpdate = await prisma.problem.findFirst({
    orderBy: { updatedAt: 'desc' },
    select: { updatedAt: true }
  });

  if (!force && lastUpdate) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (lastUpdate.updatedAt > oneWeekAgo) {
      console.log('Problems were updated less than a week ago, skipping fetch');
      return [];
    }
  }
  try {
    console.log('Initiating LeetCode API request...');
    const allProblems = [];
    const totalBatches = Math.ceil(TOTAL_PROBLEMS / BATCH_SIZE);
    const query = `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            acRate
            difficulty
            freqBar
            frontendQuestionId: questionFrontendId
            isFavor
            paidOnly: isPaidOnly
            status
            title
            titleSlug
            topicTags {
              name
              id
              slug
            }
            hasSolution
            hasVideoSolution
          }
        }
      }
    `;

    for (let batch = 0; batch < totalBatches; batch++) {
      const skip = batch * BATCH_SIZE;
      console.log(`Fetching batch ${batch + 1}/${totalBatches} (skip: ${skip})`);
      
      const response = await axios.post(LEETCODE_API_URL, {
        operationName: 'problemsetQuestionList',
        query: query,
        variables: {
          categorySlug: '',
          skip: skip,
          limit: BATCH_SIZE,
          filters: {}
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      });

      if (!response.data?.data?.problemsetQuestionList?.questions) {
        console.error('Invalid response format for batch', batch);
        continue;
      }

      const batchProblems = response.data.data.problemsetQuestionList.questions;
      allProblems.push(...batchProblems);

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Fetched ${allProblems.length} problems from LeetCode`);

    // Transform the data to match our application's format
    const transformedProblems = allProblems.map(problem => ({
      title: problem.title,
      difficulty: problem.difficulty,
      topic: problem.topicTags[0]?.name || 'General',
      leetcodeId: problem.frontendQuestionId,
      titleSlug: problem.titleSlug,
      isPaidOnly: problem.paidOnly,
      hasSolution: problem.hasSolution
    }));

    console.log('Transformed problems:', JSON.stringify(transformedProblems, null, 2));
    return transformedProblems;
  } catch (error) {
    console.error('Error fetching LeetCode problems:', error);
    throw error;
  }
};

module.exports = { fetchLeetCodeProblems };