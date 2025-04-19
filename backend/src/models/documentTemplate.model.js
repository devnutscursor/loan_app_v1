const mongoose = require('mongoose');

/**
 * Document Template Schema
 * Used to store template documents that borrowers can download
 */
const documentTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    documentType: {
      type: String,
      required: [true, 'Document type is required'],
      enum: [
        'id_proof',
        'income_proof',
        'address_proof',
        'bank_statement',
        'tax_return',
        'employment_verification',
        'loan_document',
        'other'
      ]
    },
    fileName: {
      type: String,
      required: [true, 'File name is required']
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required']
    },
    fileSize: {
      type: Number
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
documentTemplateSchema.index({ documentType: 1, isActive: 1 });
documentTemplateSchema.index({ name: 'text', description: 'text' });

const DocumentTemplate = mongoose.model('DocumentTemplate', documentTemplateSchema);

module.exports = DocumentTemplate;
