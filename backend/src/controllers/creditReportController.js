const { CreditReportService } = require('../services/creditReportService');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

const creditReportService = new CreditReportService();

/**
 * Create a new credit report for a loan
 * POST /api/credit-report/:loanId
 */
const createCreditReport = catchAsync(async (req, res) => {
    const { loanId } = req.params;
    const { providers } = req.body;
    const { _id: userId } = req.user;
    
    // Get lender ID from user (assuming user has lender reference)
    const lenderId = req.user.lender || req.user._id; // Adjust based on your user model structure
    
    logger.info(`Creating credit report for loan ${loanId} by user ${userId}`);
    
    try {
        const creditReport = await creditReportService.createCreditReport(
            loanId,
            lenderId,
            userId,
            providers
        );
        
        res.status(201).json({
            success: true,
            message: 'Credit report created successfully',
            data: {
                // Status data
                hasActiveReport: true,
                status: creditReport.status,
                createdAt: creditReport.createdAt,
                expiresAt: creditReport.metadata.expiresAt,
                isExpired: creditReport.isExpired,
                providers: creditReport.providers,
                avgCreditScore: creditReport.avgCreditScore,
                
                // Full report data
                id: creditReport._id,
                loanId: creditReport.loan,
                borrowerData: {
                    firstName: creditReport.borrowerData.firstName,
                    lastName: creditReport.borrowerData.lastName,
                    // Don't expose sensitive data like SSN in response
                },
                creditScores: creditReport.creditScores,
                reportFile: {
                    s3Url: creditReport.reportFile?.s3Url,
                    fileName: creditReport.reportFile?.fileName,
                    fileSize: creditReport.reportFile?.fileSize,
                    contentType: creditReport.reportFile?.contentType
                },
                accessCount: creditReport.accessCount,
                lastAccessed: creditReport.lastAccessed
            }
        });
    } catch (error) {
        logger.error(`Failed to create credit report for loan ${loanId}:`, error);
        
        if (error instanceof ApiError) {
            throw error;
        }
        
        throw new ApiError(`Failed to create credit report: ${error.message}`, 500);
    }
});

/**
 * Get existing credit report for a loan
 * GET /api/credit-report/:loanId
 */
const getCreditReport = catchAsync(async (req, res) => {
    const { loanId } = req.params;
    
    logger.info(`Getting credit report for loan ${loanId}`);
    
    try {
        const creditReport = await creditReportService.getCreditReport(loanId);
        
        res.status(200).json({
            success: true,
            message: 'Credit report retrieved successfully',
            data: {
                id: creditReport._id,
                loanId: creditReport.loan,
                status: creditReport.status,
                providers: creditReport.providers,
                borrowerData: {
                    firstName: creditReport.borrowerData.firstName,
                    lastName: creditReport.borrowerData.lastName,
                    // Don't expose sensitive data like SSN in response
                },
                creditScores: creditReport.creditScores,
                reportFile: {
                    s3Url: creditReport.reportFile.s3Url,
                    fileName: creditReport.reportFile.fileName,
                    fileSize: creditReport.reportFile.fileSize,
                    contentType: creditReport.reportFile.contentType
                },
                createdAt: creditReport.createdAt,
                expiresAt: creditReport.metadata.expiresAt,
                isExpired: creditReport.isExpired,
                accessCount: creditReport.accessCount,
                lastAccessed: creditReport.lastAccessed
            }
        });
    } catch (error) {
        logger.error(`Failed to get credit report for loan ${loanId}:`, error);
        
        if (error instanceof ApiError) {
            throw error;
        }
        
        throw new ApiError(`Failed to get credit report: ${error.message}`, 500);
    }
});

/**
 * Refresh an existing credit report
 * PUT /api/credit-report/:loanId/refresh
 */
const refreshCreditReport = catchAsync(async (req, res) => {
    const { loanId } = req.params;
    const { _id: userId } = req.user;
    
    // Get lender ID from user
    const lenderId = req.user.lender || req.user._id;
    
    logger.info(`Refreshing credit report for loan ${loanId} by user ${userId}`);
    
    try {
        const creditReport = await creditReportService.refreshCreditReport(
            loanId,
            lenderId,
            userId
        );
        
        res.status(200).json({
            success: true,
            message: 'Credit report refreshed successfully',
            data: {
                // Status data
                hasActiveReport: true,
                status: creditReport.status,
                createdAt: creditReport.createdAt,
                expiresAt: creditReport.metadata.expiresAt,
                isExpired: creditReport.isExpired,
                providers: creditReport.providers,
                avgCreditScore: creditReport.avgCreditScore,
                
                // Full report data
                id: creditReport._id,
                loanId: creditReport.loan,
                borrowerData: {
                    firstName: creditReport.borrowerData.firstName,
                    lastName: creditReport.borrowerData.lastName,
                    // Don't expose sensitive data like SSN in response
                },
                creditScores: creditReport.creditScores,
                reportFile: {
                    s3Url: creditReport.reportFile?.s3Url,
                    fileName: creditReport.reportFile?.fileName,
                    fileSize: creditReport.reportFile?.fileSize,
                    contentType: creditReport.reportFile?.contentType
                },
                accessCount: creditReport.accessCount,
                lastAccessed: creditReport.lastAccessed
            }
        });
    } catch (error) {
        logger.error(`Failed to refresh credit report for loan ${loanId}:`, error);
        
        if (error instanceof ApiError) {
            throw error;
        }
        
        throw new ApiError(`Failed to refresh credit report: ${error.message}`, 500);
    }
});

/**
 * Get all credit reports for a loan (including expired)
 * GET /api/credit-report/:loanId/history
 */
const getCreditReportHistory = catchAsync(async (req, res) => {
    const { loanId } = req.params;
    
    logger.info(`Getting credit report history for loan ${loanId}`);
    
    try {
        const reports = await creditReportService.getAllCreditReports(loanId);
        
        res.status(200).json({
            success: true,
            message: 'Credit report history retrieved successfully',
            data: reports.map(report => ({
                id: report._id,
                status: report.status,
                providers: report.providers,
                creditScores: report.creditScores,
                createdAt: report.createdAt,
                expiresAt: report.metadata.expiresAt,
                isExpired: report.isExpired,
                isActive: report.isActive
            }))
        });
    } catch (error) {
        logger.error(`Failed to get credit report history for loan ${loanId}:`, error);
        
        if (error instanceof ApiError) {
            throw error;
        }
        
        throw new ApiError(`Failed to get credit report history: ${error.message}`, 500);
    }
});

/**
 * Get signed URL for credit report file
 * GET /api/credit-report/:loanId/file
 */
const getCreditReportFile = catchAsync(async (req, res) => {
    const { loanId } = req.params;
    
    logger.info(`Getting credit report file for loan ${loanId}`);
    
    try {
        const creditReport = await creditReportService.getCreditReport(loanId);
        
        if (!creditReport.reportFile.s3Key) {
            throw new ApiError('Credit report file not found', 404);
        }
        
        // Generate signed URL for file access
        const { getSignedUrl } = require('../services/s3.service');
        const signedUrl = await getSignedUrl(creditReport.reportFile.s3Key, 3600); // 1 hour expiry
        
        res.status(200).json({
            success: true,
            message: 'Credit report file URL generated successfully',
            data: {
                fileUrl: signedUrl,
                fileName: creditReport.reportFile.fileName,
                contentType: creditReport.reportFile.contentType,
                expiresIn: 3600
            }
        });
    } catch (error) {
        logger.error(`Failed to get credit report file for loan ${loanId}:`, error);
        
        if (error instanceof ApiError) {
            throw error;
        }
        
        throw new ApiError(`Failed to get credit report file: ${error.message}`, 500);
    }
});

/**
 * Check if loan has an active credit report
 * GET /api/credit-report/:loanId/status
 */
const getCreditReportStatus = catchAsync(async (req, res) => {
    const { loanId } = req.params;
    
    logger.info(`Checking credit report status for loan ${loanId}`);
    
    try {
        const creditReport = await creditReportService.getCreditReport(loanId);
        
        res.status(200).json({
            success: true,
            message: 'Credit report status retrieved successfully',
            data: {
                hasActiveReport: true,
                status: creditReport.status,
                createdAt: creditReport.createdAt,
                expiresAt: creditReport.metadata.expiresAt,
                isExpired: creditReport.isExpired,
                providers: creditReport.providers,
                avgCreditScore: creditReport.avgCreditScore
            }
        });
    } catch (error) {
        // If no active report found, return status indicating no report
        if (error.statusCode === 404) {
            return res.status(200).json({
                success: true,
                message: 'No active credit report found',
                data: {
                    hasActiveReport: false,
                    status: null,
                    createdAt: null,
                    expiresAt: null,
                    isExpired: null,
                    providers: null,
                    avgCreditScore: null
                }
            });
        }
        
        logger.error(`Failed to check credit report status for loan ${loanId}:`, error);
        
        if (error instanceof ApiError) {
            throw error;
        }
        
        throw new ApiError(`Failed to check credit report status: ${error.message}`, 500);
    }
});


module.exports = {
    createCreditReport,
    getCreditReport,
    refreshCreditReport,
    getCreditReportHistory,
    getCreditReportFile,
    getCreditReportStatus
};
