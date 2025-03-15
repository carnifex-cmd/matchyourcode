const axios = require('axios');

const LEETCODE_API_URL = 'https://leetcode.com/graphql';

const fetchLeetCodeProblems = async () => {
  try {
    console.log('Initiating LeetCode API request...');
    const response = await axios.post(LEETCODE_API_URL, {
      operationName: 'problemsetQuestionList',
      query: `
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
      `,
      variables: {
        categorySlug: '',
        skip: 0,
        limit: 500,
        filters: {}
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    console.log('Raw LeetCode API response:', JSON.stringify(response.data, null, 2));

    console.log('Raw LeetCode API response:', JSON.stringify(response.data, null, 2));

    if (!response.data || !response.data.data || !response.data.data.problemsetQuestionList || !response.data.data.problemsetQuestionList.questions) {
      throw new Error('Invalid response format from LeetCode API');
    }

    const problems = response.data.data.problemsetQuestionList.questions;
    console.log(`Fetched ${problems.length} problems from LeetCode`);

    // Transform the data to match our application's format
    const transformedProblems = problems.map(problem => ({
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