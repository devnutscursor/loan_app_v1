import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import RoleSelector from '../components/forms/RoleSelector';
import LenderRegistrationForm from '../components/forms/LenderRegistrationForm';
import CompanyRegistrationForm from '../components/forms/CompanyRegistrationForm';
import FormFooter from '../components/forms/FormFooter';

const Register = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'lender',
    termsAccepted: false,
    // Lender-specific fields
    companyId: '',
    // Company-specific fields
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    maxLenders: 10,
    primaryContactFirstName: '',
    primaryContactLastName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    primaryContactPassword: '',
    primaryContactConfirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.role === 'lender') {
      // Lender validation
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

      if (formData.phone && !/^\+?[\d\s-()]{10,}$/.test(formData.phone.replace(/\s+/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      // Check if admin is creating a lender (companyId required)
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const isAdminCreatingUser = currentUser && currentUser.role === 'admin';
      if (isAdminCreatingUser && !formData.companyId) {
        newErrors.companyId = 'Company selection is required';
      }
    } else if (formData.role === 'company') {
      // Company validation
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      }
      
      if (!formData.companyEmail) {
        newErrors.companyEmail = 'Company email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.companyEmail)) {
        newErrors.companyEmail = 'Invalid email format';
      }

      if (formData.companyPhone && !/^\+?[\d\s-()]{10,}$/.test(formData.companyPhone.replace(/\s+/g, ''))) {
        newErrors.companyPhone = 'Please enter a valid phone number';
      }

      // Primary contact validation
      if (!formData.primaryContactFirstName.trim()) {
        newErrors.primaryContactFirstName = 'Primary contact first name is required';
      }
      
      if (!formData.primaryContactLastName.trim()) {
        newErrors.primaryContactLastName = 'Primary contact last name is required';
      }
      
      if (!formData.primaryContactEmail) {
        newErrors.primaryContactEmail = 'Primary contact email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.primaryContactEmail)) {
        newErrors.primaryContactEmail = 'Invalid email format';
      }

      if (formData.primaryContactPhone && !/^\+?[\d\s-()]{10,}$/.test(formData.primaryContactPhone.replace(/\s+/g, ''))) {
        newErrors.primaryContactPhone = 'Please enter a valid phone number';
      }
      
      if (!formData.primaryContactPassword) {
        newErrors.primaryContactPassword = 'Primary contact password is required';
      } else if (formData.primaryContactPassword.length < 8) {
        newErrors.primaryContactPassword = 'Password must be at least 8 characters';
      }
      
      if (formData.primaryContactPassword !== formData.primaryContactConfirmPassword) {
        newErrors.primaryContactConfirmPassword = 'Passwords do not match';
      }

      // Validate maxLenders
      if (formData.maxLenders < 1 || formData.maxLenders > 100) {
        newErrors.maxLenders = 'Max lenders must be between 1 and 100';
      }
    }
    
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      
      let response;
        if (formData.role === 'lender') {
          // Admin creating a lender - only send lender-specific data
          const lenderData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            companyId: formData.companyId // This will need to be added to the form
          };
          
          response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users/lender`, 
            lenderData,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          toast.success(`Lender account created successfully! ${lenderData.firstName} ${lenderData.lastName} can now log in.`);
        } else if (formData.role === 'company') {
          // Admin creating a company - only send company-specific data
          const companyData = {
            companyName: formData.companyName,
            phone: formData.companyPhone,
            email: formData.companyEmail,
            maxLenders: parseInt(formData.maxLenders),
            primaryContact: {
              firstName: formData.primaryContactFirstName,
              lastName: formData.primaryContactLastName,
              email: formData.primaryContactEmail,
              phone: formData.primaryContactPhone,
              password: formData.primaryContactPassword
            }
          };
          
          response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/companies`, 
            companyData,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          toast.success(`Company account created successfully! ${formData.companyName} and primary contact ${formData.primaryContactFirstName} ${formData.primaryContactLastName} can now log in.`);
        }
        router.push('/admin/dashboard');
     
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
      
      if (error.response?.status === 400 && error.response?.data?.message?.includes('email')) {
        const emailField = formData.role === 'company' ? 'primaryContactEmail' : 'email';
        setErrors({ ...errors, [emailField]: 'Email already in use' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {formData.role === 'company' ? 'Create Company Account' : 'Create Lender Account'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {formData.role === 'company' 
                ? 'Create a new company account with primary contact for your loan application system'
                : 'Create a new lender account for your loan application system'
              }
            </p>
          </div>
          
          <div className="bg-white py-8 px-6 shadow rounded-xl sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Role selector - always visible at the top */}
              <RoleSelector formData={formData} handleChange={handleChange} />

              {/* Dynamic form content with smooth transitions */}
              <div className="relative overflow-hidden">
                <div 
                  className={`transition-all duration-500 ease-in-out transform ${
                    formData.role === 'lender' 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-full absolute inset-0'
                  }`}
                >
                  <LenderRegistrationForm 
                    formData={formData} 
                    errors={errors} 
                    handleChange={handleChange}
                    currentRole={formData.role}
                  />
                </div>
                
                <div 
                  className={`transition-all duration-500 ease-in-out transform ${
                    formData.role === 'company' 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 translate-x-full absolute inset-0'
                  }`}
                >
                  <CompanyRegistrationForm 
                    formData={formData} 
                    errors={errors} 
                    handleChange={handleChange}
                    currentRole={formData.role}
                  />
                </div>
              </div>

              {/* Form footer - always visible at the bottom */}
              <FormFooter 
                formData={formData} 
                errors={errors} 
                handleChange={handleChange} 
                loading={loading} 
              />
            </form>

            {/* <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div>
                  <button
                    type="button"
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Sign up with Google</span>
                    <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Sign up with Microsoft</span>
                    <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M7.5 7.473V0h-6v7.474H7.5zM8.5 0v7.474h6V0h-6zM7.5 8.526v7.474h-6V8.526h6zM8.5 15.999v-7.473h6v7.473h-6z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Register;
