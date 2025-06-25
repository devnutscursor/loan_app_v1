const Loan = require("../models/loan.model");
const ApiError = require("../utils/apiError");
const logger = require("../utils/logger");

/**
 * Toggle editing permission for a loan application
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.toggleEditingPermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { editingEnabled } = req.body;

    // Find the loan
    const loan = await Loan.findById(id);
    
    if (!loan) {
      return next(new ApiError("Loan not found", 404));
    }

    // Update editing permission
    loan.editingEnabled = Boolean(editingEnabled);
    await loan.save();

    // Log the permission change
    logger.info(
      `Editing permission for loan ${loan.loanNumber} ${loan.editingEnabled ? 'enabled' : 'disabled'} by ${req.user.role} ${req.user._id}`
    );

    res.status(200).json({
      status: "success",
      message: `Loan editing ${loan.editingEnabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        editingEnabled: loan.editingEnabled
      },
    });
  } catch (error) {
    next(error);
  }
};
