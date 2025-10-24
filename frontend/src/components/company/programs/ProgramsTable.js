import React from 'react';
import { Edit, Trash2, XCircle, FileText, Tag, Calendar, CheckCircle } from 'lucide-react';

export const ProgramsTableSkeleton = () => (
  <>
    {/* Desktop Table Skeleton */}
    <div className="hidden lg:block bg-white shadow overflow-hidden rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[...Array(6)].map((_, i) => (
                <th key={i} className="px-6 py-3 text-left">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {[...Array(6)].map((_, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Mobile/Tablet Card Skeleton */}
    <div className="lg:hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
            <div className="p-4">
              {/* Card Header - Program Info Skeleton */}
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200"></div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>

              {/* Card Content - Program Details Skeleton */}
              <div className="space-y-2">
                {/* Program Type Skeleton */}
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>

                {/* Loan Term Skeleton */}
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>

                {/* Availability Skeleton */}
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-5 w-12 bg-gray-200 rounded-full"></div>
                </div>
              </div>

              {/* Card Footer - Action Buttons Skeleton */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 h-8 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

const ProgramsTable = ({ programs, loading, error, onEdit, onDelete }) => {
  if (loading) {
    return <ProgramsTableSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white shadow overflow-hidden rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program Type</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Term</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Available to Borrower</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {programs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No loan programs found. Click "New Program" to create one.
                  </td>
                </tr>
              ) : (
                programs.map((program) => (
                  <tr key={program._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{program.programName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{program.displayName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{program.programType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{program.loanTerm} years</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center justify-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${program.isAvailableToBorrower ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {program.isAvailableToBorrower ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => onEdit(program._id)} className="text-blue-600 hover:text-blue-900" title="Edit program">
                          <Edit className="h-5 w-5" />
                        </button>
                        <button onClick={() => onDelete(program)} className="text-red-600 hover:text-red-900" title="Delete program">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden">
        {programs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">No loan programs found. Click "New Program" to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((program) => (
              <div
                key={program._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="p-4">
                  {/* Card Header - Program Info */}
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {program.programName}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {program.displayName}
                      </div>
                    </div>
                  </div>

                  {/* Card Content - Program Details */}
                  <div className="space-y-2">
                    {/* Program Type */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Tag className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>Type</span>
                      </div>
                      <div className="text-sm text-gray-900 capitalize">
                        {program.programType}
                      </div>
                    </div>

                    {/* Loan Term */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>Term</span>
                      </div>
                      <div className="text-sm text-gray-900">
                        {program.loanTerm} years
                      </div>
                    </div>

                    {/* Availability */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>Available</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${program.isAvailableToBorrower ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {program.isAvailableToBorrower ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer - Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEdit(program._id)}
                        className="flex-1 flex items-center justify-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium text-sm rounded-lg py-2 transition-all duration-200"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onDelete(program)}
                        className="flex-1 flex items-center justify-center text-red-600 hover:text-red-800 hover:bg-red-50 font-medium text-sm rounded-lg py-2 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ProgramsTable;
