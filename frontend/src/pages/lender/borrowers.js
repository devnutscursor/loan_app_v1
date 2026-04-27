import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useLenderBorrowers } from '../../hooks/lender/useLenderBorrowers';
import BorrowersHeader from '../../components/lender/borrowers/BorrowersHeader';
import BorrowersLoadingSkeleton from '../../components/lender/borrowers/BorrowersLoadingSkeleton';
import BorrowersErrorState from '../../components/lender/borrowers/BorrowersErrorState';
import BorrowersSearchAndFilters from '../../components/lender/borrowers/BorrowersSearchAndFilters';
import { NoBorrowers, NoResults } from '../../components/lender/borrowers/BorrowersEmptyStates';
import BorrowersTable from '../../components/lender/borrowers/BorrowersTable';
import ReferralLinkModal from '../../components/lender/borrowers/ReferralLinkModal';
import { toast } from 'react-hot-toast';
import { lenderService } from '../../services/api';

const LenderBorrowers = () => {
  const {
    borrowers,
    loading,
    error,
    lenderId,
    selectedBorrowerId,
    referralModalOpen,
    searchTerm,
    activeFilter,
    sortBy,
    sortDirection,
    borrowerLoans,
    filteredBorrowers,
    reloadBorrowers,
    handleShowReferralLink,
    handleCloseReferralModal,
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    formatDate,
    getSortIcon,
    clearFilters
  } = useLenderBorrowers();

  const handleLinkBorrowerToGhl = async (borrower) => {
    const borrowerId = borrower?._id;
    if (!borrowerId) return;
    try {
      const res = await lenderService.linkBorrowerContactToGhl(borrowerId);
      const ghlContactId = res?.data?.data?.ghlContactId || null;
      toast.success(ghlContactId ? `Linked to GHL (${ghlContactId})` : 'Linked to GHL');
      await reloadBorrowers();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to link borrower to GHL';
      toast.error(msg);
    }
  };

  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <BorrowersHeader onAddNew={() => handleShowReferralLink()} />

        {loading ? (
          <BorrowersLoadingSkeleton />
        ) : error ? (
          <BorrowersErrorState error={error} />
        ) : (
          <div className="space-y-6">
            <BorrowersSearchAndFilters
              searchTerm={searchTerm}
              activeFilter={activeFilter}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />

            {borrowers.length === 0 ? (
              <NoBorrowers onAddNew={() => handleShowReferralLink()} />
            ) : filteredBorrowers.length === 0 ? (
              <NoResults onClearFilters={clearFilters} />
            ) : (
              <BorrowersTable
                filteredBorrowers={filteredBorrowers}
                borrowerLoans={borrowerLoans}
                formatDate={formatDate}
                getSortIcon={getSortIcon}
                onSortChange={handleSortChange}
                onLinkToGhl={handleLinkBorrowerToGhl}
              />
            )}
          </div>
        )}
      </div>

      <ReferralLinkModal
        isOpen={referralModalOpen}
        onClose={handleCloseReferralModal}
        lenderId={lenderId}
        borrowerId={selectedBorrowerId}
      />
    </MainLayout>
  );
};

export default LenderBorrowers;
