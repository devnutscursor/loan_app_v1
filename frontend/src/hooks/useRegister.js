import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export const useRegister = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    nmls: '',
    officePhone: '',
    officePhoneExt: '',
    mobilePhone: '',
    clientFacingTitle: '',
    role: 'lender',
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
    primaryContactConfirmPassword: '',
    // Address fields
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    // Other company fields
    website: '',
    legalEntityType: '',
    legalEntityOrganizedUnder: '',
    posLoanAppAssignee: ''
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
    
    
    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { isValid, errors: validationErrors } = validateForm();
  
    if (!isValid) {
      const errorMessages = Object.values(validationErrors);
      
      if (errorMessages.length === 1) {
        toast.error(errorMessages[0]);
      } else if (errorMessages.length <= 3) {
        // Show first 3 errors
        toast.error(errorMessages.slice(0, 3).join(', '));
      } else {
        toast.error(`Please fix ${errorMessages.length} errors in the form`);
      }
      return;
    }
    
    setLoading(true);
    
    try {
      let response;
      if (formData.role === 'lender') {
        // Admin creating a lender - only send lender-specific data
        const lenderData = {
          firstName: formData.firstName,
          middleName: formData.middleName || undefined,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          mobilePhone: formData.mobilePhone || formData.phone || undefined,
          officePhone: formData.officePhone || undefined,
          officePhoneExt: formData.officePhoneExt || undefined,
          clientFacingTitle: formData.clientFacingTitle || undefined,
          nmls: formData.nmls || undefined,
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
          nmls: formData.nmls || undefined,
          website: formData.website || undefined,
          address: {
            addressLine1: formData.addressLine1 || undefined,
            addressLine2: formData.addressLine2 || undefined,
            city: formData.city || undefined,
            state: formData.state || undefined,
            zipCode: formData.zipCode || undefined,
            country: 'United States'
          },
          legalEntityType: formData.legalEntityType || undefined,
          legalEntityOrganizedUnder: formData.legalEntityOrganizedUnder || undefined,
          posLoanAppAssignee: formData.posLoanAppAssignee || undefined,
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

  return {
    formData,
    loading,
    errors,
    handleChange,
    handleSubmit,
    validateForm
  };
};
