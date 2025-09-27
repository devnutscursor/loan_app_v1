import React from 'react';

const PageHeader = () => {
  return (
    <div className="mb-8 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">
          Manage all users in the system including borrowers, lenders, and admins
        </p>
      </div>
    </div>
  );
};

export default PageHeader;
