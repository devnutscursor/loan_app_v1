import React, { useState, useEffect } from 'react';

const MilestoneForm = ({ milestone, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadlineDate: '' // Added deadline date field
  });
  
  const [errors, setErrors] = useState({});

  // Initialize form with milestone data if editing
  useEffect(() => {
    if (milestone) {
      // Format deadline date for date input if available
      let deadlineDate = '';
      if (milestone.deadlineDate) {
        const date = new Date(milestone.deadlineDate);
        deadlineDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
      
      const data = {
        name: milestone.name || '',
        description: milestone.description || '',
        deadlineDate
      };
      setFormData(data);
    }
  }, [milestone]);

  // Handle basic field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate the form
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Milestone name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate and submit the form directly without form submission event
  const submitForm = () => {
    console.log('Submit button clicked, validation starting');
    
    if (validate()) {
      console.log('Validation passed, submitting form data:', formData);
      onSubmit(formData);
    } else {
      console.log('Validation failed, not submitting');
    }
  };

  return (
    <div className="space-y-6">
      {/* Milestone name */}
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Milestone Name*
        </label>
        <div className="relative">
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter milestone name"
            className={`block w-full px-4 py-2.5 pr-10 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm border ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
          />
          {formData.name && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        {errors.name && (
          <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
        )}
      </div>
      
      {/* Description */}
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows="3"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter description for this milestone"
          className="block w-full px-4 py-2.5 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm border border-gray-300"
        ></textarea>
      </div>

      {/* Deadline Date */}
      <div className="mb-2">
        <label htmlFor="deadlineDate" className="block text-sm font-medium text-gray-700 mb-1">
          Deadline Date
        </label>
        <p className="mt-1.5 mb-2 text-xs text-gray-500">Set a target completion date for this milestone</p>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            type="date"
            name="deadlineDate"
            id="deadlineDate"
            value={formData.deadlineDate}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]} // Can't select dates in the past
            className="pl-10 block w-full px-4 py-2.5 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm border border-gray-300"
          />
        </div>
      </div>
      
      {/* Form Actions - Updated with modern design */}
      <div className="flex justify-end space-x-3 pt-5 mt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submitForm}
          className="inline-flex justify-center items-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          {milestone ? 'Update Milestone' : 'Create Milestone'}
        </button>
      </div>
    </div>
  );
};

export default MilestoneForm;
