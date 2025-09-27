import React from "react";

const UserStatistics = ({ users }) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">User Statistics</h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-500">Borrowers</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{users.borrowers}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-500">Companies</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{users.companies}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-500">Lenders</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{users.lenders}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStatistics;