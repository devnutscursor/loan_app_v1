import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const MainLayout = ({ children, title = 'Loan Application System', noSidebarMargin = true }) => {
  const router = useRouter();
  const { user, loading } = useAuth(); // Use AuthContext instead of local state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Try to get the saved sidebar state from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      console.log('Saved sidebar state:', JSON.parse(saved));
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

    // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
    }
  }, [isSidebarCollapsed]);
  // Handle redirects for authenticated users on auth pages
  useEffect(() => {
    if (!loading && user) {
      // Redirect if accessing authentication pages while logged in
      // Exception: Allow admins to access /register for creating new users
      const authRoutes = ['/login', '/forgot-password', '/reset-password'];
      const registerRoute = '/register';
      
      if (authRoutes.includes(router.pathname)) {
        if (user.role === 'borrower') {
          router.push('/borrower/dashboard');
        } else if (user.role === 'lender') {
          router.push('/lender/dashboard');
        } else if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
        return;
      }
      
      // Special handling for register route - only redirect non-admins
      if (router.pathname === registerRoute && user.role !== 'admin') {
        if (user.role === 'borrower') {
          router.push('/borrower/dashboard');
        } else if (user.role === 'lender') {
          router.push('/lender/dashboard');
        } else {
          router.push('/');
        }
        return;
      }
    }
  }, [user, loading, router]);

  // Determine if sidebar should be shown
  const showSidebar = () => {
    if (!user) return false;
    
    // Public pages or auth pages don't need sidebar
    // Exception: Show sidebar for admins on /register page
    const noSidebarRoutes = ['/', '/login', '/register/borrower', '/forgot-password', '/reset-password', '/terms', '/privacy'];
    
    // Special case: Show sidebar for admins on register page
    if (router.pathname === '/register' && user.role === 'admin') {
      return true;
    }
    
    if (noSidebarRoutes.includes(router.pathname)) return false;
    
    return true;
  };
  
 // Track whether sidebar has been manually toggled
const [manuallyToggled, setManuallyToggled] = useState(false);

// Set collapsed sidebar for loan detail pages ONLY on initial load of those pages
useEffect(() => {
  // Only auto-collapse if user hasn't manually toggled
  if (!manuallyToggled) {
    const isLoanDetailPage = router.pathname.match(/\/lender\/loans\/[^/]+$/);
    const isBorrowerLoanDetailPage = router.pathname.match(/\/borrower\/loans\/[^/]+$/);
    
    if (isLoanDetailPage || isBorrowerLoanDetailPage) {
      setIsSidebarCollapsed(true);
    }
    // We no longer auto-expand on other pages
  }
}, [router.pathname, manuallyToggled]);

// Modify how we pass the setIsCollapsed function
const handleToggleSidebar = () => {
  setManuallyToggled(true);
  setIsSidebarCollapsed(prev => !prev);
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="description" content="Loan Application System - Simplifying the loan process" />
      </Head>
      
      <Toaster position="top-right" />
      
      <div className="flex min-h-screen overflow-y-auto">
        {showSidebar() && (
          <Sidebar 
  isOpen={sidebarOpen} 
  setIsOpen={setSidebarOpen} 
  isCollapsed={isSidebarCollapsed}
  setIsCollapsed={handleToggleSidebar} // Use custom handler
  user={user} 
/>
        )}
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar user={user} setSidebarOpen={setSidebarOpen} />
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
            {children}
          </main>
          
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default React.memo(MainLayout);
