const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const loanProgramController = require('../controllers/loanProgram.controller');

// GET /api/v1/loan-programs - Get all loan programs
router.get('/', authenticate, loanProgramController.getAllLoanPrograms);

// POST /api/v1/loan-programs - Create a new loan program
router.post('/', authenticate, loanProgramController.createLoanProgram);

// GET /api/v1/loan-programs/:id - Get a specific loan program
router.get('/:id', authenticate, loanProgramController.getLoanProgram);

// PUT /api/v1/loan-programs/:id - Update a loan program
router.put('/:id', authenticate, loanProgramController.updateLoanProgram);

// DELETE /api/v1/loan-programs/:id - Delete a loan program
router.delete('/:id', authenticate, loanProgramController.deleteLoanProgram);

// GET /api/v1/loan-programs/qualification/:loanId/:programId - Check qualification for a program
router.get('/qualification/:loanId/:programId', authenticate, loanProgramController.calculateQualification);

module.exports = router;
