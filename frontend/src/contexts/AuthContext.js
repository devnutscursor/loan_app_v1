import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

// Helper function to normalize user data structure across the application
const normalizeUserData = (userData) => {
  if (!userData) return null;
  
  // If we have a nested user object, extract it
  if (userData.user && typeof userData.user === 'object') {
    return userData.user;
  }
  
  // Otherwise use the data directly if it has expected user properties
  if (userData._id && userData.role) {
    return userData;
  }
  
  // Handle deeply nested structures
  if (userData.data && userData.data.user) {
    return userData.data.user;
  }
  
  // Return original if we can't normalize
  return userData;
};

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // console.log('Attempting to fetch user profile');
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`,
            { 
              headers: { Authorization: `Bearer ${token}` },
              // Increase timeout for potential network issues
              timeout: 10000 
            }
          );
          // console.log('User profile fetched successfully:', response.data);
          
          // Normalize the user data using our helper function
          const userData = response.data.data;
          const normalizedUser = normalizeUserData(userData);
          
          // console.log('Normalized user:', normalizedUser);
          
          // Set the normalized user in state
          setUser(normalizedUser);
        } catch (error) {
          // console.error('Error fetching user:', error);
          // Only remove token for authentication errors (401, 403)
          // For network errors or server errors, keep the token
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // console.log('Authentication error, removing token');
            localStorage.removeItem('token');
            toast.error('Your session has expired. Please log in again.');
          } else {
            // Just log other errors but don't sign out the user
            console.warn('Non-authentication error occurred, keeping user session');
          }
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      // console.log('Attempting login with email:', email);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`,
        { email, password }
      );
      
      // console.log('Login response:', response.data);
      
      // Get token and normalize user data
      const responseData = response.data.data;
      const token = responseData.token;
      const normalizedUser = normalizeUserData(responseData);
      
      // console.log('Normalized user after login:', normalizedUser);
      
      localStorage.setItem('token', token);
      setUser(normalizedUser);
      
      // Redirect based on user role
      if (normalizedUser.role === 'borrower') {
        router.push('/borrower/dashboard');
      } else if (normalizedUser.role === 'lender') {
        router.push('/lender/dashboard');
      } else if (normalizedUser.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 
        error.response?.data?.message || 
        'Failed to login. Please check your credentials.';
      toast.error(errorMessage);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`,
        userData
      );
      
      toast.success('Registration successful! Please login.');
      router.push('/login');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = 
        error.response?.data?.message || 
        'Failed to register. Please try again.';
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
    toast.success('Logged out successfully');
  };

  const updateProfile = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`,
        userData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUser(response.data.data);
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = 
        error.response?.data?.message || 
        'Failed to update profile. Please try again.';
      toast.error(errorMessage);
      return false;
    }
  };

  const isAuthenticated = !!user;

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!user) return false;
    
    // console.log('Checking role in hasRole function:', { user, role });
    
    // Use direct role access - user should already be normalized
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
