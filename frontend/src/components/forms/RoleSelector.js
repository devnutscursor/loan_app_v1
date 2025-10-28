import React from 'react';

const RoleSelector = ({ formData, handleChange }) => {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          User Type
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="lender">Loan Officer</option>
          <option value="company">Lender</option>
        </select>
      </div>
    </div>
  );
};

export default RoleSelector;
