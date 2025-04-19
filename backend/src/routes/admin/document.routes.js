const express = require('express');
const router = express.Router();
const documentController = require('../../controllers/admin/document.controller');
const { protect, authorize } = require('../../middleware/auth');
const upload = require('../../middleware/fileUpload');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Document routes
router.get('/documents', documentController.getAllDocuments);
router.patch('/documents/:documentId/verify', documentController.verifyDocument);

// Document template routes
router.get('/documents/templates', documentController.getDocumentTemplates);
router.post(
  '/documents/templates',
  upload.single('template'),
  documentController.createDocumentTemplate
);
router.delete('/documents/templates/:templateId', documentController.deleteDocumentTemplate);

module.exports = router;
