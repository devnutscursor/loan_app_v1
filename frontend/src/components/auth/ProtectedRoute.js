import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

// Helper function to safely extract the role from any user object structure
const extractUserRole = (user) => {
  if (!user) return null;
  
  // Check for direct role property
  if (user.role) return user.role;
  
  // Check for user.user.role (common nesting pattern)
  if (user.user && user.user.role) return user.user.role;
  
  // Traverse the object looking for a role property (max depth: 3)
  const checkNestedObject = (obj, depth = 0) => {
    if (depth > 3 || typeof obj !== 'object' || obj === null) return null;
    
    // Check all properties
    for (const key in obj) {
      if (key === 'role' && typeof obj[key] === 'string') {
        return obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        const result = checkNestedObject(obj[key], depth + 1);
        if (result) return result;
      }
    }
    
    return null;
  };
  
  return checkNestedObject(user);
};

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [authAttempts, setAuthAttempts] = useState(0);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Skip during initial loading or if already redirecting
    if (loading || redirecting) return;
    
    // For temporary API errors, we should try a few times before redirecting
    const MAX_AUTH_ATTEMPTS = 3;
    
    // Log authentication status for debugging
    // console.log('Auth state:', { isAuthenticated, user, loading, roles, authAttempts });

    // If not authenticated after multiple attempts, redirect to login
    if (!isAuthenticated) {
      if (authAttempts >= MAX_AUTH_ATTEMPTS) {
        console.log('Max auth attempts reached, redirecting to login');
        setRedirecting(true);
        router.push({
          pathname: '/login',
          query: { returnUrl: router.asPath },
        });
        return;
      } else {
        // Increment attempts counter
        setAuthAttempts(prev => prev + 1);
        // console.log(`Auth attempt ${authAttempts + 1} of ${MAX_AUTH_ATTEMPTS}`);
        return;
      }
    }

    // Reset attempts counter when authenticated
    if (authAttempts > 0) {
      setAuthAttempts(0);
    }

    // If roles specified and user doesn't have required role, redirect to appropriate dashboard
    if (user && roles.length > 0) {
      // Extract the user role using our helper function that handles all nesting cases
      const userRole = extractUserRole(user);
      // console.log('Checking roles - Extracted role:', userRole, 'Required roles:', roles);
      
      const hasRequiredRole = userRole && roles.includes(userRole);
      
      if (!hasRequiredRole) {
        // console.log('User does not have required role, redirecting');
        setRedirecting(true);
        
        // Redirect to appropriate dashboard based on user role
        if (userRole === 'borrower') {
          router.push('/borrower/dashboard');
        } else if (userRole === 'lender') {
          router.push('/lender/dashboard');
        } else if (userRole === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      } else {
        // console.log('User has required role:', userRole);
      }
    }
  }, [isAuthenticated, loading, router, roles, user, authAttempts, redirecting]);

  // Show loading while checking authentication, but with different messaging based on attempt count
  if (loading || redirecting || (!isAuthenticated && authAttempts < 3) || 
     (isAuthenticated && roles.length > 0 && user && 
      !roles.includes(extractUserRole(user)))) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {authAttempts > 0 && (
          <p className="text-gray-600 text-sm mt-2">
            Connecting to server... {authAttempts}/3
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
