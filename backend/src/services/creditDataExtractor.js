const logger = require('../utils/logger');

class CreditDataExtractor {
  /**
   * Extract debts from credit report XML
   */
  extractDebtsFromXML(xmlContent) {
    const debts = [];
    
    try {
      // Extract CREDIT_LIABILITIES section
      const liabilitiesPattern = /<CREDIT_LIABILITIES>([\s\S]*?)<\/CREDIT_LIABILITIES>/i;
      const liabilitiesMatch = xmlContent.match(liabilitiesPattern);
      
      if (!liabilitiesMatch) {
        logger.info('No CREDIT_LIABILITIES section found in XML');
        return debts;
      }
      
      const liabilitiesContent = liabilitiesMatch[1];
      
      // Extract individual CREDIT_LIABILITY blocks - handle self-closing tags with attributes
      const liabilityPattern = /<CREDIT_LIABILITY[^>]*>([\s\S]*?)<\/CREDIT_LIABILITY>/gi;
      let liabilityMatch;
      
      while ((liabilityMatch = liabilityPattern.exec(liabilitiesContent)) !== null) {
        const liabilityBlock = liabilityMatch[1];
        
        try {
          // Extract creditor name - handle nested structure
          const creditorNameMatch = liabilityBlock.match(/<CREDIT_LIABILITY_CREDITOR>[\s\S]*?<NAME>[\s\S]*?<FullName>([^<]+)<\/FullName>/i);
          const creditorName = creditorNameMatch ? creditorNameMatch[1].trim() : null;
          
          // Skip if no creditor name or if it's demo/test data
          if (!creditorName || creditorName === 'MCL DEMO' || creditorName.includes('TEST')) {
            continue;
          }
          
          // Extract account dates
          const openDateMatch = liabilityBlock.match(/<CreditLiabilityAccountOpenedDate>([^<]+)<\/CreditLiabilityAccountOpenedDate>/i);
          const closedDateMatch = liabilityBlock.match(/<CreditLiabilityAccountClosedDate>([^<]+)<\/CreditLiabilityAccountClosedDate>/i);
          
          // Extract liability type and status
          const liabilityTypeMatch = liabilityBlock.match(/<CreditLiabilityType>([^<]+)<\/CreditLiabilityType>/i);
          const statusMatch = liabilityBlock.match(/<CreditLiabilityStatusType>([^<]+)<\/CreditLiabilityStatusType>/i);
          
          // Extract monetary amounts
          const monthlyPaymentMatch = liabilityBlock.match(/<CreditLiabilityMonthlyPaymentAmount>([^<]+)<\/CreditLiabilityMonthlyPaymentAmount>/i);
          const highBalanceMatch = liabilityBlock.match(/<CreditLiabilityHighBalanceAmount>([^<]+)<\/CreditLiabilityHighBalanceAmount>/i);
          const unpaidBalanceMatch = liabilityBlock.match(/<CreditLiabilityUnpaidBalanceAmount>([^<]+)<\/CreditLiabilityUnpaidBalanceAmount>/i);
          const pastDueMatch = liabilityBlock.match(/<CreditLiabilityPastDueAmount>([^<]+)<\/CreditLiabilityPastDueAmount>/i);
          const creditLimitMatch = liabilityBlock.match(/<CreditLiabilityCreditLimitAmount>([^<]+)<\/CreditLiabilityCreditLimitAmount>/i);
          
          // Extract ratings
          const currentRatingMatch = liabilityBlock.match(/<CREDIT_LIABILITY_CURRENT_RATING>[\s\S]*?<CreditLiabilityCurrentRatingType>([^<]+)<\/CreditLiabilityCurrentRatingType>/i);
          const highestAdverseRatingMatch = liabilityBlock.match(/<CREDIT_LIABILITY_HIGHEST_ADVERSE_RATING>[\s\S]*?<CreditLiabilityHighestAdverseRatingType>([^<]+)<\/CreditLiabilityHighestAdverseRatingType>/i);
          
          // Extract comments
          const commentsMatch = liabilityBlock.match(/<CREDIT_COMMENTS>[\s\S]*?<CreditCommentType>([^<]+)<\/CreditCommentType>/i);
          
          // Helper function to parse monetary amounts
          const parseAmount = (amountStr) => {
            if (!amountStr) return 0;
            // Remove currency symbols, commas, and parse
            const cleaned = amountStr.replace(/[$,]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
          };
          
          // Helper function to parse dates
          const parseDate = (dateStr) => {
            if (!dateStr) return null;
            try {
              return new Date(dateStr);
            } catch (error) {
              return null;
            }
          };
          
          // Create debt object
          const debt = {
            id: `credit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            creditor: creditorName,
            monthlyPayment: parseAmount(monthlyPaymentMatch ? monthlyPaymentMatch[1] : null),
            balance: parseAmount(unpaidBalanceMatch ? unpaidBalanceMatch[1] : null),
            paidAtClosing: false,
            // Additional fields from XML
            accountOpenDate: parseDate(openDateMatch ? openDateMatch[1] : null),
            accountClosedDate: parseDate(closedDateMatch ? closedDateMatch[1] : null),
            liabilityType: liabilityTypeMatch ? liabilityTypeMatch[1].trim() : null,
            status: statusMatch ? statusMatch[1].trim() : null,
            highBalance: parseAmount(highBalanceMatch ? highBalanceMatch[1] : null),
            pastDueAmount: parseAmount(pastDueMatch ? pastDueMatch[1] : null),
            creditLimit: parseAmount(creditLimitMatch ? creditLimitMatch[1] : null),
            currentRating: currentRatingMatch ? currentRatingMatch[1].trim() : null,
            highestAdverseRating: highestAdverseRatingMatch ? highestAdverseRatingMatch[1].trim() : null,
            comments: commentsMatch ? commentsMatch[1].trim() : null
          };
          
          // Only add if there's actual debt (unpaid balance > 0 or monthly payment > 0)
          if (debt.balance > 0 || debt.monthlyPayment > 0) {
            debts.push(debt);
          }
          
        } catch (liabilityError) {
          logger.warn('Error processing individual liability:', liabilityError);
          continue;
        }
      }
      
      logger.info(`Extracted ${debts.length} debts from CREDIT_LIABILITIES section`);
      return debts;
      
    } catch (error) {
      logger.error('Error extracting debts from XML:', error);
      return [];
    }
  }

  /**
   * Extract assets from credit report XML
   */
  extractAssetsFromXML(xmlContent) {
    const assets = {
      checkingAndSavings: [],
      stocksAndBonds: [],
      lifeInsurance: [],
      retirementFunds: [],
      otherAssets: []
    };
    
    try {
      // Look for asset-related information in the XML
      // This is a simplified extraction - you might need to adjust based on your XML structure
      
      // Extract any account balances that could be assets
      const accountPattern = /<tr[^>]*class="[^"]*mcl-report-body[^"]*"[^>]*>[\s\S]*?<\/tr>/g;
      let accountMatch;
      let totalAssets = 0;

      while ((accountMatch = accountPattern.exec(xmlContent)) !== null) {
        const accountRow = accountMatch[0];
        
        // Look for positive balances that could be assets
        const balanceMatches = accountRow.match(/\$([0-9,]+)/g);
        
        if (balanceMatches) {
          balanceMatches.forEach(match => {
            const amount = parseInt(match.replace(/[$,]/g, ''));
            if (amount > 0 && amount < 1000000) { // Reasonable asset range
              totalAssets += amount;
            }
          });
        }
      }
      
      // If we found assets, add them to checking/savings as a general category
      if (totalAssets > 0) {
        assets.checkingAndSavings.push({
          accountType: 'Checking/Savings',
          accountNumber: 'Credit Report Assets',
          institutionName: 'Various Institutions',
          currentBalance: totalAssets,
          accountHolder: 'Primary Borrower'
        });
      }
      
      logger.info(`Extracted assets totaling $${totalAssets} from credit report`);
      return assets;
      
    } catch (error) {
      logger.error('Error extracting assets from XML:', error);
      return assets;
    }
  }

  /**
   * Extract employment information for income verification
   */
  extractEmploymentFromXML(xmlContent) {
    const employment = [];
    
    try {
      // Extract employment information
      const employmentPattern = /EMPLOYER:\s*([^\/\n]+)\/([^\/\n]*)\/([^\/\n]*)/g;
      let employmentMatch;

      while ((employmentMatch = employmentPattern.exec(xmlContent)) !== null) {
        const employer = employmentMatch[1].trim();
        const jobTitle = employmentMatch[2].trim();
        const additionalInfo = employmentMatch[3].trim();

        if (employer && employer !== 'MCL DEMO' && employer !== 'TEST') {
          employment.push({
            employer: employer,
            jobTitle: jobTitle || 'Unknown',
            isCurrent: additionalInfo.includes('Current') || additionalInfo.includes('Present'),
            startDate: new Date(), // You might want to extract actual dates
            endDate: null
          });
        }
      }
      
      logger.info(`Extracted ${employment.length} employment records from credit report`);
      console.log(`Extracted employment records from credit report: `, employment);
      return employment;
      
    } catch (error) {
      logger.error('Error extracting employment from XML:', error);
      return [];
    }
  }
}

module.exports = CreditDataExtractor;
