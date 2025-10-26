import React from 'react';
import LoanSummaryCard from '../loan/LoanSummaryCard';
import BorrowerInfoCard from '../loan/BorrowerInfoCard';
import PropertyCard from '../loan/PropertyCard';
import FinancialInfoCard from '../loan/FinancialInfoCard';
import PropertiesOwnedCard from '../loan/PropertiesOwnedCard';
import MilitaryServiceCard from '../loan/MilitaryServiceCard';
import DemographicsCard from '../loan/DemographicsCard';
import DeclarationsCard from '../loan/DeclarationsCard';

const TabContent = ({ 
  activeTab, 
  loan, 
  formatCurrency, 
  formatDate 
}) => {
  return (
    <div className="flex-1 pb-20 lg:pb-0">
      {/* Overview Tab */}
      {activeTab === "overview" && (
        <LoanSummaryCard
          loan={loan}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Borrower Tab */}
      {activeTab === "borrower" && (
        <BorrowerInfoCard borrowerDetails={loan.borrowerDetails} />
      )}

      {/* Property Tab */}
      {activeTab === "property" && (
        <PropertyCard
          property={loan.property}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Financial Tab */}
      {activeTab === "financial" && (
        <div className="space-y-6">
          <FinancialInfoCard
            loan={loan}
            formatCurrency={formatCurrency}
          />
          <PropertiesOwnedCard
            loan={loan}
            formatCurrency={formatCurrency}
          />
        </div>
      )}

      {/* Declarations Tab */}
      {activeTab === "declarations" && (
        <div className="space-y-6">
          {loan.declarations && (
            <DeclarationsCard
              loan={loan}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      )}
      
      {activeTab === "demographics" && (
        <div className="space-y-6">
          {loan.demographics && <DemographicsCard loan={loan} />}
        </div>
      )}
      
      {/* Military Service Tab */}
      {activeTab === "military" && (
        <div className="space-y-6">
          {loan.militaryService && (
            <MilitaryServiceCard
              loan={loan}
              formatDate={formatDate}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default TabContent;
