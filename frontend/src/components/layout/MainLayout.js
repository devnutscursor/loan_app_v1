import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

const MainLayout = ({ children, title = 'Loan Application System', noSidebarMargin = true }) => {
  const router = useRouter();
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
  // const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

    // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
    }
  }, [isSidebarCollapsed]);
  // Check if user is logged in
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !userData) {
          // Public routes that don't require authentication
          const publicRoutes = ['/', '/login', '/register', '/register/borrower', '/forgot-password', '/reset-password', '/terms', '/privacy', '/email-verification-sent', '/verify-email', '/resend-verification'];
          
          if (!publicRoutes.some(route => router.pathname.startsWith(route))) {
            router.push('/login');
            return false;
          }
        } else {
          setUser(userData);
          
          // Redirect if accessing authentication pages while logged in
          const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
          if (authRoutes.includes(router.pathname)) {
            if (userData.role === 'borrower') {
              router.push('/borrower/dashboard');
            } else if (userData.role === 'lender') {
              router.push('/lender/dashboard');
            } else if (userData.role === 'admin') {
              router.push('/admin/dashboard');
            } else {
              router.push('/');
            }
            return false;
          }
        }
        return true;
      } catch (error) {
        console.error('Authentication check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (router.pathname !== '/login' && router.pathname !== '/register') {
          router.push('/login');
          return false;
        }
        return true;
      } finally {
        setLoading(false);
      }
    };
    
    // Only run auth check if the pathname changes
    if (loading) {
      const shouldRender = checkAuth();
      if (!shouldRender) return;
    }
  }, [router.pathname, loading]);

  // Determine if sidebar should be shown
  const showSidebar = () => {
    if (!user) return false;
    
    // Public pages or auth pages don't need sidebar
    const noSidebarRoutes = ['/', '/login', '/register', '/register/borrower', '/forgot-password', '/reset-password', '/terms', '/privacy'];
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
