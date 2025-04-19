const express = require('express');
const documentController = require('../controllers/document.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Upload a document
router.post('/upload', upload.single('file'), documentController.uploadDocument);

// Get all documents with filtering and pagination
router.get('/', documentController.getAllDocuments);

// Get a specific document
router.get('/:id', documentController.getDocument);

// Update a document's metadata or status
router.patch('/:id', documentController.updateDocument);

// Delete a document
router.delete('/:id', documentController.deleteDocument);

// Download a document
router.get('/:id/download', documentController.downloadDocument);

module.exports = router;
