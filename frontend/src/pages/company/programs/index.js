import { useCompanyProgramsIndex } from '@/hooks/company/useCompanyProgramsIndex';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import ProgramsHeader from '@/components/company/programs/ProgramsHeader';
import ProgramsTable from '@/components/company/programs/ProgramsTable';
import DeleteConfirmationModal from '@/components/company/programs/DeleteConfirmationModal';
import NotificationToast from '@/components/company/programs/NotificationToast';
// ... existing imports ...

export default function CompanyLoanPrograms() {
  const {
    router,
    programs,
    loading,
    error,
    success,
    successMessage,
    deleteDialog,
    programToDelete,
    handleCreateProgram,
    handleEditProgram,
    handleDeleteClick,
    handleDeleteConfirm,
    handleCloseSnackbar,
    navigateToRates,
    setDeleteDialog,
  } = useCompanyProgramsIndex();

  return (
    <ProtectedRoute allowedRoles={['company']}>
      <MainLayout>
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <ProgramsHeader onManageRates={navigateToRates} onCreateProgram={handleCreateProgram} />

        <ProgramsTable
          programs={programs}
          loading={loading}
          error={error}
          onEdit={handleEditProgram}
          onDelete={handleDeleteClick}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationModal
        open={deleteDialog}
        programName={programToDelete?.programName}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog(false)}
      />

      {/* Success/Error notification */}
      <NotificationToast
        open={success || !!error}
        success={success}
        message={success ? successMessage : error}
        onClose={handleCloseSnackbar}
      />
    </MainLayout>
    </ProtectedRoute>
  );
}
