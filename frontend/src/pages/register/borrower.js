import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import { companyService } from '../../services/api';

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
  const [isValidating, setIsValidating] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);

  // Fetch lender details when lenderId is available
  useEffect(() => {
    if (router.isReady && lenderId) {
      const fetchLenderDetails = async () => {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/public/${lenderId}`, {
            timeout: 5000 // 5 second timeout
          });
          
          const lenderData = response.data.data;
          console.log('lenderData', lenderData);
          setCompanyDetails(lenderData.company);
          setLenderDetails(lenderData);
          setLenderNotFound(false);

        } catch (error) {
          console.error('Error fetching lender and company details:', error);
          setLenderNotFound(true);
          toast.error('Invalid lender referral link');
        }
      };

      fetchLenderDetails();
    }
  }, [router.isReady]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field immediately
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Trigger debounced validation
    setIsValidating(true);
  }, [errors]);

  // Memoized validation function
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }
    
    if (!lenderId) {
      newErrors.lenderId = 'Invalid registration link. Please use a valid referral link from your lender.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, lenderId]);

  // Debounced validation effect
  useEffect(() => {
    if (isValidating) {
      const timeoutId = setTimeout(() => {
        validateForm();
        setIsValidating(false);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData, isValidating, validateForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    
    const { confirmPassword, termsAccepted, ...registrationData } = formData;
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register/borrower?lenderId=${lenderId}`, 
        registrationData,
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      toast.success('Registration successful! Please check your email for verification.');
      router.push(`/email-verification-sent?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('Registration timed out. Please try again.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
      
      if (error.response?.status === 400 && error.response?.data?.message?.includes('email')) {
        setErrors({ ...errors, email: 'Email already in use' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (router.isReady === false) {
    return (
      <MainLayout>
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  // Error states
  const renderErrorState = (title, message) => (
    <MainLayout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">{title}</h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <div className="mt-6">
              <Link href="/" className="text-blue-600 hover:text-blue-500 font-medium">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );

  if (router.isReady && !lenderId) {
    return renderErrorState(
      'Invalid Registration Link',
      'This borrower registration link is invalid or has expired. Please contact your lender for a valid registration link.'
    );
  }

  if (lenderNotFound) {
    return renderErrorState(
      'Lender Not Found',
      'The lender associated with this registration link could not be found. Please contact your lender for assistance.'
    );
  }

  // Main form
  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-0 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          {/* Lender & Company Details (from referral) */}
          {lenderDetails && companyDetails && (
            <div className="mb-10">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">You are registering with</h3>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 sm:p-8 ring-1 ring-blue-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Company Card */}
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {companyDetails.logoUrl ? (
                      <img src={companyDetails.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-gray-400 text-xs">No Logo</span>
                    )}
                  </div>
                  <div className="flex-1">
                      <div className="text-gray-900 font-bold text-lg">{companyDetails.name}</div>
                      <div className="text-sm text-gray-600">NMLS: {companyDetails.nmls || '—'}</div>
                      <div className="text-sm text-gray-600">Phone: {companyDetails.phone || '—'}</div>
                      {companyDetails.address && (
                        <div className="text-xs text-gray-500 mt-1">
                          {[companyDetails.address.addressLine1, companyDetails.address.city, companyDetails.address.state, companyDetails.address.zipCode].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Lender Card */}
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {lenderDetails.user?.profileImageUrl ? (
                        <img src={lenderDetails.user.profileImageUrl} alt="Lender" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-sm">{lenderDetails.user?.firstName?.[0] || 'U'}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-900 font-bold text-lg">{lenderDetails.user?.firstName} {lenderDetails.user?.lastName}</div>
                      <div className="text-sm text-gray-600">{lenderDetails.clientFacingTitle || lenderDetails.title || 'Lender'}</div>
                      <div className="text-sm text-gray-600">NMLS: {lenderDetails.nmls || '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Create Your Borrower Account
            </h2>
            {lenderDetails && (
              <p className="mt-2 text-sm text-gray-600">
                Registering with {companyDetails?.name || lenderDetails.companyName || 'your lender'}
              </p>
            )}
          </div>
          
          <div className="bg-white py-8 px-6 shadow rounded-xl sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <div className="mt-1">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="John"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <div className="mt-1">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="Doe"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="(123) 456-7890"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password *
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="termsAccepted"
                    name="termsAccepted"
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="termsAccepted" className="text-gray-700">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-500">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-500">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>
              {errors.termsAccepted && (
                <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link 
                  href="/login" 
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign in to your account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorrowerRegister;
