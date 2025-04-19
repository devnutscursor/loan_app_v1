const Document = require('../models/document.model');
const Loan = require('../models/loan.model');
const Borrower = require('../models/borrower.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Upload a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    // The file will be available in req.file after multer middleware processes it
    if (!req.file) {
      return next(new ApiError('No file uploaded', 400));
    }

    const { name, description, category, documentType, loanId, borrowerId } = req.body;

    // Validate required inputs
    if (!name || !category) {
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

        const isPrimaryBorrower = loan.primaryBorrower.toString() === borrower._id.toString();
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

        const isPrimaryBorrower = loan.primaryBorrower.toString() === borrower._id.toString();
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
          const isPrimaryBorrower = loan.primaryBorrower.toString() === borrower._id.toString();
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
          const isPrimaryBorrower = loan.primaryBorrower.toString() === borrower._id.toString();
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
          const isPrimaryBorrower = loan.primaryBorrower.toString() === borrower._id.toString();
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
