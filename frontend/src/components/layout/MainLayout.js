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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !userData) {
          // Public routes that don't require authentication
          const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/terms', '/privacy'];
          
          if (!publicRoutes.includes(router.pathname)) {
            router.push('/login');
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
          }
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (router.pathname !== '/login' && router.pathname !== '/register') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router.pathname]);
  
  // Determine if sidebar should be shown
  const showSidebar = () => {
    if (!user) return false;
    
    // Public pages or auth pages don't need sidebar
    const noSidebarRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/terms', '/privacy'];
    if (noSidebarRoutes.includes(router.pathname)) return false;
    
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="description" content="Loan Application System - Simplifying the loan process" />
      </Head>
      
      <Toaster position="top-right" />
      
      <Navbar 
        user={user} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      
      <div className="flex flex-1">
        {showSidebar() && (
          <Sidebar 
            isOpen={sidebarOpen} 
            setIsOpen={setSidebarOpen} 
            user={user} 
          />
        )}
        
        <main className={`flex-1 ${(showSidebar() && !noSidebarMargin) ? 'md:ml-64' : ''} transition-all duration-300 ease-in-out`}>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {!loading && children}
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default MainLayout;
