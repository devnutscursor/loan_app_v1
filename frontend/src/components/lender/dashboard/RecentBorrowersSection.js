import React from 'react';
import Link from 'next/link';
import { ChevronRight, Users } from 'lucide-react';
import BorrowerItem from './BorrowerItem';

const RecentBorrowersSection = ({ recentBorrowers, borrowerLoans }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Recent Borrowers</h2>
        <Link href="/lender/borrowers" className="text-sm font-medium text-blue-700 hover:text-blue-900 flex items-center">
          All <ChevronRight className="ml-0.5 h-4 w-4" />
        </Link>
      </div>

      {recentBorrowers.length > 0 ? (
        <div className="space-y-1">
          {recentBorrowers.slice(0, 4).map((borrower) => (
            <BorrowerItem 
              key={borrower._id} 
              borrower={borrower} 
              borrowerLoans={borrowerLoans} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Users className="mx-auto h-6 w-6 text-gray-400" />
          <h3 className="mt-1 text-sm font-medium text-gray-900">No borrowers yet</h3>
          <p className="mt-1 text-xs text-gray-500">Add your first borrower</p>
        </div>
      )}
    </div>
  );
};

export default RecentBorrowersSection;
