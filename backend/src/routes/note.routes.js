const express = require('express');
const router = express.Router();
const noteController = require('../controllers/note.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Apply middleware to all routes in this router
router.use(authenticate);

// Only lenders and admins can manage notes
router.use(authorize('lender', 'admin'));

// Get all notes for a loan
router.get('/:loanId', noteController.getNotes);

// Create a new note for a loan
router.post('/:loanId', noteController.createNote);

// Update a note
router.put('/:noteId', noteController.updateNote);

// Delete a note
router.delete('/:noteId', noteController.deleteNote);

module.exports = router; 