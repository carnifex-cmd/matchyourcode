const express = require('express');
const router = express.Router();
const { getProblems, getProblemById, updateProblemState } = require('../controllers/problemController');
const auth = require('../middleware/auth');

// Get all problems (requires auth)
router.get('/', auth, getProblems);

// Get a single problem by ID
router.get('/:id', getProblemById);

// Update problem state (requires auth)
router.post('/:id/state', auth, updateProblemState);

module.exports = router; 