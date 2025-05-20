export const CalculationStatusSkeleton = () => (
  <div className="mb-6 animate-pulse">
    <div className="h-10 w-1/4 bg-gray-200 rounded mb-4"></div>
    <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
      <div className="h-16 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

export const PaymentBreakdownSkeleton = () => (
  <div className="mb-6 animate-pulse">
    <div className="h-10 w-1/4 bg-gray-200 rounded mb-4"></div>
    <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
      <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-16 bg-gray-200 rounded"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

export const FinancialSummarySkeleton = () => (
  <div className="mb-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-2/3"></div>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-2/3"></div>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  </div>
);

export const LoanDetailsSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/3 mb-5"></div>
    <div className="space-y-6">
      {[...Array(6)].map((_, i) => (
        <div key={i}>
          <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
    </div>
  </div>
);

export const ProgramGuidelinesSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-5"></div>
    <div className="space-y-6">
      <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i}>
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
    </div>
  </div>
);

export const SavingIndicator = () => (
  <div className="fixed bottom-4 right-4 bg-white shadow-md rounded-lg px-4 py-2 flex items-center z-50">
    <div className="w-4 h-4 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
    <span className="text-sm text-gray-700">Saving changes...</span>
  </div>
);