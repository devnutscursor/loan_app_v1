// Utility functions for lender stats page

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export const mapActivityIcons = () => {
  const { 
    FileText, 
    CheckCircle, 
    Clock, 
    RefreshCw, 
    XCircle, 
    Upload, 
    Edit, 
    FileCheck, 
    FilePlus, 
    FileX, 
    FilePen, 
    MessageSquare 
  } = require('lucide-react');
  
  const iconMap = { 
    FileText, 
    CheckCircle, 
    Clock, 
    RefreshCw, 
    XCircle, 
    Upload, 
    Edit, 
    FileCheck, 
    FilePlus, 
    FileX, 
    FilePen, 
    MessageSquare 
  };
  return iconMap;
};

export const transformActivities = (activities, iconMap) => {
  return activities.map(a => ({
    ...a,
    icon: iconMap[a.icon] || iconMap.FileText,
    statusColor: `bg-${a.statusColor}-500`
  }));
};

export const transformStats = (dashboardData) => {
  return {
    totalLoans: dashboardData.stats?.totalLoans || 0,
    approvedLoans: dashboardData.stats?.approvedLoans || 0,
    pendingApplications: dashboardData.stats?.pendingApplications || 0,
    totalAmount: dashboardData.stats?.totalAmount || 0,
    metrics: {
      approvalRate: dashboardData.stats?.metrics?.approvalRate || 0,
      approvalRateTrend: dashboardData.stats?.metrics?.approvalRateTrend || 0,
      avgProcessingTime: dashboardData.stats?.metrics?.avgProcessingTime || 0,
      processingTimeTrend: dashboardData.stats?.metrics?.processingTimeTrend || 0
    },
    percentChanges: {
      loans: 0,
      applications: 0,
      amount: 0
    }
  };
};

export const transformBorrowerLoans = (recentBorrowers) => {
  const loansMap = {};
  recentBorrowers.forEach(borrower => {
    loansMap[borrower._id] = borrower.loanCount || 0;
  });
  return loansMap;
};
