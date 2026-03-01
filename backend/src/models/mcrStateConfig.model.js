const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * MCRStateConfig - Per-State MCR Settings
 * 
 * Stores per-state configuration for MCR reporting.
 * Each state where the company is licensed can have:
 * - Active/inactive toggle for MCR reporting
 * - State-specific NMLS license number
 * - Supplemental state form data (SF010–SF1100)
 * 
 * Per the ARIVE screenshots, each state has a gear icon for configuration.
 */
const MCRStateConfigSchema = new Schema({
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  stateCode: {
    type: String,       // 'CA', 'TX', 'FL', etc.
    required: true,
    uppercase: true,
    minlength: 2,
    maxlength: 2
  },

  // --- State-Specific Settings ---
  isActive: {
    type: Boolean,      // Whether this state is active for MCR reporting
    default: true
  },
  nmlsLicenseNumber: {
    type: String,       // State-specific NMLS license #
    default: null
  },

  // Supplemental State-Specific Form fields (SF010–SF1100)
  requiresSupplementalForm: {
    type: Boolean,
    default: false
  },
  supplementalFormData: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

MCRStateConfigSchema.index({ company: 1, stateCode: 1 }, { unique: true });

module.exports = mongoose.model('MCRStateConfig', MCRStateConfigSchema);
