import { adminService } from '@/services/api';
import { useState, useEffect } from 'react';

import toast from 'react-hot-toast';

export const useAdminDashboard = ()  => {

    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        summary: {
            totalLoans: 0,
            totalUsers: 0,
            totalVolume: 0,
            activeLoans: 0
        },
        users: {
            borrowers: 0,
            lenders: 0,
            admins: 0,
            companies: 0
        },
        loanStats: {
            totalApplications: 0,
            approved: 0,
            pending: 0,
            rejected: 0,
            totalVolume: 0,
            averageAmount: 0
        }
    });
    
    useEffect(() => {
        const fetchDashboardData = async () => {
        try {
            // Check if logout is in progress to prevent unnecessary API calls
            const isLogoutInProgress = localStorage.getItem('logoutInProgress');
            if (isLogoutInProgress) {
                return;
            }
            
            setLoading(true);
            const response = await adminService.getDashboard();
            setDashboardData(response.data.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Only show error toast if not during logout
            const isLogoutInProgress = localStorage.getItem('logoutInProgress');
            if (!isLogoutInProgress) {
                toast.error('Failed to load dashboard data');
            }
        } finally {
            setLoading(false);
        }
    };

    fetchDashboardData();

    // Refresh data every 5 minutes
    const intervalId = setInterval(fetchDashboardData, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return {
        dashboardData,
        loading,
        formatCurrency
    };
};    

export default useAdminDashboard;