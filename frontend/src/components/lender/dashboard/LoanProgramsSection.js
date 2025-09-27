import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import ProgramItem from './ProgramItem';

const LoanProgramsSection = ({ programs }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Active Programs</h2>
        <Link href="/lender/programs" className="text-sm font-medium text-blue-700 hover:text-blue-900 flex items-center">
          View All <ChevronRight className="ml-0.5 h-4 w-4" />
        </Link>
      </div>

      {programs.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {programs.slice(0, 5).map((program) => (
            <ProgramItem key={program._id} program={program} />
          ))}
        </div>
      ) : (
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Home className="mx-auto h-6 w-6 text-gray-400" />
          <h3 className="mt-1 text-sm font-medium text-gray-900">No programs</h3>
          <p className="mt-1 text-xs text-gray-500">Create your first loan program</p>
        </div>
      )}
    </div>
  );
};

export default LoanProgramsSection;
