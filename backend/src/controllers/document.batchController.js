const Borrower = require('../models/borrower.model');
const Document = require('../models/document.model');
const Loan = require('../models/loan.model');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const emailService = require('../utils/email/emailService');

/**
 * Request multiple documents in batch
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.batchRequestDocuments = async (req, res, next) => {
  try {
    const { borrowerId, loanId, documents } = req.body;
    
    // Validate required inputs
    if (!borrowerId || !loanId || !documents || !Array.isArray(documents) || documents.length === 0) {
      return next(new ApiError('Borrower ID, loan ID, and documents array are required', 400));
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
    
    // Process each document request
    const addedConditions = [];
    
    for (const doc of documents) {
      const { title, documentType, category, description, isUpdate } = doc;
      
      // If this is an update request, find and update existing document status
      if (isUpdate === true) {
        // Find the document by category and documentType
        const existingDocument = await Document.findOne({
          loan: loanId,
          documentType: documentType,
          category: category || { $exists: true },
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
      
      // Create a document request condition
      const newCondition = {
        title: `${title} Document Required`,
        description: description || `Please upload your ${title} document`,
        category: category,
        documentType: documentType,
        status: 'Pending',
        assignedTo: borrower.user,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
      };
      
      // Add to loan conditions array
      loan.conditions = loan.conditions || [];
      loan.conditions.push(newCondition);
      
      // Add to our list of conditions for the response
      addedConditions.push(newCondition);
    }
    
    // Save the loan with all new conditions
    await loan.save();
    
    // Get the borrower's user to send notification
    const borrowerUser = await User.findById(borrower.user);
    
    if (borrowerUser) {
      // Log the batch request
      logger.info(`Batch document request for ${documents.length} documents created for borrower ${borrowerId} by ${req.user.role} ${req.user._id}`);
      
      // Send an email notification to the borrower with all requested documents
      try {
        // Get borrower details from the loan
        const borrowerName = loan.borrowerDetails?.firstName 
          ? `${loan.borrowerDetails.firstName} ${loan.borrowerDetails.lastName}`
          : borrowerUser.name || 'Borrower';
        
        // Get borrower email from user account or loan details
        const borrowerEmail = borrowerUser.email || loan.borrowerDetails?.email;
        
        if (borrowerEmail) {
          // Prepare document information for email
          const documentInfoList = documents.map(doc => ({
            title: doc.title || doc.documentType,
            description: doc.description || `Please upload your ${doc.title || doc.documentType} document`,
            category: doc.category
          }));
          
          // Send the email notification with all documents
          await emailService.sendDocumentRequestNotification({
            email: borrowerEmail,
            borrowerName,
            loanNumber: loan.loanNumber,
            documents: documentInfoList
          });
          
          logger.info(`Batch email notification sent to borrower ${borrowerId} at ${borrowerEmail}`);
        } else {
          logger.warn(`Could not send batch email notification: No email found for borrower ${borrowerId}`);
        }
      } catch (emailError) {
        // Don't fail the overall request if email sending fails
        logger.error(`Failed to send batch email notification: ${emailError.message}`, { 
          error: emailError,
          borrowerId
        });
      }
    }
    
    res.status(201).json({
      status: 'success',
      message: `${documents.length} document requests created successfully`,
      data: {
        conditions: addedConditions,
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
