import React from 'react';
import MilitaryService from '../../forms/additional/MilitaryService';
import Declarations from '../../forms/declarations/Declarations';
import Demographics from '../../forms/declarations/Demographics';

const AdditionalInfo = ({ 
  loan, 
  handleFieldChange, 
  setLoan, 
  setHasUnsavedChanges 
}) => {
  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-md leading-6 font-medium text-gray-900">
            Military Service
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <MilitaryService
            militaryService={loan.militaryService || {}}
            onChange={(field, value) => {
              if (
                typeof field === "object" &&
                field.target
              ) {
                // Extract field name, removing any 'militaryService.' prefix
                const fieldName = field.target.name.replace(
                  "militaryService.",
                  ""
                );
                handleFieldChange(
                  "militaryService",
                  fieldName,
                  field.target.value
                );
              } else if (typeof field === "object") {
                // Handle case where entire object is passed
                setLoan((prev) => ({
                  ...prev,
                  militaryService: field,
                }));
                setHasUnsavedChanges(true);
              } else {
                handleFieldChange(
                  "militaryService",
                  field,
                  value
                );
              }
            }}
            userType="lender"
          />
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-md leading-6 font-medium text-gray-900">
            Declarations
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <Declarations
            declarations={loan.declarations || {}}
            onChange={(field, value) => {
              if (
                typeof field === "object" &&
                field.target
              ) {
                // Extract field name, removing any 'declarations.' prefix
                const fieldName = field.target.name.replace(
                  "declarations.",
                  ""
                );
                handleFieldChange(
                  "declarations",
                  fieldName,
                  field.target.value
                );
              } else if (typeof field === "object") {
                // Handle case where entire object is passed
                setLoan((prev) => ({
                  ...prev,
                  declarations: field,
                }));
                setHasUnsavedChanges(true);
              } else {
                handleFieldChange(
                  "declarations",
                  field,
                  value
                );
              }
            }}
            userType="lender"
          />
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-md leading-6 font-medium text-gray-900">
            Demographics
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <Demographics
            demographics={loan.demographics || {}}
            borrower={loan.borrowerDetails || {}}
            onChange={(field, value) => {
              if (
                typeof field === "object" &&
                field.target
              ) {
                // Extract field name, removing any 'demographics.' prefix
                const fieldName = field.target.name.replace(
                  "demographics.",
                  ""
                );
                handleFieldChange(
                  "demographics",
                  fieldName,
                  field.target.value
                );
              } else if (typeof field === "object") {
                // Handle case where entire object is passed
                setLoan((prev) => ({
                  ...prev,
                  demographics: field,
                }));
                setHasUnsavedChanges(true);
              } else {
                handleFieldChange(
                  "demographics",
                  field,
                  value
                );
              }
            }}
            userType="lender"
          />
        </div>
      </div>
    </>
  );
};

export default AdditionalInfo;
