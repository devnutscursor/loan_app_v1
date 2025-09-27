import React from 'react';

const CreditScoresDisplay = ({ loading, creditScores }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2 mx-auto"></div>
              <div className="h-8 bg-gray-200 rounded w-12 mb-2 mx-auto"></div>
              <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2 mx-auto"></div>
              <div className="h-8 bg-gray-200 rounded w-12 mb-2 mx-auto"></div>
              <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2 mx-auto"></div>
              <div className="h-8 bg-gray-200 rounded w-12 mb-2 mx-auto"></div>
              <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!creditScores || creditScores.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Credit Scores</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {creditScores.map((score, index) => (
          <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">{score.bureau}</p>
            <p className="text-2xl font-bold text-gray-900">{score.score}</p>
            <p className="text-xs text-gray-400">{score.model}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreditScoresDisplay;
