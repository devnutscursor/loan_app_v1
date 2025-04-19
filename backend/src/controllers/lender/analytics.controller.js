const Loan = require('../../models/loan.model');
const User = require('../../models/user.model');
const Milestone = require('../../models/milestone.model');
const Document = require('../../models/document.model');
const AuditLog = require('../../models/auditLog.model');
const APIError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');
const { createAuditLog } = require('../auditLog.controller');
const mongoose = require('mongoose');
const { Parser } = require('json2csv');

/**
 * Helper to get date range based on timeframe
 */
const getDateRange = (timeframe) => {
  const now = new Date();
  let startDate = new Date();
  
  switch (timeframe) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1); // Default to month
  }
  
  return {
    startDate,
    endDate: now
  };
};

/**
 * Get summary analytics metrics
 */
exports.getSummaryMetrics = catchAsync(async (req, res) => {
  const { timeframe = 'month' } = req.query;
  const lenderId = req.user.id;
  
  // Only lenders and admins can access analytics
  if (!['lender', 'admin'].includes(req.user.role)) {
    throw new APIError('You do not have permission to access analytics', 403);
  }
  
  // Get date range for queries
  const { startDate, endDate } = getDateRange(timeframe);
  
  // For previous period comparison
  const previousStartDate = new Date(startDate);
  const previousEndDate = new Date(endDate);
  const timeDiff = endDate - startDate;
  previousStartDate.setTime(previousStartDate.getTime() - timeDiff);
  previousEndDate.setTime(previousEndDate.getTime() - timeDiff);
  
  // Query filters for current lender (if not admin)
  const lenderFilter = req.user.role === 'admin' ? {} : { lender: mongoose.Types.ObjectId(lenderId) };
  
  // Get application metrics
  const currentApplications = await Loan.countDocuments({
    ...lenderFilter,
    createdAt: { $gte: startDate, $lte: endDate }
  });
  
  const previousApplications = await Loan.countDocuments({
    ...lenderFilter,
    createdAt: { $gte: previousStartDate, $lte: previousEndDate }
  });
  
  // Calculate application change percentage
  const applicationChange = previousApplications === 0 
    ? 100 // If no previous applications, show as 100% increase
    : Math.round(((currentApplications - previousApplications) / previousApplications) * 100);
  
  // Get active loans metrics
  const currentLoans = await Loan.find({
    ...lenderFilter,
    status: { $nin: ['closed', 'rejected', 'withdrawn'] }
  });
  
  const previousLoansCount = await Loan.countDocuments({
    ...lenderFilter,
    status: { $nin: ['closed', 'rejected', 'withdrawn'] },
    createdAt: { $lt: startDate }
  });
  
  // Calculate loan volume
  const loanVolume = currentLoans.reduce((total, loan) => total + (loan.loanAmount || 0), 0);
  
  // Calculate loan change percentage
  const loanChange = previousLoansCount === 0
    ? 100
    : Math.round(((currentLoans.length - previousLoansCount) / previousLoansCount) * 100);
  
  // Get conversion rate metrics
  const approvedLoans = await Loan.countDocuments({
    ...lenderFilter,
    status: 'approved',
    updatedAt: { $gte: startDate, $lte: endDate }
  });
  
  const conversionRate = currentApplications === 0
    ? 0
    : Math.round((approvedLoans / currentApplications) * 100);
  
  // Get previous conversion rate for comparison
  const previousApprovedLoans = await Loan.countDocuments({
    ...lenderFilter,
    status: 'approved',
    updatedAt: { $gte: previousStartDate, $lte: previousEndDate }
  });
  
  const previousConversionRate = previousApplications === 0
    ? 0
    : Math.round((previousApprovedLoans / previousApplications) * 100);
  
  const conversionChange = previousConversionRate === 0
    ? conversionRate > 0 ? 100 : 0
    : Math.round(((conversionRate - previousConversionRate) / previousConversionRate) * 100);
  
  // Estimate revenue metrics based on approved loans
  // This is a simplified calculation - you may want to replace with actual revenue data
  const avgFeePercentage = 0.015; // 1.5% average fee
  const currentRevenue = approvedLoans > 0
    ? await Loan.aggregate([
        { 
          $match: { 
            ...lenderFilter,
            status: 'approved',
            updatedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$loanAmount' }
          }
        }
      ]).then(result => (result[0]?.totalAmount || 0) * avgFeePercentage)
    : 0;
  
  const previousRevenue = previousApprovedLoans > 0
    ? await Loan.aggregate([
        { 
          $match: { 
            ...lenderFilter,
            status: 'approved',
            updatedAt: { $gte: previousStartDate, $lte: previousEndDate }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$loanAmount' }
          }
        }
      ]).then(result => (result[0]?.totalAmount || 0) * avgFeePercentage)
    : 0;
  
  const revenueChange = previousRevenue === 0
    ? currentRevenue > 0 ? 100 : 0
    : Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100);
  
  // Build response data
  const summaryData = {
    applications: {
      total: currentApplications,
      change: applicationChange
    },
    loans: {
      total: currentLoans.length,
      volume: loanVolume,
      change: loanChange
    },
    conversion: {
      rate: conversionRate,
      change: conversionChange
    },
    revenue: {
      total: Math.round(currentRevenue),
      change: revenueChange
    }
  };
  
  // Log analytics view for audit
  await createAuditLog({
    eventType: 'analytics:view',
    description: `Viewed summary analytics for ${timeframe}`,
    userId: req.user.id,
    userRole: req.user.role,
    level: 'info',
    metadata: { timeframe }
  });
  
  res.status(200).json({
    status: 'success',
    data: summaryData
  });
});

/**
 * Get loan pipeline data
 */
exports.getPipelineData = catchAsync(async (req, res) => {
  const { timeframe = 'month' } = req.query;
  const lenderId = req.user.id;
  
  // Only lenders and admins can access analytics
  if (!['lender', 'admin'].includes(req.user.role)) {
    throw new APIError('You do not have permission to access analytics', 403);
  }
  
  // Query filters for current lender (if not admin)
  const lenderFilter = req.user.role === 'admin' ? {} : { lender: mongoose.Types.ObjectId(lenderId) };
  
  // Define pipeline stages
  const pipelineStages = [
    'Initial Application',
    'Document Review',
    'Underwriting',
    'Approval',
    'Closing'
  ];
  
  // Map loan status to pipeline stage
  const getStageFromLoan = (loan) => {
    if (loan.status === 'approved') return 'Approval';
    if (loan.status === 'closing') return 'Closing';
    
    // For other loans, use milestone data if available
    // This is a simplified approach - real implementation would use milestone data
    const completedMilestones = loan.completedMilestones || 0;
    
    if (completedMilestones === 0) return 'Initial Application';
    if (completedMilestones === 1) return 'Document Review';
    return 'Underwriting';
  };
  
  // Get loans
  const loans = await Loan.find({
    ...lenderFilter,
    status: { $nin: ['closed', 'rejected', 'withdrawn'] }
  });
  
  // Process loans into pipeline data
  const pipelineData = pipelineStages.map(stage => {
    const loansInStage = loans.filter(loan => getStageFromLoan(loan) === stage);
    const totalAmount = loansInStage.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
    
    return {
      stage,
      count: loansInStage.length,
      amount: totalAmount
    };
  });
  
  // Log analytics view for audit
  await createAuditLog({
    eventType: 'analytics:pipeline_view',
    description: `Viewed pipeline analytics for ${timeframe}`,
    userId: req.user.id,
    userRole: req.user.role,
    level: 'info',
    metadata: { timeframe }
  });
  
  res.status(200).json({
    status: 'success',
    data: pipelineData
  });
});

/**
 * Get loan distribution data
 */
exports.getDistributionData = catchAsync(async (req, res) => {
  const { timeframe = 'month' } = req.query;
  const lenderId = req.user.id;
  
  // Only lenders and admins can access analytics
  if (!['lender', 'admin'].includes(req.user.role)) {
    throw new APIError('You do not have permission to access analytics', 403);
  }
  
  // Query filters for current lender (if not admin)
  const lenderFilter = req.user.role === 'admin' ? {} : { lender: mongoose.Types.ObjectId(lenderId) };
  
  // Get all active loans
  const loans = await Loan.find({
    ...lenderFilter,
    status: { $nin: ['closed', 'rejected', 'withdrawn'] }
  });
  
  // Group loans by type
  const loansByType = {};
  loans.forEach(loan => {
    const type = loan.loanType || 'Other';
    if (!loansByType[type]) {
      loansByType[type] = {
        count: 0,
        totalAmount: 0
      };
    }
    
    loansByType[type].count++;
    loansByType[type].totalAmount += loan.loanAmount || 0;
  });
  
  // Calculate percentages
  const totalCount = loans.length;
  const distributionData = Object.keys(loansByType).map(type => {
    const percentage = totalCount === 0 ? 0 : Math.round((loansByType[type].count / totalCount) * 100);
    
    return {
      type,
      percentage,
      count: loansByType[type].count,
      amount: loansByType[type].totalAmount
    };
  }).sort((a, b) => b.percentage - a.percentage);
  
  // Log analytics view for audit
  await createAuditLog({
    eventType: 'analytics:distribution_view',
    description: `Viewed loan distribution analytics for ${timeframe}`,
    userId: req.user.id,
    userRole: req.user.role,
    level: 'info',
    metadata: { timeframe }
  });
  
  res.status(200).json({
    status: 'success',
    data: distributionData
  });
});

/**
 * Get performance trend data
 */
exports.getPerformanceTrends = catchAsync(async (req, res) => {
  const { timeframe = 'month' } = req.query;
  const lenderId = req.user.id;
  
  // Only lenders and admins can access analytics
  if (!['lender', 'admin'].includes(req.user.role)) {
    throw new APIError('You do not have permission to access analytics', 403);
  }
  
  // Get date range for queries
  const { startDate, endDate } = getDateRange(timeframe);
  
  // Query filters for current lender (if not admin)
  const lenderFilter = req.user.role === 'admin' ? {} : { lender: mongoose.Types.ObjectId(lenderId) };
  
  // Generate date intervals based on timeframe
  const getIntervals = () => {
    const intervals = [];
    const labels = [];
    
    switch (timeframe) {
      case 'day':
        // 24 hour intervals
        for (let i = 0; i < 24; i++) {
          const intervalStart = new Date(endDate);
          intervalStart.setHours(endDate.getHours() - 24 + i);
          
          const intervalEnd = new Date(intervalStart);
          intervalEnd.setHours(intervalStart.getHours() + 1);
          
          intervals.push({ start: intervalStart, end: intervalEnd });
          labels.push(intervalStart.toLocaleTimeString([], { hour: '2-digit' }));
        }
        break;
      
      case 'week':
        // 7 day intervals
        for (let i = 0; i < 7; i++) {
          const intervalStart = new Date(endDate);
          intervalStart.setDate(endDate.getDate() - 7 + i);
          intervalStart.setHours(0, 0, 0, 0);
          
          const intervalEnd = new Date(intervalStart);
          intervalEnd.setDate(intervalStart.getDate() + 1);
          
          intervals.push({ start: intervalStart, end: intervalEnd });
          labels.push(intervalStart.toLocaleDateString([], { weekday: 'short' }));
        }
        break;
      
      case 'month':
        // 4 week intervals
        for (let i = 0; i < 4; i++) {
          const intervalStart = new Date(endDate);
          intervalStart.setDate(endDate.getDate() - 28 + (i * 7));
          intervalStart.setHours(0, 0, 0, 0);
          
          const intervalEnd = new Date(intervalStart);
          intervalEnd.setDate(intervalStart.getDate() + 7);
          
          intervals.push({ start: intervalStart, end: intervalEnd });
          labels.push(`Week ${i + 1}`);
        }
        break;
      
      case 'quarter':
        // 3 month intervals
        for (let i = 0; i < 3; i++) {
          const intervalStart = new Date(endDate);
          intervalStart.setMonth(endDate.getMonth() - 3 + i);
          intervalStart.setDate(1);
          intervalStart.setHours(0, 0, 0, 0);
          
          const intervalEnd = new Date(intervalStart);
          intervalEnd.setMonth(intervalStart.getMonth() + 1);
          
          intervals.push({ start: intervalStart, end: intervalEnd });
          labels.push(intervalStart.toLocaleDateString([], { month: 'short' }));
        }
        break;
      
      case 'year':
        // 12 month intervals
        for (let i = 0; i < 12; i++) {
          const intervalStart = new Date(endDate);
          intervalStart.setMonth(endDate.getMonth() - 12 + i);
          intervalStart.setDate(1);
          intervalStart.setHours(0, 0, 0, 0);
          
          const intervalEnd = new Date(intervalStart);
          intervalEnd.setMonth(intervalStart.getMonth() + 1);
          
          intervals.push({ start: intervalStart, end: intervalEnd });
          labels.push(intervalStart.toLocaleDateString([], { month: 'short' }));
        }
        break;
      
      default:
        // Default to month (4 weeks)
        for (let i = 0; i < 4; i++) {
          const intervalStart = new Date(endDate);
          intervalStart.setDate(endDate.getDate() - 28 + (i * 7));
          intervalStart.setHours(0, 0, 0, 0);
          
          const intervalEnd = new Date(intervalStart);
          intervalEnd.setDate(intervalStart.getDate() + 7);
          
          intervals.push({ start: intervalStart, end: intervalEnd });
          labels.push(`Week ${i + 1}`);
        }
    }
    
    return { intervals, labels };
  };
  
  const { intervals, labels } = getIntervals();
  
  // Get metrics for each interval
  const applications = [];
  const approvals = [];
  const volumes = [];
  
  for (const interval of intervals) {
    // Get applications count for interval
    const applicationCount = await Loan.countDocuments({
      ...lenderFilter,
      createdAt: { $gte: interval.start, $lt: interval.end }
    });
    applications.push(applicationCount);
    
    // Get approvals count for interval
    const approvalCount = await Loan.countDocuments({
      ...lenderFilter,
      status: 'approved',
      updatedAt: { $gte: interval.start, $lt: interval.end }
    });
    approvals.push(approvalCount);
    
    // Get loan volume for interval (convert to millions for display)
    const loanVolume = await Loan.aggregate([
      { 
        $match: { 
          ...lenderFilter,
          status: 'approved',
          updatedAt: { $gte: interval.start, $lt: interval.end }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$loanAmount' }
        }
      }
    ]).then(result => {
      const amount = result[0]?.totalAmount || 0;
      return parseFloat((amount / 1000000).toFixed(1)); // Convert to millions
    });
    volumes.push(loanVolume);
  }
  
  // Prepare response data
  const performanceData = {
    labels,
    applications,
    approvals,
    volumes
  };
  
  // Log analytics view for audit
  await createAuditLog({
    eventType: 'analytics:performance_view',
    description: `Viewed performance trend analytics for ${timeframe}`,
    userId: req.user.id,
    userRole: req.user.role,
    level: 'info',
    metadata: { timeframe }
  });
  
  res.status(200).json({
    status: 'success',
    data: performanceData
  });
});

/**
 * Export report data as CSV
 */
exports.exportReport = catchAsync(async (req, res) => {
  const { timeframe = 'month', type = 'all' } = req.query;
  const lenderId = req.user.id;
  
  // Only lenders and admins can access analytics
  if (!['lender', 'admin'].includes(req.user.role)) {
    throw new APIError('You do not have permission to export reports', 403);
  }
  
  let data = [];
  let fields = [];
  let fileName = `${type}_report_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`;
  
  // Get report data based on type
  switch (type) {
    case 'summary': {
      // Get summary data
      const summaryResponse = await this.getSummaryMetrics(req, { 
        status: () => ({ json: (data) => data })
      });
      
      const summaryData = summaryResponse.data;
      
      data = [
        {
          metric: 'Applications',
          value: summaryData.applications.total,
          change: `${summaryData.applications.change}%`
        },
        {
          metric: 'Active Loans',
          value: summaryData.loans.total,
          change: `${summaryData.loans.change}%`
        },
        {
          metric: 'Loan Volume',
          value: `$${summaryData.loans.volume.toLocaleString()}`,
          change: `${summaryData.loans.change}%`
        },
        {
          metric: 'Conversion Rate',
          value: `${summaryData.conversion.rate}%`,
          change: `${summaryData.conversion.change}%`
        },
        {
          metric: 'Revenue',
          value: `$${summaryData.revenue.total.toLocaleString()}`,
          change: `${summaryData.revenue.change}%`
        }
      ];
      
      fields = ['metric', 'value', 'change'];
      break;
    }
    
    case 'pipeline': {
      // Get pipeline data
      const pipelineResponse = await this.getPipelineData(req, { 
        status: () => ({ json: (data) => data })
      });
      
      data = pipelineResponse.data.map(item => ({
        stage: item.stage,
        applications: item.count,
        amount: `$${item.amount.toLocaleString()}`
      }));
      
      fields = ['stage', 'applications', 'amount'];
      break;
    }
    
    case 'distribution': {
      // Get distribution data
      const distributionResponse = await this.getDistributionData(req, { 
        status: () => ({ json: (data) => data })
      });
      
      data = distributionResponse.data.map(item => ({
        loanType: item.type,
        percentage: `${item.percentage}%`,
        count: item.count,
        amount: `$${item.amount.toLocaleString()}`
      }));
      
      fields = ['loanType', 'percentage', 'count', 'amount'];
      break;
    }
    
    case 'performance': {
      // Get performance data
      const performanceResponse = await this.getPerformanceTrends(req, { 
        status: () => ({ json: (data) => data })
      });
      
      const perfData = performanceResponse.data;
      
      // Transform array data into proper CSV rows
      data = perfData.labels.map((label, index) => ({
        timePeriod: label,
        applications: perfData.applications[index],
        approvals: perfData.approvals[index],
        volume: `$${(perfData.volumes[index] * 1000000).toLocaleString()}`
      }));
      
      fields = ['timePeriod', 'applications', 'approvals', 'volume'];
      break;
    }
    
    default: {
      // Get all reports
      const summaryResponse = await this.getSummaryMetrics(req, { 
        status: () => ({ json: (data) => data })
      });
      
      const pipelineResponse = await this.getPipelineData(req, { 
        status: () => ({ json: (data) => data })
      });
      
      const distributionResponse = await this.getDistributionData(req, { 
        status: () => ({ json: (data) => data })
      });
      
      const performanceResponse = await this.getPerformanceTrends(req, { 
        status: () => ({ json: (data) => data })
      });
      
      // Create multiple CSV sections
      const summaryData = [
        ['SUMMARY METRICS'],
        ['Metric', 'Value', 'Change'],
        ['Applications', summaryResponse.data.applications.total, `${summaryResponse.data.applications.change}%`],
        ['Active Loans', summaryResponse.data.loans.total, `${summaryResponse.data.loans.change}%`],
        ['Loan Volume', `$${summaryResponse.data.loans.volume.toLocaleString()}`, `${summaryResponse.data.loans.change}%`],
        ['Conversion Rate', `${summaryResponse.data.conversion.rate}%`, `${summaryResponse.data.conversion.change}%`],
        ['Revenue', `$${summaryResponse.data.revenue.total.toLocaleString()}`, `${summaryResponse.data.revenue.change}%`],
        ['']
      ];
      
      const pipelineRows = [
        ['PIPELINE DATA'],
        ['Stage', 'Applications', 'Amount']
      ];
      
      pipelineResponse.data.forEach(item => {
        pipelineRows.push([
          item.stage,
          item.count,
          `$${item.amount.toLocaleString()}`
        ]);
      });
      
      pipelineRows.push(['']);
      
      const distributionRows = [
        ['LOAN DISTRIBUTION'],
        ['Loan Type', 'Percentage', 'Count', 'Amount']
      ];
      
      distributionResponse.data.forEach(item => {
        distributionRows.push([
          item.type,
          `${item.percentage}%`,
          item.count,
          `$${item.amount.toLocaleString()}`
        ]);
      });
      
      distributionRows.push(['']);
      
      const performanceRows = [
        ['PERFORMANCE TRENDS'],
        ['Time Period', 'Applications', 'Approvals', 'Volume']
      ];
      
      performanceResponse.data.labels.forEach((label, index) => {
        performanceRows.push([
          label,
          performanceResponse.data.applications[index],
          performanceResponse.data.approvals[index],
          `$${(performanceResponse.data.volumes[index] * 1000000).toLocaleString()}`
        ]);
      });
      
      // Combine all rows
      const allRows = [
        ...summaryData,
        ...pipelineRows,
        ...distributionRows,
        ...performanceRows
      ];
      
      // Convert to CSV string manually since we have multiple sections
      let csvContent = '';
      allRows.forEach(row => {
        csvContent += row.join(',') + '\r\n';
      });
      
      // Log export for audit
      await createAuditLog({
        eventType: 'report:export',
        description: `Exported complete analytics report for ${timeframe}`,
        userId: req.user.id,
        userRole: req.user.role,
        level: 'info',
        metadata: { timeframe, reportType: 'all' }
      });
      
      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      // Send CSV content
      return res.send(csvContent);
    }
  }
  
  // Convert data to CSV
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(data);
  
  // Log export for audit
  await createAuditLog({
    eventType: 'report:export',
    description: `Exported ${type} report for ${timeframe}`,
    userId: req.user.id,
    userRole: req.user.role,
    level: 'info',
    metadata: { timeframe, reportType: type }
  });
  
  // Set response headers
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  
  // Send CSV
  res.send(csv);
});
