import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const BorrowerRegister = () => {
  const router = useRouter();
  const { lenderId } = router.query;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [lenderDetails, setLenderDetails] = useState(null);
  const [lenderNotFound, setLenderNotFound] = useState(false);

  // Fetch lender details when lenderId is available
  useEffect(() => {
    if (lenderId) {
      const fetchLenderDetails = async () => {
        try {
          // Use the new public endpoint that doesn't require authentication
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/public/${lenderId}`);
          setLenderDetails(response.data.data);
          setLenderNotFound(false);
        } catch (error) {
          console.error('Error fetching lender details:', error);
          setLenderNotFound(true);
          toast.error('Invalid lender referral link');
        }
      };

      fetchLenderDetails();
    }
  }, [lenderId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // Validate phone (optional but validate format if provided)
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Validate terms acceptance
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }
    
    // Check if lender ID is available
    if (!lenderId) {
      newErrors.lenderId = 'Invalid registration link. Please use a valid referral link from your lender.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    // Create registration data (omit confirmPassword and termsAccepted)
    const { confirmPassword, termsAccepted, ...registrationData } = formData;
    
    try {
      // Call the borrower registration endpoint with lenderId as query parameter
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register/borrower?lenderId=${lenderId}`, 
        registrationData
      );
      
      toast.success('Registration successful! Please log in.');
      router.push('/login');
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
      
      // Handle specific errors (like email already exists)
      if (error.response?.status === 400 && error.response?.data?.message?.includes('email')) {
        setErrors({ ...errors, email: 'Email already in use' });
      }
    } finally {
      setLoading(false);
    }
  };

  // If we're still waiting for router to initialize, show loading state
  if (router.isReady === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If lender ID is missing, show error
  if (router.isReady && !lenderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Invalid Registration Link</h2>
            <p className="mt-2 text-gray-600">
              This borrower registration link is invalid or has expired. Please contact your lender for a valid registration link.
            </p>
            <div className="mt-6">
              <Link href="/" className="text-primary hover:text-primary-dark">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If lender was not found, show error
  if (lenderNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Lender Not Found</h2>
            <p className="mt-2 text-gray-600">
              The lender associated with this registration link could not be found. Please contact your lender for assistance.
            </p>
            <div className="mt-6">
              <Link href="/" className="text-primary hover:text-primary-dark">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          {lenderDetails && (
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500">You've been invited to register as a borrower by</p>
              <h3 className="text-xl font-bold text-gray-800">
                {lenderDetails.user?.firstName} {lenderDetails.user?.lastName}
              </h3>
              {lenderDetails.company && (
                <p className="text-md text-gray-700">{lenderDetails.company.name}</p>
              )}
            </div>
          )}
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your borrower account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
              Sign in
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="mb-3">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                    errors.firstName ? 'border-red-300' : ''
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              
              {/* Last Name */}
              <div className="mb-3">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                    errors.lastName ? 'border-red-300' : ''
                  }`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>
            
            {/* Email */}
            <div className="mb-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                  errors.email ? 'border-red-300' : ''
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            {/* Phone */}
            <div className="mb-3">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                  errors.phone ? 'border-red-300' : ''
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Format: (123) 456-7890
              </p>
            </div>
            
            {/* Password */}
            <div className="mb-3">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                  errors.password ? 'border-red-300' : ''
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            
            {/* Confirm Password */}
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                  errors.confirmPassword ? 'border-red-300' : ''
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
            
            {/* Terms and Conditions */}
            <div className="mb-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="termsAccepted"
                    name="termsAccepted"
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    className={`h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded ${
                      errors.termsAccepted ? 'border-red-300' : ''
                    }`}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="termsAccepted" className="font-medium text-gray-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary hover:text-primary-dark">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary hover:text-primary-dark">
                      Privacy Policy
                    </Link>
                  </label>
                  {errors.termsAccepted && (
                    <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Borrower Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BorrowerRegister;
