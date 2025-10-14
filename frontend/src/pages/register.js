import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import RoleSelector from '../components/forms/RoleSelector';
import LenderRegistrationForm from '../components/forms/LenderRegistrationForm';
import CompanyRegistrationForm from '../components/forms/CompanyRegistrationForm';
import FormFooter from '../components/forms/FormFooter';
import { useRegister } from '../hooks/useRegister';

const Register = () => {
  const {
    formData,
    loading,
    errors,
    handleChange,
    handleSubmit
  } = useRegister();

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-2 sm:px-6 lg:px-8">
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
          
          <div className="bg-white py-8 px-3 shadow rounded-xl sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Role selector - always visible at the top */}
              <RoleSelector formData={formData} handleChange={handleChange} />

              {/* Dynamic form content with smooth transitions */}
              <div className="relative overflow-hidden transition-all duration-500 ease-in-out">
                {formData.role === 'lender' && (
                  <LenderRegistrationForm 
                    formData={formData} 
                    errors={errors} 
                    handleChange={handleChange}
                    currentRole={formData.role}
                  />
                )}

                {formData.role === 'company' && (
                  <CompanyRegistrationForm 
                    formData={formData} 
                    errors={errors} 
                    handleChange={handleChange}
                    currentRole={formData.role}
                  />
                )}
              </div>

              {/* Form footer - always visible at the bottom */}
              <FormFooter 
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
