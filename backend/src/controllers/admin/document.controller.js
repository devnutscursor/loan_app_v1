const Document = require('../../models/document.model');
const DocumentTemplate = require('../../models/documentTemplate.model');
const User = require('../../models/user.model');
const { uploadToStorage, deleteFromStorage } = require('../../utils/fileStorage');
const logger = require('../../utils/logger');
const { ApiError } = require('../../utils/ApiError');

/**
 * Get all documents with optional filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllDocuments = async (req, res, next) => {
  try {
    const { status, documentType, search, userId, loanId, page = 1, limit = 50 } = req.query;
    
    const query = {};
    
    // Apply filters
    if (status && status !== 'all') {
      query.verificationStatus = status;
    }
    
    if (documentType && documentType !== 'all') {
      query.documentType = documentType;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (loanId) {
      query.loanId = loanId;
    }
    
    // Handle search
    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      
      query.$or = [
        { fileName: { $regex: search, $options: 'i' } },
        { userId: { $in: userIds } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get documents with borrower information
    const documents = await Document.find(query)
      .populate({
        path: 'userId',
        select: 'firstName lastName email profilePicture',
        model: 'User'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Transform data for frontend
    const transformedDocuments = documents.map(doc => ({
      _id: doc._id,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      fileUrl: doc.fileUrl,
      documentType: doc.documentType,
      verificationStatus: doc.verificationStatus,
      verificationMessage: doc.verificationMessage,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      borrower: doc.userId ? {
        _id: doc.userId._id,
        firstName: doc.userId.firstName,
        lastName: doc.userId.lastName,
        email: doc.userId.email,
        profilePicture: doc.userId.profilePicture
      } : null,
      loanId: doc.loanId
    }));
    
    // Get total count for pagination
    const totalDocuments = await Document.countDocuments(query);
    
    res.status(200).json({
      success: true,
      documents: transformedDocuments,
      pagination: {
        total: totalDocuments,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalDocuments / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Error in getAllDocuments: ${error.message}`);
    next(error);
  }
};

/**
 * Verify a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.verifyDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { status, message } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw new ApiError(400, 'Invalid status. Must be pending, approved, or rejected');
    }
    
    const document = await Document.findById(documentId);
    
    if (!document) {
      throw new ApiError(404, 'Document not found');
    }
    
    // Update document verification status
    document.verificationStatus = status;
    
    // Add verification message if provided (required for rejection)
    if (status === 'rejected' && !message) {
      throw new ApiError(400, 'Rejection reason is required');
    }
    
    if (message) {
      document.verificationMessage = message;
    }
    
    // Record who verified the document
    document.verifiedBy = req.user._id;
    document.verifiedAt = new Date();
    
    await document.save();
    
    res.status(200).json({
      success: true,
      message: `Document ${status}`,
      document
    });
  } catch (error) {
    logger.error(`Error in verifyDocument: ${error.message}`);
    next(error);
  }
};

/**
 * Get all document templates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getDocumentTemplates = async (req, res, next) => {
  try {
    const templates = await DocumentTemplate.find()
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      templates
    });
  } catch (error) {
    logger.error(`Error in getDocumentTemplates: ${error.message}`);
    next(error);
  }
};

/**
 * Create a document template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createDocumentTemplate = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'Template file is required');
    }
    
    const { name, description, documentType } = req.body;
    
    if (!name || !documentType) {
      throw new ApiError(400, 'Name and document type are required');
    }
    
    // Upload file to storage
    const fileData = await uploadToStorage(req.file, 'templates');
    
    // Create template in database
    const template = new DocumentTemplate({
      name,
      description,
      documentType,
      fileName: fileData.fileName,
      fileUrl: fileData.fileUrl,
      fileSize: fileData.fileSize,
      createdBy: req.user._id
    });
    
    await template.save();
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    logger.error(`Error in createDocumentTemplate: ${error.message}`);
    next(error);
  }
};

/**
 * Delete a document template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteDocumentTemplate = async (req, res, next) => {
  try {
    const { templateId } = req.params;
    
    const template = await DocumentTemplate.findById(templateId);
    
    if (!template) {
      throw new ApiError(404, 'Template not found');
    }
    
    // Delete file from storage
    await deleteFromStorage(template.fileName);
    
    // Delete template from database
    await template.remove();
    
    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    logger.error(`Error in deleteDocumentTemplate: ${error.message}`);
    next(error);
  }
};
