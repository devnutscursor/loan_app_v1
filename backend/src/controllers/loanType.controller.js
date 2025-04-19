const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Get all loan types
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllLoanTypes = async (req, res, next) => {
  try {
    // These would typically come from a database, but for now we'll use static data
    const loanTypes = [
      {
        id: 'personal',
        name: 'Personal Loan',
        description: 'General purpose unsecured loans for personal use',
        minAmount: 1000,
        maxAmount: 50000,
        minTerm: 12, // months
        maxTerm: 60, // months
        interestRateRange: {
          min: 5.99,
          max: 24.99
        },
        requirements: [
          'Proof of identity',
          'Proof of income',
          'Credit check'
        ],
        features: [
          'Fixed interest rate',
          'No collateral required',
          'Flexible use of funds'
        ]
      },
      {
        id: 'auto',
        name: 'Auto Loan',
        description: 'Secured loans for purchasing vehicles',
        minAmount: 5000,
        maxAmount: 100000,
        minTerm: 12, // months
        maxTerm: 84, // months
        interestRateRange: {
          min: 3.99,
          max: 18.99
        },
        requirements: [
          'Proof of identity',
          'Proof of income',
          'Vehicle information',
          'Credit check'
        ],
        features: [
          'Fixed interest rate',
          'Vehicle serves as collateral',
          'Potential for lower rates'
        ]
      },
      {
        id: 'mortgage',
        name: 'Mortgage Loan',
        description: 'Long-term secured loans for purchasing real estate',
        minAmount: 50000,
        maxAmount: 1000000,
        minTerm: 60, // months
        maxTerm: 360, // months (30 years)
        interestRateRange: {
          min: 2.99,
          max: 8.99
        },
        requirements: [
          'Proof of identity',
          'Proof of income',
          'Property appraisal',
          'Credit check',
          'Down payment'
        ],
        features: [
          'Fixed or variable interest rate',
          'Property serves as collateral',
          'Long repayment terms'
        ]
      },
      {
        id: 'business',
        name: 'Business Loan',
        description: 'Loans for business purposes, expansion, or operations',
        minAmount: 10000,
        maxAmount: 500000,
        minTerm: 12, // months
        maxTerm: 120, // months (10 years)
        interestRateRange: {
          min: 4.99,
          max: 29.99
        },
        requirements: [
          'Business registration documents',
          'Business financial statements',
          'Business plan',
          'Credit check',
          'Collateral (for secured loans)'
        ],
        features: [
          'Fixed or variable interest rate',
          'Options for secured or unsecured',
          'Flexible use of funds for business purposes'
        ]
      }
    ];
    
    res.status(200).json({
      status: 'success',
      data: loanTypes
    });
  } catch (error) {
    next(error);
  }
};
