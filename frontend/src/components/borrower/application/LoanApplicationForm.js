import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';
import PersonalInfoForm from './PersonalInfoForm';
import AddressInfoForm from './AddressInfoForm';
import EmploymentIncomeForm from './EmploymentIncomeForm';
import PropertyInfoForm from './PropertyInfoForm';
import DocumentUploadForm from './DocumentUploadForm';
import { validatePersonalInfo, validateAddressInfo, validateEmploymentInfo, validatePropertyInfo } from '../../../utils/validators';
import { useToast } from '../../../hooks/useToast';

/**
 * Main Loan Application Form Component
 * 
 * Manages the multi-step loan application process with form validation,
 * data persistence, and integration with the milestone tracking system.
 */
const LoanApplicationForm = ({ applicationId }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { id } = useParams();
  const loanId = applicationId || id;
  
  // Application steps
  const steps = [
    { id: 'personalInfo', name: 'Personal Information', component: PersonalInfoForm, validator: validatePersonalInfo },
    { id: 'addressInfo', name: 'Address History', component: AddressInfoForm, validator: validateAddressInfo },
    { id: 'employmentIncome', name: 'Employment & Income', component: EmploymentIncomeForm, validator: validateEmploymentInfo },
    { id: 'propertyInfo', name: 'Property Information', component: PropertyInfoForm, validator: validatePropertyInfo },
    { id: 'documents', name: 'Required Documents', component: DocumentUploadForm, validator: () => ({}) }
  ];

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('in_progress');

  // Load existing application data if available
  useEffect(() => {
    const fetchApplicationData = async () => {
      if (loanId) {
        try {
          // In a real app, this would be an API call
          // const response = await api.get(`/applications/${loanId}`);
          // setFormData(response.data);
          // setApplicationStatus(response.data.status);
          
          // For demo, we'll use mock data
          const mockData = {
            id: loanId,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            status: 'in_progress',
            // Add other fields as needed
          };
          
          setFormData(mockData);
          setApplicationStatus(mockData.status);
          
          showToast('Application data loaded successfully', 'success');
        } catch (error) {
          showToast('Failed to load application data', 'error');
          console.error('Error loading application:', error);
        }
      }
    };

    fetchApplicationData();
  }, [loanId, showToast]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors for the changed field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle field blur for validation
  const handleBlur = (e) => {
    const { name } = e.target;
    const currentValidator = steps[currentStep].validator;
    const fieldErrors = currentValidator({ [name]: formData[name] });
    
    if (fieldErrors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: fieldErrors[name]
      }));
    }
  };

  // Handle document upload
  const handleDocumentUpload = (document) => {
    setFormData(prev => ({
      ...prev,
      documents: [...(prev.documents || []), document]
    }));
    
    showToast(`${document.name} uploaded successfully`, 'success');
  };

  // Handle document removal
  const handleDocumentRemove = (documentId) => {
    setFormData(prev => ({
      ...prev,
      documents: (prev.documents || []).filter(doc => doc.id !== documentId)
    }));
    
    showToast('Document removed successfully', 'success');
  };

  // Validate current step
  const validateStep = () => {
    const currentValidator = steps[currentStep].validator;
    const stepErrors = currentValidator(formData);
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // Save progress
  const saveProgress = async () => {
    setIsSaving(true);
    
    try {
      // In a real app, this would be an API call
      // await api.post('/applications', formData);
      
      // For demo purposes
      console.log('Saving application data:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showToast('Application progress saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save application progress', 'error');
      console.error('Error saving application:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Move to next step
  const handleNext = async () => {
    const isValid = validateStep();
    
    if (isValid) {
      // Save progress before moving to next step
      await saveProgress();
      
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo(0, 0);
      } else {
        // On final step submission
        handleSubmit();
      }
    } else {
      showToast('Please correct the errors before proceeding', 'error');
    }
  };

  // Move to previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  // Submit the full application
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Update application status
      const updatedData = {
        ...formData,
        status: 'submitted',
        submittedAt: new Date()
      };
      
      // In a real app, this would be an API call
      // await api.post('/applications/submit', updatedData);
      
      // For demo purposes
      console.log('Submitting application data:', updatedData);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update milestone status
      // In a real app, this would be another API call
      // await api.post('/milestones/update', { 
      //   applicationId: updatedData.id, 
      //   milestoneId: 'application_submission',
      //   status: 'completed' 
      // });
      
      setApplicationStatus('submitted');
      showToast('Application submitted successfully!', 'success');
      
      // Navigate to confirmation page
      navigate(`/borrower/applications/${loanId || 'new'}/confirmation`);
    } catch (error) {
      showToast('Failed to submit application', 'error');
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step component
  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Application Progress Header */}
      <div className="mb-8 pb-4 border-b border-gray-200">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loan Application</h1>
            <p className="mt-1 text-sm text-gray-500">
              {applicationStatus === 'in_progress' 
                ? 'Complete all sections to submit your application.'
                : 'Your application has been submitted and is under review.'}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {applicationStatus === 'in_progress' ? 'In Progress' : 'Submitted'}
            </span>
          </div>
        </div>

        {/* Progress Steps */}
        <nav aria-label="Progress" className="mt-6">
          <ol className="space-y-4 md:flex md:space-y-0 md:space-x-8">
            {steps.map((step, index) => (
              <li key={step.id} className="md:flex-1">
                <button
                  type="button"
                  onClick={() => index < currentStep && setCurrentStep(index)}
                  disabled={index > currentStep || isSubmitting}
                  className={`group pl-4 py-2 flex flex-col border-l-4 md:pl-0 md:pt-4 md:pb-0 md:border-l-0 md:border-t-4 w-full text-left ${
                    index < currentStep
                      ? 'border-primary hover:border-primary-dark'
                      : index === currentStep
                      ? 'border-primary'
                      : 'border-gray-200'
                  }`}
                >
                  <span className={`text-xs font-semibold tracking-wide uppercase ${
                    index < currentStep
                      ? 'text-primary-dark group-hover:text-primary-darker'
                      : index === currentStep
                      ? 'text-primary'
                      : 'text-gray-500'
                  }`}>
                    Step {index + 1}
                  </span>
                  <span className="text-sm font-medium">{step.name}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Form Content */}
      <div className="bg-white shadow rounded-lg p-6">
        <CurrentStepComponent
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          handleBlur={handleBlur}
          handleDocumentUpload={handleDocumentUpload}
          handleDocumentRemove={handleDocumentRemove}
          isSubmitting={isSubmitting}
        />

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
          <div>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isSubmitting || isSaving}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={saveProgress}
              disabled={isSubmitting || isSaving}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Progress'
              )}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting || isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : currentStep === steps.length - 1 ? (
                'Submit Application'
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Need assistance?</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                If you have questions about your application, please contact your loan officer or 
                <a href="/borrower/messages" className="font-medium underline"> send a message</a> through your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

LoanApplicationForm.propTypes = {
  applicationId: PropTypes.string
};

export default LoanApplicationForm;
