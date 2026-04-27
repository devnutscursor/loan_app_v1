const mongoose = require('mongoose');

const ghlOpportunityMapSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
      index: true
    },
    ghlOpportunityId: {
      type: String,
      required: true,
      trim: true
    },
    ghlContactId: {
      type: String,
      trim: true
    },
    assignedToGhlUserId: {
      type: String,
      trim: true
    },
    pipelineId: {
      type: String,
      trim: true
    },
    pipelineStageId: {
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

ghlOpportunityMapSchema.index({ companyId: 1, loanId: 1 }, { unique: true });
// Not unique: some GHL locations enforce a single opportunity per contact,
// so multiple app loans may need to map to the same GHL opportunity.
ghlOpportunityMapSchema.index({ companyId: 1, ghlOpportunityId: 1 });

module.exports = mongoose.model('GhlOpportunityMap', ghlOpportunityMapSchema);

