const mongoose = require('mongoose');

const mortechInvestorSchema = new mongoose.Schema(
  {
    parentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const mortechProductSchema = new mongoose.Schema(
  {
    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MortechInvestor',
    },
    parentId: {
      type: String,
      required: true,
      index: true,
    },
    productId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    vendorProductCode: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

mortechProductSchema.index({ productId: 1, parentId: 1 });
mortechProductSchema.index({ name: 'text' });

const MortechInvestor = mongoose.model('MortechInvestor', mortechInvestorSchema);
const MortechProduct = mongoose.model('MortechProduct', mortechProductSchema);

module.exports = { MortechInvestor, MortechProduct };
