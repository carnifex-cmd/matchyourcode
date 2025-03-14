const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// For testing, we'll use seconds instead of days
const REVIEW_INTERVALS = {
  0: 60,    // First review: 60 seconds
  1: 180,   // Second review: 180 seconds (3 minutes)
  2: 420,   // Third review: 420 seconds (7 minutes)
  3: 840    // Fourth and subsequent reviews: 840 seconds (14 minutes)
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

    // Get all problems with their user states
    const problems = await prisma.problem.findMany({
      include: {
        userProblems: {
          where: {
            userId: userId
          }
        }
      }
    });

    // Process problems to include user state
    const processedProblems = await Promise.all(problems.map(async problem => {
      const userProblem = problem.userProblems[0];
      
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
    const result = {
      problems: processedProblems.filter(p => !p.userProblemState),
      toLearn: processedProblems.filter(p => p.userProblemState === 'toLearn'),
      toRevise: processedProblems.filter(p => p.userProblemState === 'toRevise')
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
    const { status, lastShown, revisionCount } = req.body;

    console.log('Updating problem state:', { 
      problemId: id, 
      userId, 
      status, 
      lastShown, 
      revisionCount 
    });

    // Find or create user problem state
    const userProblem = await prisma.userProblem.upsert({
      where: {
        userId_problemId: {
          userId: userId,
          problemId: parseInt(id)
        }
      },
      update: {
        status,
        lastShown: new Date(lastShown),
        revisionCount
      },
      create: {
        userId: userId,
        problemId: parseInt(id),
        status,
        lastShown: new Date(lastShown),
        revisionCount
      }
    });

    console.log('Updated user problem:', userProblem);
    res.json(userProblem);
  } catch (error) {
    console.error('Error updating problem state:', error);
    res.status(500).json({ message: 'Error updating problem state', error: error.message });
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