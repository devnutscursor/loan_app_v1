import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { companyService } from '../../services/api';

const NewLenderModal = ({ isOpen, onClose, onSuccess, user }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    nmls: '',
    officePhone: '',
    officePhoneExt: '',
    mobilePhone: '',
    clientFacingTitle: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const lenderData = {
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        nmls: formData.nmls || undefined,
        officePhone: formData.officePhone || undefined,
        officePhoneExt: formData.officePhoneExt || undefined,
        mobilePhone: formData.mobilePhone || formData.phone || undefined,
        clientFacingTitle: formData.clientFacingTitle || undefined,
      };
      
      const response = await companyService.createLender(user.company, lenderData);
      
      toast.success(`Lender ${formData.firstName} ${formData.lastName} created successfully!`);
      
      // Reset form
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phone: '',
        nmls: '',
        officePhone: '',
        officePhoneExt: '',
        mobilePhone: '',
        clientFacingTitle: '',
        password: '',
        confirmPassword: ''
      });
      
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error creating lender:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to create lender. Please try again.');
      }
      
      if (error.response?.status === 400 && error.response?.data?.message?.includes('email')) {
        setErrors({ ...errors, email: 'Email already in use' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-lg mx-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add New Lender</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
                Middle Name
              </label>
              <input
                id="middleName"
                name="middleName"
                type="text"
                value={formData.middleName}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.middleName ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                placeholder="A."
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
              placeholder="(123) 456-7890"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="officePhone" className="block text-sm font-medium text-gray-700">
                Office Phone
              </label>
              <input
                id="officePhone"
                name="officePhone"
                type="tel"
                value={formData.officePhone}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.officePhone ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                placeholder="(123) 456-7890"
              />
            </div>
            <div>
              <label htmlFor="officePhoneExt" className="block text-sm font-medium text-gray-700">
                Ext
              </label>
              <input
                id="officePhoneExt"
                name="officePhoneExt"
                type="text"
                value={formData.officePhoneExt}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.officePhoneExt ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                placeholder="123"
              />
            </div>
            <div>
              <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-700">
                Mobile Phone
              </label>
              <input
                id="mobilePhone"
                name="mobilePhone"
                type="tel"
                value={formData.mobilePhone}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.mobilePhone ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                placeholder="(123) 456-7890"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="nmls" className="block text-sm font-medium text-gray-700">
                NMLS ID #
              </label>
              <input
                id="nmls"
                name="nmls"
                type="text"
                value={formData.nmls}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.nmls ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                placeholder="123456"
                required={true}
              />
            </div>
            <div>
              <label htmlFor="clientFacingTitle" className="block text-sm font-medium text-gray-700">
                Client-Facing Title
              </label>
              <input
                id="clientFacingTitle"
                name="clientFacingTitle"
                type="text"
                value={formData.clientFacingTitle}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.clientFacingTitle ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                placeholder="Senior Loan Officer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Lender'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewLenderModal;
