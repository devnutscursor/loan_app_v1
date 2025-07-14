const Document = require('../models/document.model');
const Loan = require('../models/loan.model');
const Borrower = require('../models/borrower.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const User = require('../models/user.model');
const { title } = require('process');
const emailService = require('../utils/email/emailService');
const { deleteFromS3, getSignedUrl } = require('../services/s3.service');

// Check if we should use S3 or local storage
const USE_S3 = process.env.USE_S3 === 'true' || false;

/**
 * Upload a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return next(new ApiError('No file uploaded', 400));
    }

    const { name, description, category, documentType, loanId, borrowerId } = req.body;

    // Validate required fields
    if (!name) {
      return next(new ApiError('Document name is required', 400));
    }

    // Get file details - handle both S3 and local storage
    const fileUrl = req.file.url || req.file.filename; // S3 URL or local filename
    const s3Key = req.file.key || null; // S3 key for deletion if using S3
    const originalFilename = req.file.originalname;
    const mimeType = req.file.mimetype;
    const size = req.file.size;

    // Create document object
    const documentData = {
      name,
      description: description || name,
      fileUrl,
      s3Key, // Store S3 key for deletion
      originalFilename,
      mimeType,
      size,
      uploadedBy: req.user._id,
      category: category || 'Other',
      documentType: documentType || 'Other'
    };

    // If loanId is provided, validate and associate with loan
    if (loanId) {
      const loan = await Loan.findById(loanId);
      if (!loan) {
        return next(new ApiError('Loan not found', 404));
      }
      documentData.loan = loanId;
      
      // Log loan association
      logger.info(`Document associated with loan ID: ${loanId}, loan number: ${loan.loanNumber || 'N/A'}`);
    }

    // If borrowerId is provided, validate and associate with borrower
    if (borrowerId) {
      const borrower = await Borrower.findById(borrowerId);
      if (!borrower) {
        return next(new ApiError('Borrower not found', 404));
      }
      documentData.borrower = borrowerId;
    }

    // Create document
    const document = await Document.create(documentData);
    
    // If this is associated with a loan, populate the loan info for response
    if (loanId) {
      await document.populate('loan', 'loanNumber');
    }

    // Log the upload
    logger.info(`Document uploaded: ${name} by ${req.user._id}`);

    // Create audit log entry
    try {
      const AuditLog = require('../models/auditLog.model');
      await AuditLog.create({
        eventType: 'document:uploaded',
        description: `Document "${name}" uploaded`,
        userId: req.user._id,
        userRole: req.user.role,
        level: 'info',
        entityType: 'document',
        entityId: document._id,
        metadata: {
          documentName: name,
          documentType: documentType || 'Other',
          category: category || 'Other',
          loanId: loanId || null,
          loanNumber: document.loan ? document.loan.loanNumber : null,
          borrowerId: borrowerId || null
        }
      });
    } catch (auditError) {
      // Don't fail the upload if audit logging fails
      logger.error(`Failed to create audit log for document upload: ${auditError}`);
    }

    res.status(201).json({
      status: 'success',
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all documents
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllDocuments = async (req, res, next) => {
  try {
    // Implement pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Build filter based on query parameters
    const filter = {};

    // Filter by loan
    if (req.query.loanId) {
      filter.loan = req.query.loanId;
      
      // Check permissions for borrowers
      if (req.user.role === 'borrower') {
        const loan = await Loan.findById(req.query.loanId);
        if (!loan) {
          return next(new ApiError('Loan not found', 404));
        }

        const borrower = await Borrower.findOne({ user: req.user._id });
        if (!borrower) {
          return next(new ApiError('Borrower profile not found', 404));
        }

        const isPrimaryBorrower = loan.borrower.toString() === borrower._id.toString();
        const isCoBorrower = loan.coBorrowers.some(coBorrower => 
          coBorrower.toString() === borrower._id.toString()
        );

        if (!isPrimaryBorrower && !isCoBorrower) {
          return next(new ApiError('You are not authorized to view documents for this loan', 403));
        }
      }
    }

    // Filter by borrower
    if (req.query.borrowerId) {
      filter.borrower = req.query.borrowerId;
      
      // Check permissions for borrowers
      if (req.user.role === 'borrower') {
        const borrower = await Borrower.findOne({ user: req.user._id });
        if (!borrower) {
          return next(new ApiError('Borrower profile not found', 404));
        }

        if (req.query.borrowerId !== borrower._id.toString()) {
          return next(new ApiError('You are not authorized to view documents for this borrower', 403));
        }
      }
    }

    // Filter by category
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Filter by document type
    if (req.query.documentType) {
      filter.documentType = req.query.documentType;
    }

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // If user is a borrower and not filtering by specific loan or borrower,
    // only show their own documents
    if (req.user.role === 'borrower' && !req.query.loanId && !req.query.borrowerId) {
      const borrower = await Borrower.findOne({ user: req.user._id });
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }

      filter.borrower = borrower._id;
    }

    // Get documents
    const documents = await Document.find(filter)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .skip(skip)
      .limit(limit)
      .sort({ uploadedAt: -1 });

    // Get total count for pagination
    const total = await Document.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: documents.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .populate('loan')
      .populate('borrower');
    
    if (!document) {
      return next(new ApiError('Document not found', 404));
    }
    
    // Check permissions for borrowers
    if (req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id });
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      
      // Check if document belongs to borrower directly
      const isBorrowerDocument = document.borrower && 
        document.borrower._id.toString() === borrower._id.toString();
      
      // Check if document belongs to borrower's loan
      let isLoanDocument = false;
      if (document.loan) {
        const loan = await Loan.findById(document.loan._id);
        if (loan) {
          const isPrimaryBorrower = loan.borrower.toString() === borrower._id.toString();
          const isCoBorrower = loan.coBorrowers.some(coBorrower => 
            coBorrower.toString() === borrower._id.toString()
          );
          
          isLoanDocument = isPrimaryBorrower || isCoBorrower;
        }
      }
      
      if (!isBorrowerDocument && !isLoanDocument) {
        return next(new ApiError('You are not authorized to view this document', 403));
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update document details or status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, category, documentType, status, reviewNotes } = req.body;
    
    // Find document
    const document = await Document.findById(id);
    
    if (!document) {
      return next(new ApiError('Document not found', 404));
    }
    
    // Check permissions
    if (req.user.role === 'borrower') {
      // Borrowers can only update their own documents' metadata
      const borrower = await Borrower.findOne({ user: req.user._id });
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      
      const isBorrowerDocument = document.borrower && 
        document.borrower.toString() === borrower._id.toString();
      
      let isLoanDocument = false;
      if (document.loan) {
        const loan = await Loan.findById(document.loan);
        if (loan) {
          const isPrimaryBorrower = loan.borrower.toString() === borrower._id.toString();
          const isCoBorrower = loan.coBorrowers.some(coBorrower => 
            coBorrower.toString() === borrower._id.toString()
          );
          
          isLoanDocument = isPrimaryBorrower || isCoBorrower;
        }
      }
      
      if (!isBorrowerDocument && !isLoanDocument) {
        return next(new ApiError('You are not authorized to update this document', 403));
      }
      
      // Borrowers can only update certain fields
      const updateData = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (category) updateData.category = category;
      if (documentType) updateData.documentType = documentType;
      
      // Borrowers cannot update status or review notes
      
      // Update document
      const updatedDocument = await Document.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      // Log the update
      logger.info(`Document ${updatedDocument._id} updated by borrower ${req.user._id}`);
      
      return res.status(200).json({
        status: 'success',
        message: 'Document updated successfully',
        data: updatedDocument
      });
    }
    
    // Lenders and admins can update all fields
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (documentType) updateData.documentType = documentType;
    
    // Update status and review info
    if (status && status !== document.status) {
      updateData.status = status;
      updateData.reviewedBy = req.user._id;
      updateData.reviewDate = new Date();
    }
    
    if (reviewNotes) updateData.reviewNotes = reviewNotes;
    
    // Update document
    const updatedDocument = await Document.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Log the update
    logger.info(`Document ${updatedDocument._id} updated by ${req.user.role} ${req.user._id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Document updated successfully',
      data: updatedDocument
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find document
    const document = await Document.findById(id);
    
    if (!document) {
      return next(new ApiError('Document not found', 404));
    }
    
    // Check permissions
    if (req.user.role === 'borrower') {
      // Borrowers can only delete their own documents
      const borrower = await Borrower.findOne({ user: req.user._id });
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      
      const isBorrowerDocument = document.borrower && 
        document.borrower.toString() === borrower._id.toString();
      
      if (!isBorrowerDocument) {
        return next(new ApiError('You are not authorized to delete this document', 403));
      }
    }
    
    // Delete the file from storage
    try {
      if (USE_S3 && document.s3Key) {
        // Delete from S3
        await deleteFromS3(document.s3Key);
      } else {
        // Delete from local storage
        const filePath = path.join(process.cwd(), 'uploads', document.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue with database deletion even if file deletion fails
    }
    
    // Delete document from database
    await Document.findByIdAndDelete(id);
    
    // Log the deletion
    logger.info(`Document ${id} deleted by ${req.user.role} ${req.user._id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find document
    const document = await Document.findById(id);
    
    if (!document) {
      return next(new ApiError('Document not found', 404));
    }
    
    // Check permissions for borrowers
    if (req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id });
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      
      // Check if document belongs to borrower directly
      const isBorrowerDocument = document.borrower && 
        document.borrower.toString() === borrower._id.toString();
      
      // Check if document belongs to borrower's loan
      let isLoanDocument = false;
      if (document.loan) {
        const loan = await Loan.findById(document.loan);
        if (loan) {
          const isPrimaryBorrower = loan.borrower.toString() === borrower._id.toString();
          const isCoBorrower = loan.coBorrowers.some(coBorrower => 
            coBorrower.toString() === borrower._id.toString()
          );
          
          isLoanDocument = isPrimaryBorrower || isCoBorrower;
        }
      }
      
      if (!isBorrowerDocument && !isLoanDocument) {
        return next(new ApiError('You are not authorized to download this document', 403));
      }
    }
    
    // Handle file download based on storage type
    if (USE_S3 && document.s3Key) {
      // For S3, redirect to signed URL
      try {
        const signedUrl = await getSignedUrl(document.s3Key, 3600); // 1 hour expiry
        
        // Log the download
        logger.info(`Document ${id} downloaded by ${req.user.role} ${req.user._id}`);
        
        return res.redirect(signedUrl);
      } catch (error) {
        console.error('Error generating signed URL:', error);
        return next(new ApiError('Failed to generate download link', 500));
      }
    } else {
      // Handle local file download
      const filePath = path.join(process.cwd(), 'uploads', document.fileUrl);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return next(new ApiError('File not found on server', 404));
      }
      
      // Log the download
      logger.info(`Document ${id} downloaded by ${req.user.role} ${req.user._id}`);
      
      // Send file
      res.download(filePath, document.originalFilename);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get documents for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserDocuments = async (req, res, next) => {
  try {
    // Build filter based on the current user
    const filter = {};
    
    if (req.user.role === 'borrower') {
      // For borrowers, find their associated borrower profile
      const borrower = await Borrower.findOne({ user: req.user._id });
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      filter.borrower = borrower._id;
    } else if (req.user.role === 'lender') {
      // For lenders, show documents from loans they manage
      // This would require additional logic based on your system's design
      // For now, we'll just return documents where they are the uploader
      filter.uploadedBy = req.user._id;
    } else if (req.user.role === 'admin') {
      // Admins can see all documents, so no filter needed
    } else {
      // Unknown role type
      return next(new ApiError('Unauthorized access', 403));
    }
    
    // Implement pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // Apply additional filters from query parameters
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { originalFilename: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get documents with pagination
    const documents = await Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name email')
      .populate('loan', 'loanNumber status')
      .populate('borrower', 'firstName lastName');
    
    // Get total count for pagination
    const total = await Document.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: documents.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get documents for a specific loan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLoanDocuments = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    
    // Check if loan exists
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // Check permissions for borrowers
    if (req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id });
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      
      const isPrimaryBorrower = loan.borrower.toString() === borrower._id.toString();
      const isCoBorrower = loan.coBorrowers.some(coBorrower => 
        coBorrower.toString() === borrower._id.toString()
      );
      
      if (!isPrimaryBorrower && !isCoBorrower) {
        return next(new ApiError('You are not authorized to view documents for this loan', 403));
      }
    }
    
    // Implement pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = { loan: loanId };
    
    // Apply additional filters from query parameters
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { originalFilename: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get documents with pagination
    const documents = await Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name email')
      .populate('borrower', 'firstName lastName');
    
    // Get total count for pagination
    const total = await Document.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: documents.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get document requirements for a loan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getDocumentRequirements = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    
    // Check if loan exists
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // Check permissions for borrowers
    if (req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id });
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      
      const isPrimaryBorrower = loan.borrower.toString() === borrower._id.toString();
      const isCoBorrower = loan.coBorrowers.some(coBorrower => 
        coBorrower.toString() === borrower._id.toString()
      );
      
      if (!isPrimaryBorrower && !isCoBorrower) {
        return next(new ApiError('You are not authorized to view document requirements for this loan', 403));
      }
    }
    
    // Define required documents based on loan type, status, etc.
    const requiredDocuments = [
      {
        id: 'identity',
        name: 'Identity Documents',
        description: 'Documents to verify your identity',
        required: true,
        examples: ['Driver\'s License', 'Passport', 'State ID']
      },
      {
        id: 'income',
        name: 'Income Verification',
        description: 'Documents to verify your income',
        required: true,
        examples: ['Pay Stubs', 'W-2 Forms', 'Tax Returns']
      },
      {
        id: 'assets',
        name: 'Asset Documentation',
        description: 'Documents to verify your assets',
        required: true,
        examples: ['Bank Statements', 'Investment Account Statements']
      },
      {
        id: 'property',
        name: 'Property Information',
        description: 'Documents related to the property',
        required: loan.loanDetails?.loanType === 'Purchase',
        examples: ['Purchase Agreement', 'Property Listing', 'Appraisal']
      }
    ];
    
    // Get existing documents for this loan
    const existingDocuments = await Document.find({ loan: loanId })
      .select('category status name description')
      .lean();
    
    // Combine information to show what's submitted and what's still needed
    const requirementStatus = requiredDocuments.map(requirement => {
      const submitted = existingDocuments.filter(doc => 
        doc.category.toLowerCase() === requirement.id.toLowerCase()
      );
      
      return {
        ...requirement,
        submitted: submitted.length > 0,
        documentCount: submitted.length,
        documents: submitted
      };
    });
    
    res.status(200).json({
      status: 'success',
      data: requirementStatus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify a document (update status, add notes)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.verifyDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Validate input
    if (!status) {
      return next(new ApiError('Document status is required', 400));
    }
    
    // Check valid status options
    const validStatuses = ['Approved', 'Rejected', 'Pending Review', 'Needs Correction'];
    if (!validStatuses.includes(status)) {
      return next(new ApiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
    }
    
    // Find document
    const document = await Document.findById(id).populate('loan', 'loanNumber');
    if (!document) {
      return next(new ApiError('Document not found', 404));
    }
    
    // Only lenders and admins can verify documents
    if (!['lender', 'admin'].includes(req.user.role)) {
      return next(new ApiError('You are not authorized to verify documents', 403));
    }
    
    // Get previous status for audit log
    const previousStatus = document.status;
    
    // Update document status and notes
    document.status = status;
    document.reviewNotes = notes || document.reviewNotes;
    document.reviewedBy = req.user._id;
    document.reviewDate = new Date();
    
    await document.save();

    // Update related loan condition when document status changes
    if (document.loan) {
      try {
        const Loan = require('../models/loan.model');
        const loan = await Loan.findById(document.loan);

        if (loan && loan.conditions) {
          // Find the condition that matches this document
          const conditionIndex = loan.conditions.findIndex(condition =>
            condition.category === document.category &&
            condition.documentType === document.documentType &&
            condition.status === 'Pending'
          );

          if (conditionIndex !== -1) {
            if (status === 'Approved') {
              // Update the condition status to Completed
              loan.conditions[conditionIndex].status = 'Completed';
              loan.conditions[conditionIndex].completedDate = new Date();

              await loan.save();

              console.log(`✅ Updated loan condition for verified document: ${document.documentType} -> ${status}`);
              logger.info(`Loan condition updated for verified document ${id}: ${document.documentType} -> ${status}`);
            } else if (status === 'Rejected') {
              // Keep condition as Pending for rejected documents
              console.log(`📋 Loan condition remains pending for rejected document: ${document.documentType}`);
              logger.info(`Loan condition remains pending for rejected document ${id}: ${document.documentType}`);
            }
          } else {
            console.log(`⚠️ No matching pending condition found for document: ${document.documentType}`);
          }
        }
      } catch (conditionError) {
        console.error('Error updating loan condition:', conditionError);
        logger.error(`Failed to update loan condition for verified document ${id}: ${conditionError.message}`);
        // Don't fail the whole verification process if condition update fails
      }
    }

    // Log the verification
    logger.info(`Document ${id} verified with status ${status} by ${req.user.role} ${req.user._id}`);
    
    // Create audit log entry for document status change
    try {
      const AuditLog = require('../models/auditLog.model');
      await AuditLog.create({
        eventType: 'document:status_changed',
        description: `Document status changed from "${previousStatus}" to "${status}"`,
        userId: req.user._id,
        userRole: req.user.role,
        level: 'info',
        entityType: 'document',
        entityId: document._id,
        metadata: {
          documentName: document.name,
          previousStatus: previousStatus,
          newStatus: status,
          loanId: document.loan ? document.loan._id : null,
          loanNumber: document.loan ? document.loan.loanNumber : null,
          reviewedBy: {
            id: req.user._id,
            role: req.user.role
          }
        }
      });
    } catch (auditError) {
      // Don't fail the operation if audit logging fails
      logger.error(`Failed to create audit log for document status change: ${auditError}`);
    }
    
    // Send socket notification to borrower
    try {
      const io = req.app.get('io');
      if (io && document.borrower) {
        // Emit directly to the borrower's user ID and borrower-specific room
        const borrowerId = document.borrower.toString();
        const notificationData = {
          type: 'document-status',
          eventType: 'document-status',
          documentName: document.name,
          documentType: document.documentType,
          status: 'Approved',
          previousStatus: previousStatus,
          loanId: document.loan ? document.loan._id : null,
          loanNumber: document.loan ? document.loan.loanNumber : null,
          borrowerId: borrowerId,
          reviewedBy: req.user._id,
          notes: notes || document.notes,
          timestamp: new Date().toISOString()
        };
        
        console.log(`Emitting document-status directly to ${borrowerId} and borrower-${borrowerId}:`, notificationData);
        
        io.to(borrowerId).emit('document-status', notificationData);
        io.to(`borrower-${borrowerId}`).emit('document-status', notificationData);
        
        logger.info(`Socket notification sent for document approval: ${document.name} to borrower ${borrowerId}`);
      }
    } catch (socketError) {
      logger.error(`Failed to send socket notification for document approval: ${socketError.message}`);
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Document verified successfully',
      data: document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request a document from a borrower
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.requestDocument = async (req, res, next) => {
  try {
    const { borrowerId, loanId, title, documentType, category, description, dueDate, isUpdate } = req.body;
    
    // Validate required inputs
    if (!borrowerId || !loanId || !documentType) {
      return next(new ApiError('Borrower ID, loan ID, and document type are required', 400));
    }
    
    // Check if borrower exists
    const borrower = await Borrower.findById(borrowerId);
    if (!borrower) {
      return next(new ApiError('Borrower not found', 404));
    }
    
    // Check if loan exists
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    // Check if borrower is associated with this loan
    const isPrimaryBorrower = loan.borrower.toString() === borrower._id.toString();
    const isCoBorrower = loan.coBorrowers.some(coBorrower => 
      coBorrower.toString() === borrower._id.toString()
    );
    
    if (!isPrimaryBorrower && !isCoBorrower) {
      return next(new ApiError('This borrower is not associated with the specified loan', 400));
    }
    
    // If this is an update request, find and update existing document status
    if (isUpdate === true) {
      // Find the document by category and documentType
      const existingDocument = await Document.findOne({
        loan: loanId,
        documentType: documentType,
        category: category || { $exists: true }, // If category is provided, match it; otherwise, just check that category exists
        borrower: borrowerId
      });
      
      if (existingDocument) {
        // Update the document status to indicate correction needed
        existingDocument.status = 'Needs Correction';
        existingDocument.reviewNotes = description || 'Please provide an updated version of this document';
        existingDocument.reviewedBy = req.user._id;
        existingDocument.reviewDate = new Date();
        
        await existingDocument.save();
        
        logger.info(`Document ${existingDocument._id} marked as 'Needs Correction' by ${req.user.role} ${req.user._id}`);
      }
    }
    
    console.log('title', title);
    // Create a document request condition
    const newCondition = {
      title: `${title} Document Required`,
      description: description || `Please upload your ${title} document`,
      category: category,
      documentType: documentType,
      status: 'Pending',
      assignedTo: borrower.user, // Assign to the borrower's user account
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
    };
    
    console.log('Loan:', loan);
    console.log('New Condition:', newCondition);
    
    // Add to loan conditions array
    loan.conditions = loan.conditions || [];
    loan.conditions.push(newCondition);
    await loan.save();
    
    // Get the borrower's user to send notification
    const borrowerUser = await User.findById(borrower.user);
    
    if (borrowerUser) {
      // Log the request
      logger.info(`Document request for ${documentType} created for borrower ${borrowerId} by ${req.user.role} ${req.user._id}`);
      
      // Send an email notification to the borrower
      try {
        // Get borrower details from the loan
        const borrowerName = loan.borrowerDetails?.firstName 
          ? `${loan.borrowerDetails.firstName} ${loan.borrowerDetails.lastName}`
          : borrowerUser.name || 'Borrower';
        
        // Get borrower email from user account or loan details
        const borrowerEmail = borrowerUser.email || loan.borrowerDetails?.email;
        
        if (borrowerEmail) {
          // Prepare document information for email
          const documentInfo = {
            title: title || documentType,
            description: description || `Please upload your ${title || documentType} document`,
            category: category
          };
          
          // Send the email notification
          await emailService.sendDocumentRequestNotification({
            email: borrowerEmail,
            borrowerName,
            loanNumber: loan.loanNumber,
            documents: [documentInfo] // For individual requests
          });
          
          logger.info(`Email notification sent to borrower ${borrowerId} at ${borrowerEmail}`);
        } else {
          logger.warn(`Could not send email notification: No email found for borrower ${borrowerId}`);
        }
      } catch (emailError) {
        // Don't fail the overall request if email sending fails
        logger.error(`Failed to send email notification: ${emailError.message}`, { 
          error: emailError,
          borrowerId
        });
      }
    }
    
    // Send socket notification to borrower
    try {
      const io = req.app.get('io');
      if (io) {
        // Emit directly to the borrower's user ID and borrower-specific room
        const borrowerId = borrower.user.toString();
        const notificationData = {
          type: 'document-request',
          eventType: 'document-request',
          documentName: title || documentType,
          documentType: documentType,
          category: category,
          description: description || `Please upload your ${title || documentType} document`,
          loanId: loanId,
          loanNumber: loan.loanNumber,
          borrowerId: borrowerId,
          requestedBy: req.user._id,
          timestamp: new Date().toISOString()
        };
        
        console.log(`Emitting document-request directly to ${borrowerId} and borrower-${borrowerId}:`, notificationData);
        
        io.to(borrowerId).emit('document-request', notificationData);
        io.to(`borrower-${borrowerId}`).emit('document-request', notificationData);
        
        logger.info(`Socket notification sent for document request: ${title || documentType} to borrower ${borrowerId}`);
      }
    } catch (socketError) {
      logger.error(`Failed to send socket notification for document request: ${socketError.message}`);
    }
    
    res.status(201).json({
      status: 'success',
      message: 'Document request created successfully',
      data: {
        condition: loan.conditions[loan.conditions.length - 1],
        loan: {
          _id: loan._id,
          loanNumber: loan.loanNumber
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.approveDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { loanId, notes } = req.body;
    
    console.log('Loan ID:', loanId);
    // Log the incoming request
    logger.info(`Document approval request received for document ID: ${id} by user: ${req.user._id}`);
    
    // Validate required inputs
    if (!id) {
      return next(new ApiError('Document ID is required', 400));
    }
    
    // Find document
    const document = await Document.findById(id).populate('loan', 'loanNumber');
    if (!document) {
      return next(new ApiError('Document not found', 404));
    }
    
    // Check if loan exists if loanId is provided
    if (loanId) {
      const loan = await Loan.findById(loanId);
      if (!loan) {
        return next(new ApiError('Loan not found', 404));
      }
    }
    
    // Add detailed debugging for authorization
    console.log('🔐 Authorization check:');
    console.log('👤 User:', req.user); 
    console.log('🔑 User role:', req.user.role);
    console.log('✅ Allowed roles:', ['lender', 'admin']);
    console.log('🔍 Role check result:', ['lender', 'admin'].includes(req.user.role));
    
    // Only lenders and admins can approve documents
    if (!['lender', 'admin'].includes(req.user.role)) {
      console.log('❌ Authorization failed: User role does not match required roles');
      return next(new ApiError('You are not authorized to approve documents', 403));
    }
    
    console.log('✅ Authorization passed')
    
    console.log('Document:  ', document);
    
    // Get previous status for audit log
    const previousStatus = document.status;
    
    // Update document status
    document.status = 'Approved';
    document.notes = notes || document.notes;
    document.reviewedBy = req.user._id;
    document.reviewedAt = Date.now();
    document.reviewDate = new Date();
    
    await document.save();

    // Update related loan condition when document is approved
    if (document.loan) {
      try {
        const Loan = require('../models/loan.model');
        const loan = await Loan.findById(document.loan);

        if (loan && loan.conditions) {
          // Find the condition that matches this document
          const conditionIndex = loan.conditions.findIndex(condition =>
            condition.category === document.category &&
            condition.documentType === document.documentType &&
            condition.status === 'Pending'
          );

          if (conditionIndex !== -1) {
            // Update the condition status to Completed
            loan.conditions[conditionIndex].status = 'Completed';
            loan.conditions[conditionIndex].completedDate = new Date();

            await loan.save();

            console.log(`✅ Updated loan condition for approved document: ${document.documentType}`);
            logger.info(`Loan condition updated for approved document ${id}: ${document.documentType}`);
          } else {
            console.log(`⚠️ No matching pending condition found for document: ${document.documentType}`);
          }
        }
      } catch (conditionError) {
        console.error('Error updating loan condition:', conditionError);
        logger.error(`Failed to update loan condition for approved document ${id}: ${conditionError.message}`);
        // Don't fail the whole approval process if condition update fails
      }
    }

    // Log the approval
    logger.info(`Document ${id} approved by ${req.user.role} ${req.user._id}`);
    
    // Create audit log entry for document status change
    try {
      const AuditLog = require('../models/auditLog.model');
      await AuditLog.create({
        eventType: 'document:status_changed',
        description: `Document status changed from "${previousStatus}" to "Approved"`,
        userId: req.user._id,
        userRole: req.user.role,
        level: 'info',
        entityType: 'document',
        entityId: document._id,
        metadata: {
          documentName: document.name,
          previousStatus: previousStatus,
          newStatus: 'Approved',
          loanId: document.loan ? document.loan._id : null,
          loanNumber: document.loan ? document.loan.loanNumber : null,
          reviewedBy: {
            id: req.user._id,
            role: req.user.role
          }
        }
      });
    } catch (auditError) {
      // Don't fail the operation if audit logging fails
      logger.error(`Failed to create audit log for document status change: ${auditError}`);
    }
    
    // Send socket notification to borrower
    try {
      const io = req.app.get('io');
      if (io && document.borrower) {
        // Emit directly to the borrower's user ID and borrower-specific room
        const borrowerId = document.borrower.toString();
        const notificationData = {
          type: 'document-status',
          eventType: 'document-approved', // Use specific event type for approvals
          documentName: document.name,
          documentType: document.documentType,
          status: 'Approved',
          previousStatus: previousStatus,
          loanId: document.loan ? document.loan._id : null,
          loanNumber: document.loan ? document.loan.loanNumber : null,
          borrowerId: borrowerId,
          reviewedBy: req.user._id,
          notes: notes || document.notes,
          timestamp: new Date().toISOString()
        };
        
        console.log(`Emitting document approval to ${borrowerId} and borrower-${borrowerId}:`, notificationData);
        
        // Send multiple event types to ensure frontend receives it
        io.to(borrowerId).emit('document-status', notificationData);
        io.to(borrowerId).emit('document-approved', notificationData);
        io.to(borrowerId).emit('document_approved', notificationData);
        io.to(borrowerId).emit('document_status_changed', notificationData);
        
        // Also send to borrower-specific room
        io.to(`borrower-${borrowerId}`).emit('document-status', notificationData);
        io.to(`borrower-${borrowerId}`).emit('document-approved', notificationData);
        io.to(`borrower-${borrowerId}`).emit('document_approved', notificationData);
        io.to(`borrower-${borrowerId}`).emit('document_status_changed', notificationData);
        
        logger.info(`Socket notification sent for document approval: ${document.name} to borrower ${borrowerId}`);
      }
    } catch (socketError) {
      logger.error(`Failed to send socket notification for document approval: ${socketError.message}`);
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Document approved successfully',
      data: document
    });
  } catch (error) {
    logger.error(`Error approving document: ${error.message}`);
    next(error);
  }
};

/**
 * Reject a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.rejectDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { loanId, notes, reason } = req.body;
    
    // Log the incoming request
    logger.info(`Document rejection request received for document ID: ${id} by user: ${req.user._id}`);
    
    // Validate required inputs
    if (!id) {
      return next(new ApiError('Document ID is required', 400));
    }
    
    // Find document
    const document = await Document.findById(id).populate('loan', 'loanNumber');
    if (!document) {
      return next(new ApiError('Document not found', 404));
    }
    
    // Check if loan exists if loanId is provided
    if (loanId) {
      const loan = await Loan.findById(loanId);
      if (!loan) {
        return next(new ApiError('Loan not found', 404));
      }
    }
    
    // Only lenders and admins can reject documents
    if (!['lender', 'admin'].includes(req.user.role)) {
      return next(new ApiError('You are not authorized to reject documents', 403));
    }
    
    // Get previous status for audit log
    const previousStatus = document.status;
    
    // Update document status
    document.status = 'Rejected';
    document.notes = notes || document.notes;
    document.rejectionReason = reason || 'Document rejected';
    document.reviewedBy = req.user._id;
    document.reviewedAt = Date.now();
    document.reviewDate = new Date();
    
    await document.save();

    // Update related loan condition when document is rejected
    if (document.loan) {
      try {
        const Loan = require('../models/loan.model');
        const loan = await Loan.findById(document.loan);

        if (loan && loan.conditions) {
          // Find the condition that matches this document
          const conditionIndex = loan.conditions.findIndex(condition =>
            condition.category === document.category &&
            condition.documentType === document.documentType &&
            condition.status === 'Pending'
          );

          if (conditionIndex !== -1) {
            // Keep the condition as Pending since document was rejected
            // The borrower will need to resubmit
            console.log(`📋 Loan condition remains pending for rejected document: ${document.documentType}`);
            logger.info(`Loan condition remains pending for rejected document ${id}: ${document.documentType}`);
          } else {
            console.log(`⚠️ No matching pending condition found for document: ${document.documentType}`);
          }
        }
      } catch (conditionError) {
        console.error('Error checking loan condition:', conditionError);
        logger.error(`Failed to check loan condition for rejected document ${id}: ${conditionError.message}`);
        // Don't fail the whole rejection process if condition check fails
      }
    }

    // Log the rejection
    logger.info(`Document ${id} rejected by ${req.user.role} ${req.user._id}`);
    
    // Create audit log entry for document status change
    try {
      const AuditLog = require('../models/auditLog.model');
      await AuditLog.create({
        eventType: 'document:status_changed',
        description: `Document status changed from "${previousStatus}" to "Rejected"`,
        userId: req.user._id,
        userRole: req.user.role,
        level: 'info',
        entityType: 'document',
        entityId: document._id,
        metadata: {
          documentName: document.name,
          previousStatus: previousStatus,
          newStatus: 'Rejected',
          loanId: document.loan ? document.loan._id : null,
          loanNumber: document.loan ? document.loan.loanNumber : null,
          reviewedBy: {
            id: req.user._id,
            role: req.user.role
          }
        }
      });
    } catch (auditError) {
      // Don't fail the operation if audit logging fails
      logger.error(`Failed to create audit log for document status change: ${auditError}`);
    }
    
    // Send socket notification to borrower for document rejection
    try {
      const io = req.app.get('io');
      if (io && document.borrower) {
        // Emit directly to the borrower's user ID and borrower-specific room
        const borrowerId = document.borrower.toString();
        const notificationData = {
          type: 'document-status',
          eventType: 'document-rejected', // Use specific event type for rejections
          documentName: document.name,
          documentType: document.documentType,
          status: 'Rejected',
          previousStatus: previousStatus,
          loanId: document.loan ? document.loan._id : null,
          loanNumber: document.loan ? document.loan.loanNumber : null,
          borrowerId: borrowerId,
          reviewedBy: req.user._id,
          notes: reason || notes || document.notes,
          timestamp: new Date().toISOString()
        };
        
        console.log(`Emitting document rejection to ${borrowerId} and borrower-${borrowerId}:`, notificationData);
        
        // Send multiple event types to ensure frontend receives it
        io.to(borrowerId).emit('document-status', notificationData);
        io.to(borrowerId).emit('document-rejected', notificationData);
        io.to(borrowerId).emit('document_rejected', notificationData);
        io.to(borrowerId).emit('document_status_changed', notificationData);
        
        // Also send to borrower-specific room
        io.to(`borrower-${borrowerId}`).emit('document-status', notificationData);
        io.to(`borrower-${borrowerId}`).emit('document-rejected', notificationData);
        io.to(`borrower-${borrowerId}`).emit('document_rejected', notificationData);
        io.to(`borrower-${borrowerId}`).emit('document_status_changed', notificationData);
        
        logger.info(`Socket notification sent for document rejection: ${document.name} to borrower ${borrowerId}`);
      }
    } catch (socketError) {
      logger.error(`Failed to send socket notification for document rejection: ${socketError.message}`);
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Document rejected successfully',
      data: document
    });
  } catch (error) {
    logger.error(`Error rejecting document: ${error.message}`);
    next(error);
  }
};

/**
 * Generate a signed URL for an S3 document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getSignedDocumentUrl = async (req, res, next) => {
  try {
    const { key } = req.body;
    
    // Validate required fields
    if (!key) {
      return next(new ApiError('Document key is required', 400));
    }
    
    // Check if S3 is enabled
    if (!USE_S3) {
      return next(new ApiError('S3 storage is not enabled', 400));
    }
    
    logger.info(`Generating URL for S3 document with key: ${key} by user: ${req.user._id}`);
    
    try {
      // Check if the key exists in S3 before generating a URL
      const headParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key
      };
      
      const s3Service = require('../services/s3.service');
      
      try {
        await s3Service.s3.headObject(headParams).promise();
        logger.info(`File exists in S3: ${key}`);
      } catch (headError) {
        logger.error(`File does not exist in S3: ${key}`, { error: headError });
        return next(new ApiError(`Document not found in storage: ${headError.message}`, 404));
      }
      
      // Get the file extension for logging
      const path = require('path');
      const fileExtension = path.extname(key).toLowerCase();
      logger.info(`File extension: ${fileExtension}`);
      
      // Generate direct URL for all documents (since we have a bucket policy allowing public read)
      const region = process.env.AWS_REGION || 'us-east-1';
      const bucket = process.env.AWS_S3_BUCKET;
      const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      
      logger.info(`Generated direct URL for ${key}: ${url}`);
      
      return res.status(200).json({
        status: 'success',
        signedUrl: url,
        expiresIn: null, // No expiration for direct URLs
        key,
        fileExtension
      });
    } catch (urlError) {
      logger.error(`Error generating URL for key ${key}: ${urlError.message}`, { error: urlError });
      return next(new ApiError(`Failed to generate URL: ${urlError.message}`, 500));
    }
  } catch (error) {
    logger.error(`Error generating URL: ${error.message}`, { error });
    return next(new ApiError(`Failed to generate URL: ${error.message}`, 500));
  }
};
