const Document = require('../models/document.model');
const Loan = require('../models/loan.model');
const Borrower = require('../models/borrower.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const User = require('../models/user.model');
const { title } = require('process');

/**
 * Upload a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    // Log request details for debugging
    console.log('Upload document request received:');
    console.log('- User:', req.user ? req.user._id : 'Not authenticated');
    console.log('- Body keys:', Object.keys(req.body));
    console.log('- File present:', !!req.file);
    
    // The file will be available in req.file after multer middleware processes it
    if (!req.file) {
      console.log('Error: No file in request');
      return next(new ApiError('No file uploaded', 400));
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename
    });

    const { name, description, category, documentType, loanId, borrowerId } = req.body;

    // Validate required inputs
    if (!name || !category) {
      console.log('Error: Missing required fields:', { name, category });
      return next(new ApiError('Document name and category are required', 400));
    }

    // Check if loan exists if loanId is provided
    if (loanId) {
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
          return next(new ApiError('You are not authorized to upload documents to this loan', 403));
        }
      }
    }

    // Check if borrower exists if borrowerId is provided
    if (borrowerId) {
      const borrower = await Borrower.findById(borrowerId);
      if (!borrower) {
        return next(new ApiError('Borrower not found', 404));
      }

      // Check permissions for borrowers
      if (req.user.role === 'borrower') {
        const userBorrower = await Borrower.findOne({ user: req.user._id });
        
        if (borrowerId !== userBorrower._id.toString()) {
          return next(new ApiError('You are not authorized to upload documents for this borrower', 403));
        }
      }
    }

    // Create document record
    const document = await Document.create({
      name,
      description,
      fileUrl: req.file.filename,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      loan: loanId,
      borrower: borrowerId,
      category,
      documentType: documentType || 'Other',
      status: 'Pending Review'
    });

    // Log the upload
    logger.info(`Document uploaded: ${document.name} for ${loanId ? `loan ${loanId}` : `borrower ${borrowerId}`}`);

    res.status(201).json({
      status: 'success',
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    console.error('Document upload error:', error);
    logger.error(`Document upload failed: ${error.message}`);
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
    const filePath = path.join(process.cwd(), 'uploads', document.fileUrl);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
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
    
    // Get file path
    const filePath = path.join(process.cwd(), 'uploads', document.fileUrl);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return next(new ApiError('File not found on server', 404));
    }
    
    // Log the download
    logger.info(`Document ${id} downloaded by ${req.user.role} ${req.user._id}`);
    
    // Send file
    res.download(filePath, document.originalFilename);
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
    const validStatuses = ['Approved', 'Rejected', 'Pending Review', 'Needs Additional Information'];
    if (!validStatuses.includes(status)) {
      return next(new ApiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
    }
    
    // Find document
    const document = await Document.findById(id);
    if (!document) {
      return next(new ApiError('Document not found', 404));
    }
    
    // Only lenders and admins can verify documents
    if (!['lender', 'admin'].includes(req.user.role)) {
      return next(new ApiError('You are not authorized to verify documents', 403));
    }
    
    // Update document status and notes
    document.status = status;
    document.notes = notes || document.notes;
    document.reviewedBy = req.user._id;
    document.reviewedAt = Date.now();
    
    await document.save();
    
    // Log the verification
    logger.info(`Document ${id} verified with status ${status} by ${req.user.role} ${req.user._id}`);
    
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
      
      // In a real system, you would send an email or notification here
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
    const document = await Document.findById(id);
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
    // Update document status
    document.status = 'Approved';
    document.notes = notes || document.notes;
    document.reviewedBy = req.user._id;
    document.reviewedAt = Date.now();
    
    await document.save();
    
    // Log the approval
    logger.info(`Document ${id} approved by ${req.user.role} ${req.user._id}`);
    
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
    const document = await Document.findById(id);
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
    
    // Update document status
    document.status = 'Rejected';
    document.notes = notes || document.notes;
    document.rejectionReason = reason || 'Document rejected';
    document.reviewedBy = req.user._id;
    document.reviewedAt = Date.now();
    
    await document.save();
    
    // Log the rejection
    logger.info(`Document ${id} rejected by ${req.user.role} ${req.user._id}`);
    
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
