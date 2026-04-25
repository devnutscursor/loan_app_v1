const mongoose = require('mongoose');

const ghlContactMapSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },
    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Borrower',
      required: true,
      index: true
    },
    borrowerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    ghlContactId: {
      type: String,
      required: true,
      trim: true
    },
    emailNorm: {
      type: String,
      trim: true,
      lowercase: true
    },
    phoneNorm: {
      type: String,
      trim: true
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

ghlContactMapSchema.index({ companyId: 1, borrowerId: 1 }, { unique: true });
ghlContactMapSchema.index({ companyId: 1, borrowerUserId: 1 }, { unique: true });
// Not unique: the same real-world person can exist as multiple Borrower records in our app
// (e.g. they apply to multiple loan officers) but must still point to the single GHL contact.
ghlContactMapSchema.index({ companyId: 1, ghlContactId: 1 });

module.exports = mongoose.model('GhlContactMap', ghlContactMapSchema);

