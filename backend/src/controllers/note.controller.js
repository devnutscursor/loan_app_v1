const Note = require('../models/note.model');
const Loan = require('../models/loan.model');
const mongoose = require('mongoose');

/**
 * Get all notes for a loan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getNotes = async (req, res) => {
  try {
    const { loanId } = req.params;

    // Validate loanId format
    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan ID format'
      });
    }

    // Check if loan exists
    const loanExists = await Loan.exists({ _id: loanId });
    if (!loanExists) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Get notes for the loan
    const notes = await Note.find({ loanId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName email role')
      .exec();

    return res.status(200).json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('Error getting notes:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while getting notes',
      error: error.message
    });
  }
};

/**
 * Create a new note for a loan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createNote = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    // Validate loanId format
    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan ID format'
      });
    }

    // Check if loan exists
    const loanExists = await Loan.exists({ _id: loanId });
    if (!loanExists) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Create the note
    const note = new Note({
      loanId,
      content,
      createdBy: userId
    });

    await note.save();

    // Populate the createdBy field for the response
    await note.populate('createdBy', 'firstName lastName email role');

    return res.status(201).json({
      success: true,
      data: note,
      message: 'Note created successfully'
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the note',
      error: error.message
    });
  }
};

/**
 * Update a note
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    // Validate noteId format
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID format'
      });
    }

    // Find the note
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if the user is the creator of the note
    if (note.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this note'
      });
    }

    // Update the note
    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      { content },
      { new: true }
    ).populate('createdBy', 'firstName lastName email role');

    return res.status(200).json({
      success: true,
      data: updatedNote,
      message: 'Note updated successfully'
    });
  } catch (error) {
    console.error('Error updating note:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the note',
      error: error.message
    });
  }
};

/**
 * Delete a note
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id;

    // Validate noteId format
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID format'
      });
    }

    // Find the note
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if the user is the creator of the note
    if (note.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this note'
      });
    }

    // Delete the note
    await Note.findByIdAndDelete(noteId);

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the note',
      error: error.message
    });
  }
}; 