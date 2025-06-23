const express = require('express');
const documentController = require('../controllers/document.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Debug endpoint to test file upload (available to all authenticated users)
router.post('/debug-upload', upload.single('file', 'debug'), (req, res) => {
  try {
    // Log request details
    console.log('Debug upload file request:');
    console.log('- User:', req.user._id);
    console.log('- Content-Type:', req.headers['content-type']);
    console.log('- Body keys:', Object.keys(req.body));
    console.log('- File present:', !!req.file);
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
        requestHeaders: {
          contentType: req.headers['content-type']
        }
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'File received successfully',
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        filename: req.file.filename
      },
      body: req.body
    });
  } catch (error) {
    console.error('Debug upload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'File upload failed',
      error: error.message
    });
  }
});

// Upload a document
router.post('/upload', upload.single('file', 'documents'), documentController.uploadDocument);

// Get all documents with filtering and pagination
router.get('/', documentController.getAllDocuments);

// Get user's documents
router.get('/user', documentController.getUserDocuments);

// Get documents for a specific loan
router.get('/loan/:loanId', documentController.getLoanDocuments);

// Get document requirements for a loan
router.get('/requirements/:loanId', documentController.getDocumentRequirements);

// Verify a document (lender only)
router.post('/verify/:id', authorize(['lender', 'admin']), documentController.verifyDocument);

// Request a document from a borrower (lender only)
router.post('/request', documentController.requestDocument);

// Batch request multiple documents from a borrower (lender only)
const documentBatchController = require('../controllers/document.batchController');
router.post('/request/batch', documentBatchController.batchRequestDocuments);

// Approve a document (lender only)
router.put('/:id/approve', documentController.approveDocument);

// Reject a document (lender only)
router.put('/:id/reject', documentController.rejectDocument);

// Get a specific document
router.get('/:id', documentController.getDocument);

// Update a document's metadata or status
router.patch('/:id', documentController.updateDocument);

// Delete a document
router.delete('/:id', documentController.deleteDocument);

// Download a document
router.get('/:id/download', documentController.downloadDocument);

module.exports = router;
