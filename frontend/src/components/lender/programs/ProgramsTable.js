import React from 'react';
import { Eye, FileText, Calendar, Tag, CheckCircle, XCircle } from 'lucide-react';
import { getLoanProgramDisplayLabel } from '@/utils/programType';

const ProgramsTable = ({ programs, onViewProgram }) => {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white shadow overflow-hidden rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Display Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Term
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available to Borrower
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {program.programName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {program.displayName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {program.programType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {program.loanTerm} years
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${program.isAvailableToBorrower
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}>
                        {program.isAvailableToBorrower ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onViewProgram(program._id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View program details"
                        >
                          <Eye className="h-5 w-5" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-gray-500 text-sm">
                No loan programs found. Click "New Program" to create one.
              </div>
            </div>
          ) : (
            programs.map((program) => (
              <div
                key={program._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="p-4">
                  {/* Card Header - Program Name */}
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {program.programName}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {getLoanProgramDisplayLabel(program)}
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
                      <div className="text-sm text-gray-900 font-medium capitalize">
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

                    {/* Available to Borrower */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        {program.isAvailableToBorrower ? (
                          <CheckCircle className="flex-shrink-0 mr-1.5 h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        )}
                        <span>Available</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${program.isAvailableToBorrower
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}>
                        {program.isAvailableToBorrower ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer - Action Button */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => onViewProgram(program._id)}
                      className="w-full flex items-center justify-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium text-sm rounded-lg py-2 transition-all duration-200"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default ProgramsTable;
