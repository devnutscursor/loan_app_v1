import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { X, Trash2, Edit, Plus, Save, RefreshCw } from 'lucide-react';
import { noteService } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

// Debug utility
const debug = (message, data) => {
  console.log(`[NoteModal] ${message}`, data);
  // You can also send to a logging service if needed
};

const NoteModal = ({ isOpen, onClose, loanId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(null);

  // Function to fetch notes with error handling - defined as a simple helper function
  const fetchNotes = async () => {
    if (!loanId) {
      debug('No loan ID provided');
      setError('Cannot fetch notes: Loan ID is missing');
      toast.error('Cannot fetch notes: Loan ID is missing');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      debug(`Fetching notes for loan ID: ${loanId}`);
      const response = await noteService.getNotes(loanId);
      debug('Notes API response', response);
      
      // Handle Axios response structure
      const responseData = response || {};
      
      if (responseData.success) {
        debug('Setting notes', responseData.data);
        setNotes(responseData.data || []);
        setRetryCount(0); // Reset retry count on success
      } else {
        debug('Failed to fetch notes', responseData);
        
        // Set error message for display
        const errorMessage = responseData.message || 'Failed to fetch notes';
        setError(errorMessage);
        
        // Check for authentication issues
        if (responseData.statusCode === 401) {
          toast.error('Session expired. Please log in again.');
        } else if (responseData.statusCode === 403) {
          toast.error('You do not have permission to view these notes.');
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      debug('Error fetching notes', error);
      setError('An error occurred while fetching notes');
      toast.error('An error occurred while fetching notes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch notes when the modal opens
  useEffect(() => {
    if (isOpen && loanId) {
      fetchNotes();
    }
  }, [isOpen, loanId]); // Remove fetchNotes from dependencies to prevent potential loops
  
  // No need for separate retry effect as we handle it directly

  // Handle retry button click
  const handleRetry = () => {
    // Just trigger a retry directly
    fetchNotes();
  };

  // Function to create a new note
  const handleCreateNote = async () => {
    if (!newNote.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }

    if (!loanId) {
      debug('No loan ID available');
      toast.error('Cannot create note: Loan ID is missing');
      return;
    }

    try {
      setCreating(true);
      debug(`Creating note for loan ID: ${loanId}`, { content: newNote });
      const response = await noteService.createNote(loanId, newNote);
      debug('Create note API response', response);
      
      // Handle Axios response structure
      const responseData = response || {};
      
      if (responseData.success) {
        debug('Note created successfully', responseData.data);
        // Add the new note to the top of the list
        setNotes(prevNotes => [responseData.data, ...prevNotes]);
        setNewNote('');
        toast.success('Note added successfully');
      } else {
        debug('Failed to add note', responseData);
        // Check for authentication issues
        if (responseData.statusCode === 401) {
          toast.error('Session expired. Please log in again.');
        } else if (responseData.statusCode === 403) {
          toast.error('You do not have permission to add notes.');
        } else {
          toast.error(responseData.message || 'Failed to add note');
        }
      }
    } catch (error) {
      debug('Error creating note', error);
      toast.error('An error occurred while adding the note');
    } finally {
      setCreating(false);
    }
  };

  // Function to start editing a note
  const handleStartEdit = (note) => {
    setEditingNoteId(note._id);
    setEditingContent(note.content);
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  // Function to save edited note
  const handleSaveEdit = async (noteId) => {
    if (!editingContent.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }

    try {
      debug(`Updating note ID: ${noteId}`, { content: editingContent });
      const response = await noteService.updateNote(noteId, editingContent);
      debug('Update note API response', response);
      
      // Handle Axios response structure
      const responseData = response || {};
      
      if (responseData.success) {
        debug('Note updated successfully', responseData.data);
        setNotes(notes.map(note => 
          note._id === noteId ? responseData.data : note
        ));
        setEditingNoteId(null);
        setEditingContent('');
        toast.success('Note updated successfully');
      } else {
        debug('Failed to update note', responseData);
        // Check for authentication issues
        if (responseData.statusCode === 401) {
          toast.error('Session expired. Please log in again.');
        } else if (responseData.statusCode === 403) {
          toast.error('You do not have permission to update this note.');
        } else if (responseData.statusCode === 404) {
          toast.error('Note not found. It may have been deleted.');
          // Remove from UI if not found on server
          setNotes(notes.filter(note => note._id !== noteId));
        } else {
          toast.error(responseData.message || 'Failed to update note');
        }
        // Cancel edit mode regardless of error
        setEditingNoteId(null);
      }
    } catch (error) {
      debug('Error updating note', error);
      toast.error('An error occurred while updating the note');
      setEditingNoteId(null);
    }
  };

  // Function to delete a note
  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      debug(`Deleting note ID: ${noteId}`);
      const response = await noteService.deleteNote(noteId);
      debug('Delete note API response', response);
      
      // Handle Axios response structure
      const responseData = response || {};
      
      if (responseData.success) {
        debug('Note deleted successfully');
        setNotes(notes.filter(note => note._id !== noteId));
        toast.success('Note deleted successfully');
      } else {
        debug('Failed to delete note', responseData);
        // Check for authentication issues
        if (responseData.statusCode === 401) {
          toast.error('Session expired. Please log in again.');
        } else if (responseData.statusCode === 403) {
          toast.error('You do not have permission to delete this note.');
        } else if (responseData.statusCode === 404) {
          toast.error('Note not found. It may have been already deleted.');
          // Remove from UI if not found on server
          setNotes(notes.filter(note => note._id !== noteId));
        } else {
          toast.error(responseData.message || 'Failed to delete note');
        }
      }
    } catch (error) {
      debug('Error deleting note', error);
      toast.error('An error occurred while deleting the note');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };

  if (!isOpen) return null;

  debug('Rendering NoteModal', { notesCount: notes.length, loanId, notes });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[80vh] flex flex-col mx-3 sm:mx-0">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Loan Notes</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create Note Section */}
          <div className="mb-6">
            <div className="relative">
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none break-words"
                placeholder="Add a new note..."
                rows="3"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                disabled={creating}
                style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
              ></textarea>
              <button
                className="absolute bottom-3 right-3 p-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={handleCreateNote}
                disabled={!newNote.trim() || creating}
                aria-label="Add note"
              >
                {creating ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <Plus size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Notes List */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-3">{error}</p>
              <button 
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 mx-auto hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={16} className="animate-spin-slow" /> Retry
              </button>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notes available. Add your first note above.
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note._id} className="p-4 bg-gray-50 rounded-lg shadow-sm w-full overflow-hidden">
                  {editingNoteId === note._id ? (
                    <div className="space-y-3">
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        rows="3"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                      ></textarea>
                      <div className="flex justify-end space-x-2">
                        <button
                          className="px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                          onClick={() => handleSaveEdit(note._id)}
                        >
                          <Save size={14} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {note.createdBy?.firstName} {note.createdBy?.lastName}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatDate(note.updatedAt || note.createdAt)}
                            {note.updatedAt !== note.createdAt && ' (edited)'}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleStartEdit(note)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            aria-label="Edit note"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note._id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            aria-label="Delete note"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap break-words overflow-wrap-anywhere max-w-full">{note.content}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal; 