const { PrismaClient } = require('@prisma/client');
const { fetchLeetCodeProblems } = require('../utils/leetcode');
const prisma = new PrismaClient();

// Review intervals in seconds for testing
const REVIEW_INTERVALS = {
  0: 60,     // First review: 1 minute
  1: 180,    // Second review: 3 minutes
  2: 300,    // Third review: 5 minutes
  3: 600     // Fourth and subsequent reviews: 10 minutes
};

// Helper function to format time
const formatTimeLeft = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Get all problems with user states
const getProblems = async (req, res) => {
  try {
    console.log('\n--- Problem Status Update ---');
    
    // Get user ID from auth token
    const userId = req.user.id;
    
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Get total count of problems
    let totalProblems = await prisma.problem.count();
    
    // Force fetch problems if database is empty
    if (totalProblems === 0) {
      console.log('Database is empty. Forcing fetch of LeetCode problems...');
      const leetcodeProblems = await fetchLeetCodeProblems(true);
      if (leetcodeProblems.length > 0) {
        console.log(`Storing ${leetcodeProblems.length} problems in database...`);
        await prisma.problem.createMany({
          data: leetcodeProblems,
          skipDuplicates: true
        });
        
        // Recount problems after populating the database
        totalProblems = await prisma.problem.count();
        
        // If still empty, wait and retry a few times
        let retryCount = 0;
        while (totalProblems === 0 && retryCount < 3) {
          console.log(`Waiting for database population... Attempt ${retryCount + 1}`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          totalProblems = await prisma.problem.count();
          retryCount++;
        }
        
        if (totalProblems === 0) {
          throw new Error('Failed to populate database after multiple attempts');
        }
      }
    }

    // Fetch problems from database with pagination and user state
    let problems = await prisma.problem.findMany({
      take: limit,
      skip: skip,
      where: {
        AND: [
          {
            userProblems: {
              none: {
                userId: userId
              }
            }
          },
          {
            OR: [
              { title: { not: { contains: "Median of Two Sorted Arrays" } } },
              { title: { equals: "Median of Two Sorted Arrays" }, userProblems: { none: { userId: userId } } }
            ]
          }
        ]
      }
    });
    console.log(`Found ${problems.length} available problems in database`);

    // Problems are already in the database, no need to fetch from LeetCode
    // The fetchLeetCodeProblems function will handle weekly updates internally

    // Get problems with user states and fetch user's lastViewedProblemId
    const [problems_with_state, user] = await Promise.all([
      prisma.problem.findMany({
        where: {
          userProblems: {
            some: {
              userId: userId
            }
          }
        },
        include: {
          userProblems: {
            where: {
              userId: userId
            }
          }
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { lastViewedProblemId: true }
      })
    ]);
    
    // Combine available problems with problems that have user states
    problems = [...problems, ...problems_with_state];


    // Process problems to include user state
    const processedProblems = await Promise.all(problems.map(async problem => {
      const userProblem = problem.userProblems && problem.userProblems.length > 0 ? problem.userProblems[0] : null;
      
      // If no user problem state exists, return the original problem
      if (!userProblem) {
        return {
          ...problem,
          userProblemState: null,
          lastShown: null,
          revisionCount: 0,
          timeUntilShow: 0
        };
      }

      // Check if enough time has passed since last shown
      const now = new Date();
      const lastShown = new Date(userProblem.lastShown);
      const secondsSinceLastShown = Math.max(0, (now - lastShown) / 1000);
      
      // Get the review interval based on revision count
      const revisionCount = Math.min(userProblem.revisionCount, 3); // Cap at 3 for the maximum interval
      const requiredInterval = REVIEW_INTERVALS[revisionCount];
      const shouldShow = secondsSinceLastShown >= requiredInterval;
      const timeUntilShow = Math.max(0, Math.round(requiredInterval - secondsSinceLastShown));

      // Log the countdown for this problem
      console.log(`Problem: ${problem.title}`);
      console.log(`Status: ${userProblem.status}`);
      console.log(`Revision count: ${revisionCount}`);
      console.log(`Time until available: ${formatTimeLeft(timeUntilShow)}`);
      console.log('---');

      // If enough time has passed, remove the problem state
      if (shouldShow) {
        try {
          // Delete the UserProblem record and wait for it to complete
          await prisma.userProblem.delete({
            where: {
              id: userProblem.id
            }
          });

          console.log(`✨ ${problem.title} is now available in Problems section!`);

          return {
            ...problem,
            userProblemState: null,
            lastShown: null,
            revisionCount: 0,
            timeUntilShow: 0
          };
        } catch (err) {
          console.error('Error deleting timed out user problem:', err);
          return {
            ...problem,
            userProblemState: null,
            lastShown: null,
            revisionCount: 0,
            timeUntilShow: 0
          };
        }
      }

      return {
        ...problem,
        userProblemState: userProblem.status,
        lastShown: userProblem.lastShown,
        revisionCount: userProblem.revisionCount,
        timeUntilShow
      };
    }));

    // Group problems by their state
    let availableProblems = processedProblems.filter(p => !p.userProblemState);
    
    // If we have a lastViewedProblemId, sort the problems array to maintain position
    if (user?.lastViewedProblemId) {
      availableProblems.sort((a, b) => {
        if (a.id === user.lastViewedProblemId) return -1;
        if (b.id === user.lastViewedProblemId) return 1;
        return 0;
      });
    }

    const result = {
      problems: availableProblems,
      toLearn: processedProblems.filter(p => p.userProblemState === 'toLearn'),
      toRevise: processedProblems.filter(p => p.userProblemState === 'toRevise'),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProblems / limit),
        totalProblems: totalProblems,
        hasMore: skip + limit < totalProblems
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ message: 'Error fetching problems', error: error.message });
  }
};

// Update problem state
const updateProblemState = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status, lastShown, revisionCount, lastViewedProblemId } = req.body;

    // Validate input parameters
    if (!id || !userId || !status || !lastShown) {
      return res.status(400).json({ 
        message: 'Missing required parameters',
        details: { id, userId, status, lastShown }
      });
    }

    console.log('Updating problem state:', { 
      problemId: id, 
      userId, 
      status, 
      lastShown, 
      revisionCount,
      lastViewedProblemId
    });

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // First check if the problem exists
      const problem = await tx.problem.findUnique({
        where: { id: parseInt(id) }
      });

      if (!problem) {
        throw new Error(`Problem with ID ${id} not found`);
      }

      // Update user's last viewed problem
      await tx.user.update({
        where: { id: userId },
        data: { lastViewedProblemId: lastViewedProblemId ? parseInt(lastViewedProblemId) : parseInt(id) }
      });

      // Find or create user problem state
      return await tx.userProblem.upsert({
        where: {
          userId_problemId: {
            userId: userId,
            problemId: parseInt(id)
          }
        },
        update: {
          status,
          lastShown: new Date(lastShown),
          revisionCount: revisionCount || 0
        },
        create: {
          userId: userId,
          problemId: parseInt(id),
          status,
          lastShown: new Date(lastShown),
          revisionCount: revisionCount || 0
        }
      });
    });

    console.log('Updated user problem:', result);
    res.json(result);
  } catch (error) {
    console.error('Error updating problem state:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        message: error.message 
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        message: 'Conflict: This problem state already exists',
        error: error.message 
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        message: 'Invalid reference: The problem or user ID is invalid',
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Error updating problem state', 
      error: error.message 
    });
  }
};

// Get a single problem by ID
const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching problem by ID:', id); // Debug log
    const problem = await prisma.problem.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!problem) {
      console.log('Problem not found:', id); // Debug log
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    console.log('Found problem:', problem); // Debug log
    res.json(problem);
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ message: 'Error fetching problem', error: error.message });
  }
};

module.exports = {
  getProblems,
  getProblemById,
  updateProblemState
};