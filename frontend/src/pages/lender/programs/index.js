import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { useLenderPrograms } from '@/hooks/lender/useLenderPrograms';
import ProgramsHeader from '@/components/lender/programs/ProgramsHeader';
import ProgramsLoadingSkeleton from '@/components/lender/programs/ProgramsLoadingSkeleton';
import ProgramsErrorState from '@/components/lender/programs/ProgramsErrorState';
import ProgramsTable from '@/components/lender/programs/ProgramsTable';
import ProgramsNotification from '@/components/lender/programs/ProgramsNotification';

export default function LoanPrograms() {
  const {
    programs,
    loading,
    error,
    success,
    successMessage,
    deleteDialog,
    programToDelete,
    setDeleteDialog,
    setProgramToDelete,
    handleCreateProgram,
    handleViewProgram,
    handleCloseSnackbar,
    navigateToRates
  } = useLenderPrograms();

  return (
    <ProtectedRoute allowedRoles={['lender']}>
      <MainLayout>
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <ProgramsHeader onNavigateToRates={navigateToRates} />

          {loading ? (
            <ProgramsLoadingSkeleton />
          ) : error ? (
            <ProgramsErrorState error={error} />
          ) : (
            <ProgramsTable 
              programs={programs} 
              onViewProgram={handleViewProgram} 
            />
          )}
        </div>

        <ProgramsNotification
          success={success}
          error={error}
          successMessage={successMessage}
          onClose={handleCloseSnackbar}
        />
      </MainLayout>
    </ProtectedRoute>
  );
}
