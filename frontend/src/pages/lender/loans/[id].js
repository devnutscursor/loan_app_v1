import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import Link from "next/link";
import MainLayout from "../../../components/layout/MainLayout";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import { lenderService, companyService } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import loanService from "../../../services/loan.service";
import LoanDashboard from "../../../components/lender/loans/LoanDashboard";
import { MessageCircle, StickyNote, Download, Settings, FileText, CreditCard, Menu } from "lucide-react";
import {  StandardFonts } from 'pdf-lib';
import {
  BarChart2,
  User,
  Home,
  Wallet,
  ClipboardList, // or ClipboardCheck if you prefer
  Files, // instead of FileStack
  Trophy, // or Flag if you prefer
  FileSpreadsheet, // For Application tab icon
  CalendarClock, // For Audit & Dates tab
  DollarSign, // For Funding / Revenue tab
  ShieldCheck, // For MCR Data Audit tab
  SlidersHorizontal, // For Products & Pricing tab
} from "lucide-react";
// MCR Tab Components
import AuditDatesTab from "../../../components/lender/loans/mcr/AuditDatesTab";
import FundingRevenueTab from "../../../components/lender/loans/mcr/FundingRevenueTab";
import MCRDataAuditTab from "../../../components/lender/loans/mcr/MCRDataAuditTab";
// Form components for editing
import PersonalDetails from "../../../components/forms/borrower/PersonalDetails";
import ResidenceHistory from "../../../components/forms/borrower/ResidenceHistory";
import PropertyInformation from "../../../components/forms/property/PropertyInformation";
import LoanDetailsForm from "../../../components/forms/property/LoanDetails";
import EmploymentHistory from "../../../components/forms/borrower/EmploymentHistory";
import Income from "../../../components/forms/financial/Income";
import Debts from "../../../components/forms/financial/Debts";
import Assets from "../../../components/forms/financial/Assets";
import PropertyOwned from "../../../components/forms/additional/PropertyOwned";

// Import document components
import DocumentsCard from "../../../components/borrower/loan/DocumentsCard";
import LenderDocumentRequirements from "../../../components/lender/documents/LenderDocumentRequirements";
import BorrowerScenarioTailwind from "../../../components/lender/loans/BorrowerScenarioTailwind";
import LoanMilestones from "../../../components/lender/loans/LoanMilestones";
import VerticalTabNavigation from "../../../components/lender/loans/VerticalTabNavigation";
import MobileExpandableNavigation from "../../../components/lender/loans/MobileExpandableNavigation";
import LoanDetailsSkeleton from "../../../components/lender/loans/LoanDetailsSkeleton";
import AdditionalInfo from "../../../components/lender/loans/AdditionalInfo";
import LoanApplicationSettingsModal from "../../../components/lender/loans/LoanApplicationSettingsModal";
import LoanMessagesPanel from "../../../components/lender/messages/LoanMessagesPanel";
import ProductsPricingTab from "../../../components/lender/loans/ProductsPricingTab";
import { PPE_ENABLED } from "../../../config/featureFlags";
import { PDFDocument } from "pdf-lib";
import { generateMismoXml, downloadXmlFile } from "../../../utils/xmlGenerator";
import NoteModal from "../../../components/common/NoteModal";
import customAxios from '../../../utils/axios';
// Settings is now properly imported above with other icons

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount
  );

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export async function generateURLAPdf(borrowerDetails,assets,income,debts,propertiesOwned,loanDetails,property,declarations,demographics) {
  const formUrl = '/forms/URLA.pdf';
  const existingPdfBytes = await fetch(formUrl).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();
  console.log("---------------------------------------")
  console.log("Generating URLA PDF with borrower details:", borrowerDetails);
  console.log("------------------------")

  // Helper function to safely set text field values
  const safeSetText = (fieldName, value, maxLength = 100) => {
    try {
      const field = form.getTextField(fieldName);
      // Ensure value is a string and truncated to max length
      const safeValue = String(value || '').substring(0, maxLength);
      field.setText(safeValue);
    } catch (e) {
      console.log(`Error setting field ${fieldName}: ${e.message}`);
    }
  };
  
  // Helper function to safely select dropdown values
  const safeSelectDropdown = (fieldName, value) => {
    try {
      const field = form.getDropdown(fieldName);
      field.select(value);
      return true;
    } catch (e) {
      console.log(`Error selecting dropdown ${fieldName}: ${e.message}`);
      return false;
    }
  };
  
  // Helper function to safely select radio button values
  const safeSelectRadio = (groupName, value) => {
    try {
      const field = form.getRadioGroup(groupName);
      field.select(value);
      return true;
    } catch (e) {
      console.log(`Error selecting radio group ${groupName}: ${e.message}`);
      return false;
    }
  };
  
  // Helper function to safely check/uncheck checkboxes
  const safeSetCheckBox = (fieldName, checked) => {
    try {
      const field = form.getCheckBox(fieldName);
      if (checked) {
        field.check();
      } else {
        field.uncheck();
      }
      return true;
    } catch (e) {
      console.log(`Error setting checkbox ${fieldName}: ${e.message}`);
      return false;
    }
  };
  
  // --- Personal Info ---
  const fullName = `${borrowerDetails.firstName || ''} ${borrowerDetails.middleName || ''} ${borrowerDetails.lastName || ''} ${borrowerDetails.suffix || ''}`.trim();
  safeSetText('3', fullName);
  safeSetText('topmostSubform[0].Page1[0]._1a_Borrower_s_Name[0]', fullName);
  //set alternate name of borrower altname
  safeSetText('4', borrowerDetails.alternateName || '');

  
  safeSetText('topmostSubform[0].Page1[0]._1a_Email[0]', borrowerDetails.email || '');
  safeSetText('topmostSubform[0].Page1[0]._1a_Dependents[0]', (borrowerDetails.dependents?.length || 0).toString());
  safeSetText('topmostSubform[0].Page1[0]._1a_Dependent_Age[0]', (borrowerDetails.dependents || []).map(d => d.age).join(', '));
  safeSetText('topmostSubform[0].Page1[0].credit[0].joint[0]._1a_Initials[0]', (borrowerDetails.suffix || ''));
  //count the number of borrowers
  const numberOfBorrowers = borrowerDetails?.borrowers?.length || 1; // Default to 1 if not specified
  safeSetText('topmostSubform[0].Page1[0].credit[0].joint[0]._1a_Borrowers_Number[0]', numberOfBorrowers.toString());

  // Date of Birth
  if (borrowerDetails.dateOfBirth) {
    const dob = new Date(borrowerDetails.dateOfBirth);
    safeSetText('topmostSubform[0].Page1[0]._1a_Birth_1[0]', String(dob.getMonth() + 1).padStart(2, '0'), 2);
    safeSetText('topmostSubform[0].Page1[0]._1a_Birth_2[0]', String(dob.getDate()).padStart(2, '0'), 2);
    safeSetText('topmostSubform[0].Page1[0]._1a_Birth_3[0]', String(dob.getFullYear()), 4);
  }
  
  // Phone
  const phone = (borrowerDetails.phone || '').replace(/\D/g, '').padEnd(10, '0');
  safeSetText('topmostSubform[0].Page1[0]._1a_PhoneH1[0]', phone.slice(0, 3), 3);
  safeSetText('topmostSubform[0].Page1[0]._1a_PhoneH2[0]', phone.slice(3, 6), 3);
  safeSetText('topmostSubform[0].Page1[0]._1a_PhoneH3[0]', phone.slice(6, 10), 4);
  
  // SSN
  if (borrowerDetails.ssn) {
    const ssn = borrowerDetails.ssn.replace(/\D/g, '').padEnd(9, '0');
    try {
      form.getTextField('5').setText(ssn.slice(0, 2));
      form.getTextField('6').setText(ssn.slice(2, 6));
      form.getTextField('7').setText(ssn.slice(6, 10));
    } catch (e) {
      console.log('Error setting SSN fields:', e.message);
    }
  }
  
  // Citizenship
  if (borrowerDetails.citizenship) {
    const citizenshipGroup = form.getRadioGroup('Group1');
    let citizenshipOption;
    switch (borrowerDetails.citizenship.toLowerCase()) {
      case 'uscitizen':
        citizenshipOption = 'U.S. Citizen';
        break;
      case 'permanentresident':
        citizenshipOption = 'Permanent Resident Alien';
        break;
      case 'nonpermanentresident':
        citizenshipOption = 'Non-Permanent Resident Alien';
        break;
      default:
        citizenshipOption = 'Non-Permanent Resident Alien'; // Default fallback
    }
    citizenshipGroup.select(citizenshipOption);
  }
  
  // Marital Status
  if (borrowerDetails.maritalStatus) {
    const maritalGroup = form.getRadioGroup('Group3');
    let maritalOption;
    switch (borrowerDetails.maritalStatus.toLowerCase()) {
      case 'married':
        maritalOption = 'Married';
        break;
      case 'separated':
        maritalOption = 'Separated';
        break;
      case 'unmarried':
        maritalOption = 'Unmarried';
        break;
      default:
        maritalOption = 'Unmarried'; // Default fallback
    }
    maritalGroup.select(maritalOption);
  }

  // --- Current Address ---
  const curr = borrowerDetails.currentAddress || {};
  form.getTextField('topmostSubform[0].Page1[0]._1a_Address_St[0]').setText((curr.streetAddress || '').substring(0, 50));
  form.getTextField('topmostSubform[0].Page1[0]._1a_Address_Unit[0]').setText((curr.aptSteNum || '').substring(0, 5));
  form.getTextField('topmostSubform[0].Page1[0]._1a_Address_City[0]').setText((curr.city || '').substring(0, 35));
  if (curr.state) form.getDropdown('topmostSubform[0].Page1[0]._1a_Address_State[0]').select(curr.state);
  form.getTextField('topmostSubform[0].Page1[0]._1a_Address_Zip[0]').setText(curr.zipCode || '');
  form.getTextField('topmostSubform[0].Page1[0]._1a_Address_Country[0]').setText('USA');
  
  //years and months at address
  const yearsAtAddress = curr.yearsAtAddress || 0;
  const monthsAtAddress = curr.monthsAtAddress || 0;
  safeSetText('Text1', String(yearsAtAddress || 0), 2);
  safeSetText('Text2', String(monthsAtAddress || 0), 2);
  
  //rent (it will be get from property details)
  const rent = propertiesOwned?.rent || 0;
  safeSetText('topmostSubform[0].Page1[0].housing_current[0].rent[0]._1a_Address_Rent[0]', rent ? String(rent) : '0', 20);
  
  //RADIO BUTTON FOR CURRENT ADDRESS
  if(propertiesOwned.ownsProperty && propertiesOwned.rent == 0) {
    form.getRadioGroup('Group5').select('No primary housing expense');
  } else {
    if(propertiesOwned.ownsProperty) {
      form.getRadioGroup('Group5').select('Own');
    } else {
      form.getRadioGroup('Group5').select('Rent');
    }
  }

  // Check if the user has been at the current address for less than 2 years
  if (yearsAtAddress < 2) {
    // Uncheck the "Does Not Apply" checkbox if user has been at the current address for less than 2 years
    form.getCheckBox('topmostSubform[0].Page1[0]._1a_Does_Not_Apply1[0]').uncheck();
  } else {
    // Check the "Does Not Apply" checkbox if the user has been at the current address for 2 or more years
    form.getCheckBox('topmostSubform[0].Page1[0]._1a_Does_Not_Apply1[0]').check();
  }

  // --- Previous Address (first one) ---
  const prev = (borrowerDetails.previousAddresses || [])[0] || {};
  if (Object.keys(prev).length > 0 && yearsAtAddress < 2) {
    form.getTextField('topmostSubform[0].Page1[0]._1a_FormerAddress_St[0]').setText((prev.streetAddress || '').substring(0, 50));
    form.getTextField('topmostSubform[0].Page1[0]._1a_Former_Address_Unit[0]').setText((prev.aptSteNum || '').substring(0, 5));
    form.getTextField('topmostSubform[0].Page1[0]._1a_Former_Address_City[0]').setText((prev.city || '').substring(0, 35));
    if (prev.state) form.getDropdown('topmostSubform[0].Page1[0]._1a_Former_Address_State[0]').select(prev.state);
    form.getTextField('topmostSubform[0].Page1[0]._1a_Former_Address_Zip[0]').setText(prev.zipCode || '');
    form.getTextField('topmostSubform[0].Page1[0]._1a_Former_Address_Country[0]').setText('USA');
    
    // Years and months at previous address
    const prevYears = prev.yearsAtAddress || 0;
    const prevMonths = prev.monthsAtAddress || 0;
    safeSetText('How long in this line of work1', String(prevYears || 0), 2);
    safeSetText('How long in this line of work2', String(prevMonths || 0), 2);
    
    // Set housing type for previous address
    // This might need adjustment based on your data structure
    form.getRadioGroup('Group7').select('Rent');
  }

  // --- Mailing Address ---
  const mail = borrowerDetails.mailingAddress || {};
  if (mail.sameAsCurrentAddress) {
    form.getCheckBox('topmostSubform[0].Page1[0]._1a_Does_Not_Apply2[0]').check();
  } else {
    form.getCheckBox('topmostSubform[0].Page1[0]._1a_Does_Not_Apply2[0]').uncheck();
    form.getTextField('topmostSubform[0].Page1[0]._1a_Mail_Address_St[0]').setText((mail.streetAddress || '').substring(0, 50));
    form.getTextField('topmostSubform[0].Page1[0]._1a_Mail_Address_Unit[0]').setText((mail.aptSteNum || '').substring(0, 5));
    form.getTextField('topmostSubform[0].Page1[0]._1a_Mail_Address_City[0]').setText((mail.city || '').substring(0, 35));
    if (mail.state) form.getDropdown('topmostSubform[0].Page1[0]._1a_Mail_Address_State[0]').select(mail.state);
    form.getTextField('topmostSubform[0].Page1[0]._1a_Mail_Address_Zip[0]').setText(mail.zipCode || '');
    form.getTextField('topmostSubform[0].Page1[0]._1a_Mail_Address_Country[0]').setText('USA');
  }

  // --- Employer (first one) ---
  const emp = (borrowerDetails.employers || [])[0] || {};
  if (Object.keys(emp).length > 0) {
    form.getCheckBox('topmostSubform[0].Page1[0]._1b_Does_Not_Apply1[0]').uncheck();
    safeSetText('topmostSubform[0].Page1[0]._1b_Employer[0]', emp.companyName || '', 40);
    
    // Format phone
    const empPhone = (emp.companyPhone || '').replace(/\D/g, '').padEnd(10, '0');
    safeSetText('topmostSubform[0].Page1[0]._1b_PhoneE1[0]', empPhone.slice(0, 3), 3);
    safeSetText('topmostSubform[0].Page1[0]._1b_PhoneE2[0]', empPhone.slice(3, 6), 3);
    safeSetText('topmostSubform[0].Page1[0]._1b_PhoneE3[0]', empPhone.slice(6, 10), 4);
    
    safeSetText('topmostSubform[0].Page1[0]._1b_Position[0]', emp.jobTitle || '', 35);
    
    // Start date
    if (emp.startDate) {
      const startDate = new Date(emp.startDate);
      safeSetText('topmostSubform[0].Page1[0]._1b_Employment_Start_Month[0]', String(startDate.getMonth() + 1).padStart(2, '0'), 2);
      safeSetText('topmostSubform[0].Page1[0]._1b_Employment_Start_Day[0]', String(startDate.getDate()).padStart(2, '0'), 2);
      safeSetText('topmostSubform[0].Page1[0]._1b_Employment_Start_Year[0]', String(startDate.getFullYear()), 4);
    }
    
    // Address
    form.getTextField('topmostSubform[0].Page1[0]._1b_Address[0]').setText((emp.streetAddress || '').substring(0, 50));
    form.getTextField('topmostSubform[0].Page1[0]._1b_Unit[0]').setText((emp.aptSteNum || '').substring(0, 5));
    form.getTextField('topmostSubform[0].Page1[0]._1b_City[0]').setText((emp.city || '').substring(0, 35));
    if (emp.state) form.getDropdown('topmostSubform[0].Page1[0]._1b_State[0]').select(emp.state);
    form.getTextField('topmostSubform[0].Page1[0]._1b_Zip[0]').setText(emp.zipCode || '');
    form.getTextField('topmostSubform[0].Page1[0]._1b_Country[0]').setText('USA');
    
    // Years and months in profession
    if (emp.yearsInProfession || emp.monthsInProfession) {
      safeSetText('Text6', String(emp.yearsInProfession || 0), 2);
      safeSetText('Text7', String(emp.monthsInProfession || 0), 2);
    }
    
    // Income fields
    if (income) {
      safeSetText('topmostSubform[0].Page1[0]._1b_Base[0]', String(income.baseIncome || 0), 20);
      safeSetText('topmostSubform[0].Page1[0]._1b_Overtime[0]', String(income.overtime || 0), 20);
      safeSetText('topmostSubform[0].Page1[0]._1b_Bonus[0]', String(income.bonuses || 0), 20);
      safeSetText('topmostSubform[0].Page1[0]._1b_Commission[0]', String(income.commissions || 0), 20);
      safeSetText('topmostSubform[0].Page1[0]._1b_Military[0]', String(income.militaryEntitlements || 0), 20);
      
      // Calculate total income
      const totalIncome = 
        (parseFloat(income.baseIncome) || 0) +
        (parseFloat(income.overtime) || 0) +
        (parseFloat(income.bonuses) || 0) +
        (parseFloat(income.commissions) || 0) +
        (parseFloat(income.militaryEntitlements) || 0);
      
      safeSetText('topmostSubform[0].Page1[0]._1b_IncomeTotal[0]', totalIncome.toFixed(2), 20);
    }
    
    // Self-employed checkbox
    if (emp.employmentStatus && emp.employmentStatus.toLowerCase().includes('self')) {
      form.getCheckBox('topmostSubform[0].Page1[0]._1b_Owner[0]').check();
    }
  } else {
    form.getCheckBox('topmostSubform[0].Page1[0]._1b_Does_Not_Apply1[0]').check();
  }

  // --- Employer (second) or Does Not Apply ---
  const employers = borrowerDetails.employers || [];
  if (employers.length <= 1) {
    // Only one or no employer, check Does Not Apply for employer 2
    form.getCheckBox('topmostSubform[0].Page2[0]._1c_Does_Not_Apply[0]').check();
  } else if (employers.length > 1) {
    // Fill employer 2 fields (index 1)
    form.getCheckBox('topmostSubform[0].Page2[0]._1c_Does_Not_Apply[0]').uncheck();
    const emp2 = employers[1];
    safeSetText('topmostSubform[0].Page2[0]._1c_Employer[0]', emp2.companyName || '', 40);
    
    // Format phone
    const emp2Phone = (emp2.companyPhone || '').replace(/\D/g, '').padEnd(10, '0');
    safeSetText('topmostSubform[0].Page2[0]._1c_PhoneE1[0]', emp2Phone.slice(0, 3), 3);
    safeSetText('topmostSubform[0].Page2[0]._1c_PhoneE2[0]', emp2Phone.slice(3, 6), 3);
    safeSetText('topmostSubform[0].Page2[0]._1c_PhoneE3[0]', emp2Phone.slice(6, 10), 4);
    
    safeSetText('topmostSubform[0].Page2[0]._1c_Position[0]', emp2.jobTitle || '', 35);
    
    // Start date
    if (emp2.startDate) {
      const start2Date = new Date(emp2.startDate);
      safeSetText('topmostSubform[0].Page2[0]._1c_Employment_Start_Month[0]', String(start2Date.getMonth() + 1).padStart(2, '0'), 2);
      safeSetText('topmostSubform[0].Page2[0]._1c_Employment_Start_Day[0]', String(start2Date.getDate()).padStart(2, '0'), 2);
      safeSetText('topmostSubform[0].Page2[0]._1c_Employment_Start_Year[0]', String(start2Date.getFullYear()), 4);
    }
    
    // Address
    form.getTextField('topmostSubform[0].Page2[0]._1c_Address[0]').setText((emp2.streetAddress || '').substring(0, 50));
    form.getTextField('topmostSubform[0].Page2[0]._1c_Unit[0]').setText((emp2.aptSteNum || '').substring(0, 5));
    form.getTextField('topmostSubform[0].Page2[0]._1c_City[0]').setText((emp2.city || '').substring(0, 35));
    if (emp2.state) form.getDropdown('topmostSubform[0].Page2[0]._1c_State[0]').select(emp2.state);
    form.getTextField('topmostSubform[0].Page2[0]._1c_Zip[0]').setText(emp2.zipCode || '');
    form.getTextField('topmostSubform[0].Page2[0]._1c_Country[0]').setText('USA');
    
    // Self-employed checkbox
    if (emp2.employmentStatus && emp2.employmentStatus.toLowerCase().includes('self')) {
      form.getCheckBox('topmostSubform[0].Page2[0]._1c_Owner[0]').check();
    }
  }

  // check doesnot apply box in 1d portion in our form as it is not applicable for us
  form.getCheckBox('topmostSubform[0].Page2[0]._1d_Does_Not_Apply[0]').check();


  // --- Income (Other Monthly Income Table) ---
  if (income && income.otherIncome && income.otherIncome.length > 0) {
    form.getCheckBox('topmostSubform[0].Page2[0]._1e_Does_Not_Apply[0]').uncheck();
    
    // Get all income sources
    const otherIncomeItems = income.otherIncome || [];
    
    // Fill up to 3 rows of other income
    for (let i = 0; i < Math.min(otherIncomeItems.length, 3); i++) {
      const idx = i + 1;
      const item = otherIncomeItems[i];
      
      // Select appropriate income type based on description or source
      let incomeType = 'Other';
      if (item.description) {
        const desc = item.description.toLowerCase();
        if (desc.includes('alimony') || desc.includes('child support')) {
          incomeType = 'Alimony/Child Support';
        } else if (desc.includes('rental') || desc.includes('rent')) {
          incomeType = 'Rental';
        } else if (desc.includes('trust')) {
          incomeType = 'Trust';
        } else if (desc.includes('dividend') || desc.includes('interest')) {
          incomeType = 'Interest and Dividends';
        }
      }
      
      // Select income type in dropdown
      form.getDropdown(`topmostSubform[0].Page2[0].Table1[0].T1R${idx}[0]._1e_Income_Other_Sources${idx}[0]`).select(incomeType);
      
      // Set income amount
      form.getTextField(`topmostSubform[0].Page2[0].Table1[0].T1R${idx}[0]._1e_Other_Monthly_Income${idx}[0]`).setText(item.amount ? String(item.amount) : '0');
    }
    
    // Calculate total other monthly income
    const totalOtherIncome = otherIncomeItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    form.getTextField('topmostSubform[0].Page2[0].Table1[0].T1R4[0]._1e_Total_Other_Monthly_Income[0]').setText(totalOtherIncome.toFixed(2));
  } else {
    form.getCheckBox('topmostSubform[0].Page2[0]._1e_Does_Not_Apply[0]').check();
  }




  // --- Assets (Checking/Savings, Gifts/Grants, Stocks/Bonds, Miscellaneous) ---
  if (assets && (assets.checkingAndSavings?.length > 0 || 
                assets.giftsAndGrants?.length > 0 || 
                assets.stocksAndBonds?.length > 0 ||
                Object.values(assets.miscellaneous || {}).some(val => val > 0))) {
    
    //form.getCheckBox('topmostSubform[0].Page3[0]._2a_Does_Not_Apply[0]').uncheck();
    
    const assetRows = [];
    
    // Checking & Savings
    (assets.checkingAndSavings || []).forEach(a => {
      assetRows.push({
        type: a.accountType || 'Checking',
        financial: a.bankName || '',
        account: a.accountNumber || '',
        value: a.value || ''
      });
    });
    
    // Gifts & Grants
    (assets.giftsAndGrants || []).forEach(a => {
      assetRows.push({
        type: a.assetType || 'Gift',
        financial: a.source || '',
        account: '',
        value: a.value || ''
      });
    });
    
    // Stocks & Bonds
    (assets.stocksAndBonds || []).forEach(a => {
      assetRows.push({
        type: 'Bonds',
        financial: '',
        account: a.description || '',
        value: a.value || ''
      });
    });
    
    // Miscellaneous (map each as a separate row)
    const misc = assets.miscellaneous || {};
    if (misc.earnestMoney) assetRows.push({ type: 'Earnest Money', financial: '', account: '', value: misc.earnestMoney });
    if (misc.lifeInsurance) assetRows.push({ type: 'Life Insurance', financial: '', account: '', value: misc.lifeInsurance });
    if (misc.otherAssets) assetRows.push({ type: 'Other', financial: '', account: '', value: misc.otherAssets });
    if (misc.vestedInterestInRetirement) assetRows.push({ type: 'Retirement', financial: '', account: '', value: misc.vestedInterestInRetirement });
    
    // Fill up to 5 rows
    for (let i = 0; i < Math.min(assetRows.length, 5); i++) {
      const idx = i + 1;
      const row = assetRows[i] || {};
      
      // Set account type in dropdown
      try {
        form.getDropdown(`topmostSubform[0].Page3[0].Table2a[0].TR${idx}[0]._2a_Account_Type${idx}[0]`).select(row.type || '');
      } catch (e) {
        console.log(`Could not set account type dropdown for row ${idx}: ${e.message}`);
      }
      
      // Set other fields
      form.getTextField(`topmostSubform[0].Page3[0].Table2a[0].TR${idx}[0]._2a_Financial${idx}[0]`).setText(row.financial || '');
      form.getTextField(`topmostSubform[0].Page3[0].Table2a[0].TR${idx}[0]._2a_Account${idx}[0]`).setText(row.account || '');
      form.getTextField(`topmostSubform[0].Page3[0].Table2a[0].TR${idx}[0]._2a_Cash${idx}[0]`).setText(row.value ? String(row.value) : '');
    }
    
    // Set total cash field
    const totalAssets = assetRows.reduce((sum, row) => sum + (parseFloat(row.value) || 0), 0);
    form.getTextField('topmostSubform[0].Page3[0].Table2a[0].TR6[0]._2a_Total_Cash[0]').setText(totalAssets.toFixed(2));
  } 

  // Check 'Does Not Apply' for section 2b (Other Assets)
  form.getCheckBox('topmostSubform[0].Page3[0]._2b_Does_Not_Apply[0]').check();

  // --- Debts (Liabilities) ---
  if (debts && debts.length > 0) {
    form.getCheckBox('topmostSubform[0].Page3[0]._2c_Does_Not_Apply[0]').uncheck();
    
    // Fill up to 5 debt rows
    for (let i = 0; i < Math.min(debts.length, 5); i++) {
      const idx = i + 1;
      const debt = debts[i];
      
      // Set account type based on debt creditor name or type
      let accountType = 'Other';
      if (debt.creditor) {
        const creditorName = debt.creditor.toLowerCase();
        if (creditorName.includes('car') || creditorName.includes('auto') || creditorName.includes('vehicle')) {
          accountType = 'Automobile';
        } else if (creditorName.includes('credit') || creditorName.includes('card')) {
          accountType = 'Credit Card';
        } else if (creditorName.includes('student') || creditorName.includes('education')) {
          accountType = 'Student Loan';
        } else if (creditorName.includes('mortgage') || creditorName.includes('home')) {
          accountType = 'Mortgage';
        } else if (creditorName.includes('personal')) {
          accountType = 'Personal Loan';
        }
      }
      
      try {
        form.getDropdown(`topmostSubform[0].Page3[0].Table2c[0].TR${idx}[0]._2c_Account_Type${idx}[0]`).select(accountType);
      } catch (e) {
        console.log(`Could not set account type dropdown for debt ${idx}: ${e.message}`);
      }
      
      // Company (Creditor)
      form.getTextField(`topmostSubform[0].Page3[0].Table2c[0].TR${idx}[0]._2c_Company${idx}[0]`).setText(debt.creditor || '');
      
      // Account number
      form.getTextField(`topmostSubform[0].Page3[0].Table2c[0].TR${idx}[0]._2c_Account${idx}[0]`).setText(debt.id || '');
      
      // Unpaid Balance
      form.getTextField(`topmostSubform[0].Page3[0].Table2c[0].TR${idx}[0]._2c_Unpaid${idx}[0]`).setText(debt.balance ? String(debt.balance) : '0');
      
      // Monthly Payment
      form.getTextField(`topmostSubform[0].Page3[0].Table2c[0].TR${idx}[0]._2c_Monthly${idx}[0]`).setText(debt.monthlyPayment ? String(debt.monthlyPayment) : '0');
      
      // Paid Off checkbox
      if (debt.paidAtClosing) {
        form.getCheckBox(`topmostSubform[0].Page3[0].Table2c[0].TR${idx}[0]._2c_Paid_Off${idx}[0]`).check();
      } else {
        form.getCheckBox(`topmostSubform[0].Page3[0].Table2c[0].TR${idx}[0]._2c_Paid_Off${idx}[0]`).uncheck();
      }
    }
  } else {
    form.getCheckBox('topmostSubform[0].Page3[0]._2c_Does_Not_Apply[0]').check();
  }
  
  // Other liabilities section (alimony, child support, etc.)
  form.getCheckBox('topmostSubform[0].Page3[0]._2d_Does_Not_Apply[0]').check();


  

  



  // --- Property Information (Page 5) ---
  if (loanDetails && property) {
    // Property You Own Section - Handle Section 3a
    try {
      // Check if the borrower owns any real estate
      const ownsProperty = propertiesOwned && (propertiesOwned.ownsProperty === true || (propertiesOwned.properties && propertiesOwned.properties.length > 0));
      
      // Set the "I do not own any real estate" checkbox based on whether the borrower owns property
      if (ownsProperty) {
        form.getCheckBox('topmostSubform[0].Page4[0]._3_Do_Not_Own[0]').uncheck();
        
        // Populate Property Address fields with primary property data - Section 3a shown in the image
        // This corresponds to the fields in the PDF form showing "Property You Own"
        try {
          console.log("Populating 'Property You Own' Section 3a of the URLA PDF");
        } catch (e) {
          console.log("Error adding log for Property section:", e.message);
        }
        
        // Use the property data from propertiesOwned.properties[0] if available
        const propertyToUse = propertiesOwned && propertiesOwned.properties && propertiesOwned.properties.length > 0 
            ? propertiesOwned.properties[0].propertyAddress 
            : (property.address || {});
            
        // Set address fields
        safeSetText('topmostSubform[0].Page4[0]._3a_Address_St[0]', (propertyToUse.streetAddress || '').substring(0, 50), 50);
        safeSetText('topmostSubform[0].Page4[0]._3a_Address_Unit[0]', (propertyToUse.aptSteNum || propertyToUse.apt || '').substring(0, 5), 5);
        safeSetText('topmostSubform[0].Page4[0]._3a_Address_City[0]', (propertyToUse.city || '').substring(0, 35), 35);
        if (propertyToUse.state) {
          try {
            form.getDropdown('topmostSubform[0].Page4[0]._3a_Address_State[0]').select(propertyToUse.state);
          } catch (e) {
            console.log(`Error setting property state dropdown: ${e.message}`);
          }
        }
        safeSetText('topmostSubform[0].Page4[0]._3a_Address_Zip[0]', propertyToUse.zipCode || '', 10);
        safeSetText('topmostSubform[0].Page4[0]._3a_Address_Country[0]', 'USA', 25);
        
        // Property Status (Sold, Pending Sale, or Retained)
        try {
          // Get status from propertiesOwned.properties[0] if available
          const propertyStatus = propertiesOwned && propertiesOwned.properties && propertiesOwned.properties.length > 0 
              ? propertiesOwned.properties[0].statusOfProperty || 'Retained'
              : (propertiesOwned.propertyStatus || 'Retained');
              
          if (propertyStatus.toLowerCase().includes('sold')) {
            form.getDropdown('topmostSubform[0].Page4[0]._3a_Status[0]').select('Sold');
          } else if (propertyStatus.toLowerCase().includes('pending')) {
            form.getDropdown('topmostSubform[0].Page4[0]._3a_Status[0]').select('Pending Sale');
          } else {
            form.getDropdown('topmostSubform[0].Page4[0]._3a_Status[0]').select('Retained');
          }
        } catch (e) {
          console.log(`Error setting property status dropdown: ${e.message}`);
        }
        
        // Intended Occupancy - using correct field name
        try {
          const occupancyType = property.occupancyType || 'Primary Residence';
          if (occupancyType.toLowerCase().includes('primary')) {
            form.getDropdown('topmostSubform[0].Page4[0]._3a_Intended_Occupancy[0]').select('Primary Residence');
          } else if (occupancyType.toLowerCase().includes('second') || occupancyType.toLowerCase().includes('vacation')) {
            form.getDropdown('topmostSubform[0].Page4[0]._3a_Intended_Occupancy[0]').select('Second Home');
          } else if (occupancyType.toLowerCase().includes('investment')) {
            form.getDropdown('topmostSubform[0].Page4[0]._3a_Intended_Occupancy[0]').select('Investment');
          } else {
            form.getDropdown('topmostSubform[0].Page4[0]._3a_Intended_Occupancy[0]').select('Other');
          }
        } catch (e) {
          console.log(`Error setting occupancy dropdown: ${e.message}`);
        }
        
        // Monthly Insurance, Taxes, etc.
        if (propertiesOwned) {
          // Format values as numbers with 0 decimal places
          const formatCurrency = (val) => String(Math.round(parseFloat(val) || 0));
          
          // Set monthly insurance and taxes - based on the correct field names from extractFields.mjs
          if (propertiesOwned.hazardInsurance) {
            safeSetText('topmostSubform[0].Page4[0]._3a_Monthly_Expenses[0]', formatCurrency(propertiesOwned.hazardInsurance), 20);
          }
          
          // Set mortgage payments - using the correct field name
          if (propertiesOwned.firstMortgage) {
            safeSetText('topmostSubform[0].Page4[0]._3a_Monthly_Expenses[0]', formatCurrency(propertiesOwned.firstMortgage), 20);
          }
          
          // Set monthly rental if available
          if (propertiesOwned.rent) {
            safeSetText('topmostSubform[0].Page4[0]._3a_Monthly_Rent[0]', formatCurrency(propertiesOwned.rent), 20);
          }
          
          // Set net monthly rental income if available
          if (propertiesOwned.netRentalIncome) {
            safeSetText('topmostSubform[0].Page4[0]._3a_Net_Monthly[0]', formatCurrency(propertiesOwned.netRentalIncome), 20);
          }
        }
        
        // Property Value - use presentMarketValue from propertiesOwned.properties[0] if available
        const propertyValue = propertiesOwned && propertiesOwned.properties && propertiesOwned.properties.length > 0 
            ? propertiesOwned.properties[0].presentMarketValue || property.propertyValue
            : property.propertyValue;
            
        if (propertyValue) {
          safeSetText('topmostSubform[0].Page4[0]._3a_Value[0]', String(propertyValue), 20);
        }
        
        // Mortgage Loans on this Property section (checkbox and table)
        try {
          // Check if the property has mortgage loans
          const hasMortgageLoans = debts && debts.length > 0;
          
          // Set the "Does Not Apply" checkbox based on whether there are mortgage loans
          if (hasMortgageLoans) {
            form.getCheckBox('topmostSubform[0].Page4[0]._3a_Mortgage_Does_Not_Apply[0]').uncheck();
            
            // Take the first debt to populate the table
            const primaryDebt = debts[0];
            
            // Only set field values if they exist in the object
            // Creditor Name
            safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Creditor1[0]', primaryDebt.creditor || '', 40);
            
            // Account Number
            safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Account1[0]', primaryDebt.id || '', 30);
            
            // Monthly Mortgage Payment - ensure it's a string and handle null/undefined
            const monthlyPayment = primaryDebt.monthlyPayment !== undefined && primaryDebt.monthlyPayment !== null 
              ? String(primaryDebt.monthlyPayment) 
              : '';
            safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Monthly_Mortgage1[0]', monthlyPayment, 20);
            
            // Unpaid Balance - ensure it's a string and handle null/undefined
            const unpaidBalance = primaryDebt.balance !== undefined && primaryDebt.balance !== null 
              ? String(primaryDebt.balance) 
              : '';
            safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Unpaid1[0]', unpaidBalance, 20);
            
            // Paid Off at or Before Closing checkbox - using correct field name
            try {
              if (primaryDebt.paidAtClosing) {
                form.getCheckBox('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Paid_Off1[0]').check();
              } else {
                form.getCheckBox('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Paid_Off1[0]').uncheck();
              }
            } catch (e) {
              console.log(`Error setting paid off checkbox: ${e.message}`);
            }
            
            // Determine loan type based on debt information or default to Conventional
            let loanType = 'Conventional';
            if (primaryDebt.creditor) {
              const creditorName = primaryDebt.creditor.toLowerCase();
              if (creditorName.includes('fha')) {
                loanType = 'FHA';
              } else if (creditorName.includes('va')) {
                loanType = 'VA';
              } else if (creditorName.includes('usda') || creditorName.includes('rural')) {
                loanType = 'USDA-RD';
              }
            }
            
            // Set loan type
            try {
              form.getDropdown('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Type1[0]').select(loanType);
            } catch (e) {
              console.log(`Error setting loan type dropdown: ${e.message}`);
            }
            
            // Credit Limit (if applicable) - using correct field name and handling null/undefined
            if (primaryDebt.creditLimit !== undefined && primaryDebt.creditLimit !== null) {
              safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Credit1[0]', String(primaryDebt.creditLimit), 20);
            } else {
              safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Credit1[0]', '', 20);
            }
            
            // Second row - if there are multiple debts
            if (debts.length > 1) {
              const secondaryDebt = debts[1];
              try {
                // Creditor Name - only set if it exists
                safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Creditor2[0]', secondaryDebt.creditor || '', 40);
                
                // Account Number - only set if it exists
                safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Account2[0]', secondaryDebt.id || '', 30);
                
                // Monthly Mortgage Payment - ensure it's a string and handle null/undefined
                const secondaryMonthlyPayment = secondaryDebt.monthlyPayment !== undefined && secondaryDebt.monthlyPayment !== null 
                  ? String(secondaryDebt.monthlyPayment) 
                  : '';
                safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Monthly_Mortgage2[0]', secondaryMonthlyPayment, 20);
                
                // Unpaid Balance - ensure it's a string and handle null/undefined
                const secondaryUnpaidBalance = secondaryDebt.balance !== undefined && secondaryDebt.balance !== null 
                  ? String(secondaryDebt.balance) 
                  : '';
                safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Unpaid2[0]', secondaryUnpaidBalance, 20);
                
                // Paid Off at or Before Closing checkbox
                if (secondaryDebt.paidAtClosing) {
                  form.getCheckBox('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Paid_Off2[0]').check();
                } else {
                  form.getCheckBox('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Paid_Off2[0]').uncheck();
                }
                
                // Determine loan type for secondary debt
                let secondaryLoanType = 'Conventional';
                if (secondaryDebt.creditor) {
                  const creditorName = secondaryDebt.creditor.toLowerCase();
                  if (creditorName.includes('fha')) {
                    secondaryLoanType = 'FHA';
                  } else if (creditorName.includes('va')) {
                    secondaryLoanType = 'VA';
                  } else if (creditorName.includes('usda') || creditorName.includes('rural')) {
                    secondaryLoanType = 'USDA-RD';
                  }
                }
                
                // Set loan type for secondary debt
                form.getDropdown('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Type2[0]').select(secondaryLoanType);
                
                // Credit Limit for secondary debt - handling null/undefined
                if (secondaryDebt.creditLimit !== undefined && secondaryDebt.creditLimit !== null) {
                  safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Credit2[0]', String(secondaryDebt.creditLimit), 20);
                } else {
                  safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Credit2[0]', '', 20);
                }
              } catch (e) {
                console.log(`Error setting secondary debt fields: ${e.message}`);
                
                // Clear the second row fields if there was an error
                safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Creditor2[0]', '', 40);
                safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Account2[0]', '', 30);
                safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Monthly_Mortgage2[0]', '', 20);
                safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Unpaid2[0]', '', 20);
                safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Credit2[0]', '', 20);
              }
            } else {
              // No secondary debt, clear the second row
              safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Creditor2[0]', '', 40);
              safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Account2[0]', '', 30);
              safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Monthly_Mortgage2[0]', '', 20);
              safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Unpaid2[0]', '', 20);
              safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Credit2[0]', '', 20);
              
              // Make sure checkboxes are unchecked
              try {
                form.getCheckBox('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Paid_Off2[0]').uncheck();
              } catch (e) {
                console.log(`Error clearing second debt checkbox: ${e.message}`);
              }
            }
          } else {
            // No debts associated with this property
            form.getCheckBox('topmostSubform[0].Page4[0]._3a_Mortgage_Does_Not_Apply[0]').check();
            
            // Clear all fields in the mortgage tables
            safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Creditor1[0]', '', 40);
            safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Account1[0]', '', 30);
            safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Monthly_Mortgage1[0]', '', 20);
            safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Unpaid1[0]', '', 20);
            safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Credit1[0]', '', 20);
            
            safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Creditor2[0]', '', 40);
            safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Account2[0]', '', 30);
            safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Monthly_Mortgage2[0]', '', 20);
            safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Unpaid2[0]', '', 20);
            safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Credit2[0]', '', 20);
            
            // Make sure checkboxes are unchecked
            try {
              form.getCheckBox('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Paid_Off1[0]').uncheck();
              form.getCheckBox('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Paid_Off2[0]').uncheck();
            } catch (e) {
              console.log(`Error clearing debt checkboxes: ${e.message}`);
            }

            // Clear the loan type dropdowns - they should be empty when "Does Not Apply" is checked
            try {
              // For PDF.js, we can try to set them to an empty string
              form.getDropdown('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Type1[0]').select('');
            } catch (e) {
              console.log(`Could not clear first type dropdown with empty string: ${e.message}`);
              // Some PDF libraries don't allow empty selection, so we might need to use the default
            }
            
            try {
              form.getDropdown('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Type2[0]').select('');
            } catch (e) {
              console.log(`Could not clear second type dropdown with empty string: ${e.message}`);
              // Some PDF libraries don't allow empty selection, so we might need to use the default
            }
          }
        } catch (e) {
          console.log(`Error setting mortgage loan information: ${e.message}`);
          // If there's an error, check the "Does Not Apply" checkbox as fallback
          form.getCheckBox('topmostSubform[0].Page4[0]._3a_Mortgage_Does_Not_Apply[0]').check();
          
          // Clear all fields in the mortgage tables as fallback
          safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Creditor1[0]', '', 40);
          safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Account1[0]', '', 30);
          safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Monthly_Mortgage1[0]', '', 20);
          safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Unpaid1[0]', '', 20);
          safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Credit1[0]', '', 20);
          
          safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Creditor2[0]', '', 40);
          safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Account2[0]', '', 30);
          safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Monthly_Mortgage2[0]', '', 20);
          safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Unpaid2[0]', '', 20);
          safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Credit2[0]', '', 20);
          
          // Clear the loan type dropdowns - they should be empty when "Does Not Apply" is checked
          try {
            // For PDF.js, we can try to set them to an empty string
            form.getDropdown('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Type1[0]').select('');
          } catch (e) {
            console.log(`Could not clear first type dropdown with empty string in error handler: ${e.message}`);
            // Some PDF libraries don't allow empty selection, so we might need to use the default
          }
          
          try {
            form.getDropdown('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Type2[0]').select('');
          } catch (e) {
            console.log(`Could not clear second type dropdown with empty string in error handler: ${e.message}`);
            // Some PDF libraries don't allow empty selection, so we might need to use the default
          }
          
          // Make sure checkboxes are unchecked
          try {
            form.getCheckBox('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Paid_Off1[0]').uncheck();
            form.getCheckBox('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Paid_Off2[0]').uncheck();
          } catch (e) {
            console.log(`Error clearing debt checkboxes in error handler: ${e.message}`);
          }
        }
        
        // For 2-4 Unit Primary or Investment Property section
        if (property.numberOfUnits > 1 || (property.occupancyType && property.occupancyType.toLowerCase().includes('investment'))) {
          // Monthly rental income - using correct field name
          if (property.proposedRentalIncome) {
            safeSetText('topmostSubform[0].Page4[0]._3a_Monthly_Rent[0]', String(property.proposedRentalIncome), 20);
          }
          
          // Net monthly rental income - using correct field name
          if (property.netMonthlyRentalIncome) {
            safeSetText('topmostSubform[0].Page4[0]._3a_Net_Monthly[0]', String(property.netMonthlyRentalIncome), 20);
          }
        }
        
        // Handle Section 3b - Additional Property
        if (propertiesOwned && propertiesOwned.properties && propertiesOwned.properties.length > 1) {
          // Uncheck the "Does Not Apply" checkbox since there is an additional property
          form.getCheckBox('topmostSubform[0].Page4[0]._3b_No_Additional[0]').uncheck();
          
          // Get the second property (index 1)
          const additionalProperty = propertiesOwned.properties[1];
          const additionalPropertyAddress = additionalProperty.propertyAddress || {};
          
          // Set address fields
          safeSetText('topmostSubform[0].Page4[0]._3b_Address_St[0]', (additionalPropertyAddress.streetAddress || '').substring(0, 50), 50);
          safeSetText('topmostSubform[0].Page4[0]._3b_Address_Unit[0]', (additionalPropertyAddress.aptSteNum || additionalPropertyAddress.apt || '').substring(0, 5), 5);
          safeSetText('topmostSubform[0].Page4[0]._3b_Address_City[0]', (additionalPropertyAddress.city || '').substring(0, 35), 35);
          
          if (additionalPropertyAddress.state) {
            try {
              form.getDropdown('topmostSubform[0].Page4[0]._3b_Address_State[0]').select(additionalPropertyAddress.state);
            } catch (e) {
              console.log(`Error setting additional property state dropdown: ${e.message}`);
            }
          }
          
          safeSetText('topmostSubform[0].Page4[0]._3b_Address_Zip[0]', additionalPropertyAddress.zipCode || '', 10);
          safeSetText('topmostSubform[0].Page4[0]._3b_Address_Country[0]', 'USA', 25);
          
          // Property Status (Sold, Pending Sale, or Retained)
          if (additionalProperty.statusOfProperty) {
            const status = additionalProperty.statusOfProperty.toLowerCase();
            try {
              if (status.includes('sold')) {
                form.getDropdown('topmostSubform[0].Page4[0]._3b_Status[0]').select('Sold');
              } else if (status.includes('pending')) {
                form.getDropdown('topmostSubform[0].Page4[0]._3b_Status[0]').select('Pending Sale');
              } else {
                form.getDropdown('topmostSubform[0].Page4[0]._3b_Status[0]').select('Retained');
              }
            } catch (e) {
              console.log(`Error setting additional property status dropdown: ${e.message}`);
            }
          }
          
          // Intended Occupancy
          if (additionalProperty.intendedOccupancy) {
            try {
              const occupancyType = additionalProperty.intendedOccupancy.toLowerCase();
              if (occupancyType.includes('primary')) {
                form.getDropdown('topmostSubform[0].Page4[0]._3b_Intended_Occupancy[0]').select('Primary Residence');
              } else if (occupancyType.includes('second') || occupancyType.includes('vacation')) {
                form.getDropdown('topmostSubform[0].Page4[0]._3b_Intended_Occupancy[0]').select('Second Home');
              } else if (occupancyType.includes('investment')) {
                form.getDropdown('topmostSubform[0].Page4[0]._3b_Intended_Occupancy[0]').select('Investment');
              } else {
                form.getDropdown('topmostSubform[0].Page4[0]._3b_Intended_Occupancy[0]').select('Other');
              }
            } catch (e) {
              console.log(`Error setting additional property occupancy dropdown: ${e.message}`);
            }
          }
          
          // Monthly expenses
          if (additionalProperty.monthlyExpenses) {
            safeSetText('topmostSubform[0].Page4[0]._3b_Monthly_Expenses[0]', String(additionalProperty.monthlyExpenses), 20);
          }
          
          // Monthly rental income
          if (additionalProperty.monthlyRentalIncome) {
            safeSetText('topmostSubform[0].Page4[0]._3b_Monthly_Rent[0]', String(additionalProperty.monthlyRentalIncome), 20);
          }
          
          // Net monthly rental income
          if (additionalProperty.netMonthlyRentalIncome) {
            safeSetText('topmostSubform[0].Page4[0]._3b_Net_Monthly[0]', String(additionalProperty.netMonthlyRentalIncome), 20);
          }
          
          // Property Value
          if (additionalProperty.presentMarketValue) {
            safeSetText('topmostSubform[0].Page4[0]._3b_Value[0]', String(additionalProperty.presentMarketValue), 20);
          }
          
          // Mortgage Loans for additional property
          if (additionalProperty.mortgageLoans && additionalProperty.mortgageLoans.length > 0) {
            form.getCheckBox('topmostSubform[0].Page4[0]._3b_Mortgage_Does_Not_Apply[0]').uncheck();
            
            // First mortgage loan
            const primaryLoan = additionalProperty.mortgageLoans[0];
            
            // Only set field values if they exist in the object
            safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Creditor1[0]', primaryLoan.creditor || '', 40);
            safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Account1[0]', primaryLoan.accountNumber || '', 30);
            
            // Monthly Mortgage Payment - ensure it's a string and handle null/undefined
            const monthlyPayment = primaryLoan.monthlyPayment !== undefined && primaryLoan.monthlyPayment !== null 
              ? String(primaryLoan.monthlyPayment) 
              : '';
            safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Monthly_Mortgage1[0]', monthlyPayment, 20);
            
            // Unpaid Balance - ensure it's a string and handle null/undefined
            const unpaidBalance = primaryLoan.unpaidBalance !== undefined && primaryLoan.unpaidBalance !== null 
              ? String(primaryLoan.unpaidBalance) 
              : '';
            safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Unpaid1[0]', unpaidBalance, 20);
            
            // Paid off checkbox
            if (primaryLoan.paidAtClosing) {
              form.getCheckBox('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Paid_Off1[0]').check();
            } else {
              form.getCheckBox('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Paid_Off1[0]').uncheck();
            }
            
            // Loan type
            if (primaryLoan.loanType) {
              try {
                form.getDropdown('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Type1[0]').select(primaryLoan.loanType);
              } catch (e) {
                console.log(`Error setting additional property loan type dropdown: ${e.message}`);
              }
            }
            
            // Credit limit - handling null/undefined
            if (primaryLoan.creditLimit !== undefined && primaryLoan.creditLimit !== null) {
              safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Credit1[0]', String(primaryLoan.creditLimit), 20);
            } else {
              safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Credit1[0]', '', 20);
            }
            
            // Second mortgage loan if available
            if (additionalProperty.mortgageLoans.length > 1) {
              const secondaryLoan = additionalProperty.mortgageLoans[1];
              
              // Only set field values if they exist in the object
              safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Creditor2[0]', secondaryLoan.creditor || '', 40);
              safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Account2[0]', secondaryLoan.accountNumber || '', 30);
              
              // Monthly Mortgage Payment - ensure it's a string and handle null/undefined
              const secondaryMonthlyPayment = secondaryLoan.monthlyPayment !== undefined && secondaryLoan.monthlyPayment !== null 
                ? String(secondaryLoan.monthlyPayment) 
                : '';
              safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Monthly_Mortgage2[0]', secondaryMonthlyPayment, 20);
              
              // Unpaid Balance - ensure it's a string and handle null/undefined
              const secondaryUnpaidBalance = secondaryLoan.unpaidBalance !== undefined && secondaryLoan.unpaidBalance !== null 
                ? String(secondaryLoan.unpaidBalance) 
                : '';
              safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Unpaid2[0]', secondaryUnpaidBalance, 20);
              
              // Paid off checkbox
              if (secondaryLoan.paidAtClosing) {
                form.getCheckBox('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Paid_Off2[0]').check();
              } else {
                form.getCheckBox('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Paid_Off2[0]').uncheck();
              }
              
              // Loan type
              if (secondaryLoan.loanType) {
                try {
                  form.getDropdown('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Type2[0]').select(secondaryLoan.loanType);
                } catch (e) {
                  console.log(`Error setting additional property secondary loan type dropdown: ${e.message}`);
                }
              }
              
              // Credit limit - handling null/undefined
              if (secondaryLoan.creditLimit !== undefined && secondaryLoan.creditLimit !== null) {
                safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Credit2[0]', String(secondaryLoan.creditLimit), 20);
              } else {
                safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Credit2[0]', '', 20);
              }
            } else {
              // No secondary loan, clear the second row
              safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Creditor2[0]', '', 40);
              safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Account2[0]', '', 30);
              safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Monthly_Mortgage2[0]', '', 20);
              safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Unpaid2[0]', '', 20);
              safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Credit2[0]', '', 20);
              
              // Make sure checkbox is unchecked
              try {
                form.getCheckBox('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Paid_Off2[0]').uncheck();
              } catch (e) {
                console.log(`Error clearing second loan checkbox: ${e.message}`);
              }
            }
          } else {
            // No mortgage loans for additional property
            form.getCheckBox('topmostSubform[0].Page4[0]._3b_Mortgage_Does_Not_Apply[0]').check();
            
            // Clear all mortgage loan fields
            safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Creditor1[0]', '', 40);
            safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Account1[0]', '', 30);
            safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Monthly_Mortgage1[0]', '', 20);
            safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Unpaid1[0]', '', 20);
            safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Credit1[0]', '', 20);
            
            safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Creditor2[0]', '', 40);
            safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Account2[0]', '', 30);
            safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Monthly_Mortgage2[0]', '', 20);
            safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Unpaid2[0]', '', 20);
            safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Credit2[0]', '', 20);
            
            // Make sure checkboxes are unchecked
            try {
              form.getCheckBox('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Paid_Off1[0]').uncheck();
              form.getCheckBox('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Paid_Off2[0]').uncheck();
            } catch (e) {
              console.log(`Error clearing loan checkboxes: ${e.message}`);
            }
          }
        } else {
          // No additional property
          form.getCheckBox('topmostSubform[0].Page4[0]._3b_No_Additional[0]').check();
        }
        
        // Handle Section 3c - Additional Property
        if (propertiesOwned && propertiesOwned.properties && propertiesOwned.properties.length > 2) {
          // Uncheck the "Does Not Apply" checkbox since there is a third property
          form.getCheckBox('topmostSubform[0].Page4[0]._3c_No_Additional[0]').uncheck();
          
          // Get the third property (index 2)
          const thirdProperty = propertiesOwned.properties[2];
          const thirdPropertyAddress = thirdProperty.propertyAddress || {};
          
          // Set address fields
          safeSetText('topmostSubform[0].Page4[0]._3c_Address_St[0]', (thirdPropertyAddress.streetAddress || '').substring(0, 50), 50);
          safeSetText('topmostSubform[0].Page4[0]._3c_Address_Unit[0]', (thirdPropertyAddress.aptSteNum || thirdPropertyAddress.apt || '').substring(0, 5), 5);
          safeSetText('topmostSubform[0].Page4[0]._3c_Address_City[0]', (thirdPropertyAddress.city || '').substring(0, 35), 35);
          
          if (thirdPropertyAddress.state) {
            try {
              form.getDropdown('topmostSubform[0].Page4[0]._3c_Address_State[0]').select(thirdPropertyAddress.state);
            } catch (e) {
              console.log(`Error setting third property state dropdown: ${e.message}`);
            }
          }
          
          safeSetText('topmostSubform[0].Page4[0]._3c_Address_Zip[0]', thirdPropertyAddress.zipCode || '', 10);
          safeSetText('topmostSubform[0].Page4[0]._3c_Address_Country[0]', 'USA', 25);
          
          // Property Status (Sold, Pending Sale, or Retained)
          if (thirdProperty.statusOfProperty) {
            const status = thirdProperty.statusOfProperty.toLowerCase();
            try {
              if (status.includes('sold')) {
                form.getDropdown('topmostSubform[0].Page4[0]._3c_Status[0]').select('Sold');
              } else if (status.includes('pending')) {
                form.getDropdown('topmostSubform[0].Page4[0]._3c_Status[0]').select('Pending Sale');
              } else {
                form.getDropdown('topmostSubform[0].Page4[0]._3c_Status[0]').select('Retained');
              }
            } catch (e) {
              console.log(`Error setting third property status dropdown: ${e.message}`);
            }
          }
          
          // Intended Occupancy
          if (thirdProperty.intendedOccupancy) {
            try {
              const occupancyType = thirdProperty.intendedOccupancy.toLowerCase();
              if (occupancyType.includes('primary')) {
                form.getDropdown('topmostSubform[0].Page4[0]._3c_Intended_Occupancy[0]').select('Primary Residence');
              } else if (occupancyType.includes('second') || occupancyType.includes('vacation')) {
                form.getDropdown('topmostSubform[0].Page4[0]._3c_Intended_Occupancy[0]').select('Second Home');
              } else if (occupancyType.includes('investment')) {
                form.getDropdown('topmostSubform[0].Page4[0]._3c_Intended_Occupancy[0]').select('Investment');
              } else {
                form.getDropdown('topmostSubform[0].Page4[0]._3c_Intended_Occupancy[0]').select('Other');
              }
            } catch (e) {
              console.log(`Error setting third property occupancy dropdown: ${e.message}`);
            }
          }
          
          // Monthly expenses
          if (thirdProperty.monthlyExpenses) {
            safeSetText('topmostSubform[0].Page4[0]._3c_Monthly_Expenses[0]', String(thirdProperty.monthlyExpenses), 20);
          }
          
          // Monthly rental income
          if (thirdProperty.monthlyRentalIncome) {
            safeSetText('topmostSubform[0].Page4[0]._3c_Monthly_Rent[0]', String(thirdProperty.monthlyRentalIncome), 20);
          }
          
          // Net monthly rental income
          if (thirdProperty.netMonthlyRentalIncome) {
            safeSetText('topmostSubform[0].Page4[0]._3c_Net_Monthly[0]', String(thirdProperty.netMonthlyRentalIncome), 20);
          }
          
          // Property Value
          if (thirdProperty.presentMarketValue) {
            safeSetText('topmostSubform[0].Page4[0]._3c_Value[0]', String(thirdProperty.presentMarketValue), 20);
          }
          
          // Mortgage Loans for third property - only implementing the table fields that were found in extractFields.mjs
          // The PDF form might have limited fields for the third property
          if (thirdProperty.mortgageLoans && thirdProperty.mortgageLoans.length > 0) {
            // There's no "Does Not Apply" checkbox for 3c mortgage loans in the extractFields.mjs output
            
            // Attempt to set any available mortgage fields for the third property
            try {
              // Process first mortgage loan
              const firstLoan = thirdProperty.mortgageLoans[0];
              
              // Set credit limit fields which we know exist based on extractFields.mjs output
              if (thirdProperty.mortgageLoans.length > 1) {
                const secondLoan = thirdProperty.mortgageLoans[1];
                const creditLimit = secondLoan.creditLimit !== undefined && secondLoan.creditLimit !== null
                  ? String(secondLoan.creditLimit)
                  : '';
                safeSetText('topmostSubform[0].Page4[0].Table3c[0].TR2[0]._3c_Credit2[0]', creditLimit, 20);
              } else {
                // Clear second row credit limit field if no second loan
                safeSetText('topmostSubform[0].Page4[0].Table3c[0].TR2[0]._3c_Credit2[0]', '', 20);
              }
              
              // Try to set other fields, but use try/catch rather than document.querySelector
              // Since we're in a PDF context, not a browser DOM context
              try {
                safeSetText('topmostSubform[0].Page4[0].Table3c[0].TR1[0]._3c_Creditor1[0]', firstLoan.creditor || '', 40);
              } catch (e) {
                // Field might not exist in this PDF form, ignore error
              }
              
              try {
                safeSetText('topmostSubform[0].Page4[0].Table3c[0].TR1[0]._3c_Account1[0]', firstLoan.accountNumber || '', 30);
              } catch (e) {
                // Field might not exist in this PDF form, ignore error  
              }
              
              try {
                const monthlyPayment = firstLoan.monthlyPayment !== undefined && firstLoan.monthlyPayment !== null 
                  ? String(firstLoan.monthlyPayment) 
                  : '';
                safeSetText('topmostSubform[0].Page4[0].Table3c[0].TR1[0]._3c_Monthly_Mortgage1[0]', monthlyPayment, 20);
              } catch (e) {
                // Field might not exist in this PDF form, ignore error
              }
              
              try {
                const unpaidBalance = firstLoan.unpaidBalance !== undefined && firstLoan.unpaidBalance !== null 
                  ? String(firstLoan.unpaidBalance) 
                  : '';
                safeSetText('topmostSubform[0].Page4[0].Table3c[0].TR1[0]._3c_Unpaid1[0]', unpaidBalance, 20);
              } catch (e) {
                // Field might not exist in this PDF form, ignore error
              }
              
              try {
                const creditLimit = firstLoan.creditLimit !== undefined && firstLoan.creditLimit !== null
                  ? String(firstLoan.creditLimit)
                  : '';
                safeSetText('topmostSubform[0].Page4[0].Table3c[0].TR1[0]._3c_Credit1[0]', creditLimit, 20);
              } catch (e) {
                // Field might not exist in this PDF form, ignore error
              }
              
              // Try checkbox fields
              try {
                if (firstLoan.paidAtClosing) {
                  form.getCheckBox('topmostSubform[0].Page4[0].Table3c[0].TR1[0]._3c_Paid_Off1[0]').check();
                } else {
                  form.getCheckBox('topmostSubform[0].Page4[0].Table3c[0].TR1[0]._3c_Paid_Off1[0]').uncheck();
                }
              } catch (e) {
                // Field might not exist in this PDF form, ignore error
              }
              
              // Try dropdown fields
              try {
                form.getDropdown('topmostSubform[0].Page4[0].Table3c[0].TR1[0]._3c_Type1[0]').select(firstLoan.loanType || 'Conventional');
              } catch (e) {
                // Field might not exist in this PDF form, ignore error
              }
              
              // Try second row fields if a second loan exists
              if (thirdProperty.mortgageLoans.length > 1) {
                const secondLoan = thirdProperty.mortgageLoans[1];
                
                try {
                  safeSetText('topmostSubform[0].Page4[0].Table3c[0].TR2[0]._3c_Creditor2[0]', secondLoan.creditor || '', 40);
                } catch (e) {
                  // Field might not exist in this PDF form, ignore error
                }
                
                try {
                  safeSetText('topmostSubform[0].Page4[0].Table3c[0].TR2[0]._3c_Account2[0]', secondLoan.accountNumber || '', 30);
                } catch (e) {
                  // Field might not exist in this PDF form, ignore error
                }
                
                try {
                  const monthlyPayment = secondLoan.monthlyPayment !== undefined && secondLoan.monthlyPayment !== null
                    ? String(secondLoan.monthlyPayment)
                    : '';
                  safeSetText('topmostSubform[0].Page4[0].Table3c[0].TR2[0]._3c_Monthly_Mortgage2[0]', monthlyPayment, 20);
                } catch (e) {
                  // Field might not exist in this PDF form, ignore error
                }
                
                try {
                  const unpaidBalance = secondLoan.unpaidBalance !== undefined && secondLoan.unpaidBalance !== null
                    ? String(secondLoan.unpaidBalance)
                    : '';
                  safeSetText('topmostSubform[0].Page4[0].Table3c[0].TR2[0]._3c_Unpaid2[0]', unpaidBalance, 20);
                } catch (e) {
                  // Field might not exist in this PDF form, ignore error
                }
                
                try {
                  if (secondLoan.paidAtClosing) {
                    form.getCheckBox('topmostSubform[0].Page4[0].Table3c[0].TR2[0]._3c_Paid_Off2[0]').check();
                  } else {
                    form.getCheckBox('topmostSubform[0].Page4[0].Table3c[0].TR2[0]._3c_Paid_Off2[0]').uncheck();
                  }
                } catch (e) {
                  // Field might not exist in this PDF form, ignore error
                }
                
                try {
                  form.getDropdown('topmostSubform[0].Page4[0].Table3c[0].TR2[0]._3c_Type2[0]').select(secondLoan.loanType || 'Conventional');
                } catch (e) {
                  // Field might not exist in this PDF form, ignore error
                }
              }
            } catch (e) {
              console.log(`Error setting third property mortgage fields: ${e.message}`);
              
              // Clear known fields in case of error
              try {
                safeSetText('topmostSubform[0].Page4[0].Table3c[0].TR2[0]._3c_Credit2[0]', '', 20);
              } catch (e) {
                // Ignore any errors
              }
            }
          } else {
            // No mortgage loans for third property, clear the credit limit field we know exists
            try {
              safeSetText('topmostSubform[0].Page4[0].Table3c[0].TR2[0]._3c_Credit2[0]', '', 20);
            } catch (e) {
              // Ignore any errors
            }
          }
        } else {
          // No third property
          form.getCheckBox('topmostSubform[0].Page4[0]._3c_No_Additional[0]').check();
        }
      } else {
        // If no properties owned, check the main "I do not own any real estate" checkbox
        form.getCheckBox('topmostSubform[0].Page4[0]._3_Do_Not_Own[0]').check();
        
        // Check "Does not apply" for all subsections
        form.getCheckBox('topmostSubform[0].Page4[0]._3b_No_Additional[0]').check();
        form.getCheckBox('topmostSubform[0].Page4[0]._3c_No_Additional[0]').check();
        
        // Ensure mortgage loans checkbox is checked as "Does not apply"
        form.getCheckBox('topmostSubform[0].Page4[0]._3a_Mortgage_Does_Not_Apply[0]').check();
        
        // Clear all fields in section 3a
        safeSetText('topmostSubform[0].Page4[0]._3a_Address_St[0]', '', 50);
        safeSetText('topmostSubform[0].Page4[0]._3a_Address_Unit[0]', '', 5);
        safeSetText('topmostSubform[0].Page4[0]._3a_Address_City[0]', '', 35);
        safeSetText('topmostSubform[0].Page4[0]._3a_Address_Zip[0]', '', 10);
        safeSetText('topmostSubform[0].Page4[0]._3a_Address_Country[0]', '', 25);
        safeSetText('topmostSubform[0].Page4[0]._3a_Value[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0]._3a_Monthly_Expenses[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0]._3a_Monthly_Rent[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0]._3a_Net_Monthly[0]', '', 20);
        
        // Clear all mortgage loan table fields
        safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Creditor1[0]', '', 40);
        safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Account1[0]', '', 30);
        safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Monthly_Mortgage1[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Unpaid1[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Credit1[0]', '', 20);
        
        safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Creditor2[0]', '', 40);
        safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Account2[0]', '', 30);
        safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Monthly_Mortgage2[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Unpaid2[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Credit2[0]', '', 20);
        
        // Clear the loan type dropdowns - they should be empty when no properties
        try {
          // For PDF.js, we can try to set them to an empty string
          form.getDropdown('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Type1[0]').select('');
        } catch (e) {
          console.log(`Could not clear first type dropdown with empty string for no properties: ${e.message}`);
          // Some PDF libraries don't allow empty selection, so we might need to use the default
        }
        
        try {
          form.getDropdown('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Type2[0]').select('');
        } catch (e) {
          console.log(`Could not clear second type dropdown with empty string for no properties: ${e.message}`);
          // Some PDF libraries don't allow empty selection, so we might need to use the default
        }
        
        // Clear all fields in section 3b
        safeSetText('topmostSubform[0].Page4[0]._3b_Address_St[0]', '', 50);
        safeSetText('topmostSubform[0].Page4[0]._3b_Address_Unit[0]', '', 5);
        safeSetText('topmostSubform[0].Page4[0]._3b_Address_City[0]', '', 35);
        safeSetText('topmostSubform[0].Page4[0]._3b_Address_Zip[0]', '', 10);
        safeSetText('topmostSubform[0].Page4[0]._3b_Address_Country[0]', '', 25);
        safeSetText('topmostSubform[0].Page4[0]._3b_Value[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0]._3b_Monthly_Expenses[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0]._3b_Monthly_Rent[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0]._3b_Net_Monthly[0]', '', 20);
        
        // Clear all mortgage loan table fields for 3b
        safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Creditor1[0]', '', 40);
        safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Account1[0]', '', 30);
        safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Monthly_Mortgage1[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Unpaid1[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Credit1[0]', '', 20);
        
        safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Creditor2[0]', '', 40);
        safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Account2[0]', '', 30);
        safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Monthly_Mortgage2[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Unpaid2[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Credit2[0]', '', 20);
        
        // Clear the loan type dropdowns for section 3b - they should be empty when no properties
        try {
          // For PDF.js, we can try to set them to an empty string
          form.getDropdown('topmostSubform[0].Page4[0].Table3b[0].TR1[0]._3b_Type1[0]').select('');
        } catch (e) {
          console.log(`Could not clear first 3b type dropdown with empty string: ${e.message}`);
          // Some PDF libraries don't allow empty selection, so we might need to use the default
        }
        
        try {
          form.getDropdown('topmostSubform[0].Page4[0].Table3b[0].TR2[0]._3b_Type2[0]').select('');
        } catch (e) {
          console.log(`Could not clear second 3b type dropdown with empty string: ${e.message}`);
          // Some PDF libraries don't allow empty selection, so we might need to use the default
        }
        
        // Clear all fields in section 3c
        safeSetText('topmostSubform[0].Page4[0]._3c_Address_St[0]', '', 50);
        safeSetText('topmostSubform[0].Page4[0]._3c_Address_Unit[0]', '', 5);
        safeSetText('topmostSubform[0].Page4[0]._3c_Address_City[0]', '', 35);
        safeSetText('topmostSubform[0].Page4[0]._3c_Address_Zip[0]', '', 10);
        safeSetText('topmostSubform[0].Page4[0]._3c_Address_Country[0]', '', 25);
        safeSetText('topmostSubform[0].Page4[0]._3c_Value[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0]._3c_Monthly_Expenses[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0]._3c_Monthly_Rent[0]', '', 20);
        safeSetText('topmostSubform[0].Page4[0]._3c_Net_Monthly[0]', '', 20);
        
        // The PDF might have mortgage loan table fields for 3c, but we only saw _3c_Credit2[0] in the extractFields.mjs output
        // Clear any known fields
        safeSetText('topmostSubform[0].Page4[0].Table3c[0].TR2[0]._3c_Credit2[0]', '', 20);
        
        // Try to clear the loan type dropdowns for section 3c if they exist
        try {
          form.getDropdown('topmostSubform[0].Page4[0].Table3c[0].TR1[0]._3c_Type1[0]').select('');
        } catch (e) {
          // Field might not exist, ignore error
        }
        
        try {
          form.getDropdown('topmostSubform[0].Page4[0].Table3c[0].TR2[0]._3c_Type2[0]').select('');
        } catch (e) {
          // Field might not exist, ignore error
        }
      }
    } catch (e) {
      console.log(`Error setting Property You Own fields: ${e.message}`);
      // If there's an error, ensure the checkboxes are checked as fallback
      try {
        form.getCheckBox('topmostSubform[0].Page4[0]._3_Do_Not_Own[0]').check();
        form.getCheckBox('topmostSubform[0].Page4[0]._3b_No_Additional[0]').check();
        form.getCheckBox('topmostSubform[0].Page4[0]._3c_No_Additional[0]').check();
        form.getCheckBox('topmostSubform[0].Page4[0]._3a_Mortgage_Does_Not_Apply[0]').check();
        
        // Clear the loan type dropdowns in error handler
        try {
          form.getDropdown('topmostSubform[0].Page4[0].Table3a[0].TR1[0]._3a_Type1[0]').select('');
        } catch (typeError) {
          console.log(`Could not clear first type dropdown in global error handler: ${typeError.message}`);
        }
        
        try {
          form.getDropdown('topmostSubform[0].Page4[0].Table3a[0].TR2[0]._3a_Type2[0]').select('');
        } catch (typeError) {
          console.log(`Could not clear second type dropdown in global error handler: ${typeError.message}`);
        }
      } catch (e) {
        console.log(`Error with fallback checkbox setting: ${e.message}`);
      }
    }
    
    // Fill loan amount from loanDetails
    form.getTextField('topmostSubform[0].Page5[0]._4a_Loan_Amount[0]').setText(loanDetails.loanAmount ? String(loanDetails.loanAmount) : '');

    // Set loan purpose radio buttons
    if (loanDetails.loanType) {
      const loanType = loanDetails.loanType.toLowerCase();
      let purposeRadioGroup = '';
      
      if (loanType.includes('purchase')) {
        purposeRadioGroup = 'Group11';
        form.getRadioGroup(purposeRadioGroup).select('Purchase');
      } else if (loanType.includes('refinance')) {
        purposeRadioGroup = 'Group11';
        form.getRadioGroup(purposeRadioGroup).select('Refinance');
      } else {
        // Other purpose - specify in text field
        purposeRadioGroup = 'Group11';
        form.getRadioGroup(purposeRadioGroup).select('Other');
        form.getTextField('topmostSubform[0].Page5[0].loan_purpose[0].other[0]._4a_Purpose_other_spec[0]').setText(loanDetails.loanType);
      }
    }
    
    // Fill property details
    console.log('Filling property details............');
    console.log(propertiesOwned)
    // --- 4a. Properties Owned (Selected Fields) ---
if (propertiesOwned && Array.isArray(propertiesOwned.properties)) {
  propertiesOwned.properties.forEach((prop, idx) => {
    // Adjust the field names/indexes as per your PDF's actual field names for each property row
    console.log(`Filling property details for property ${idx + 1}:`, prop);
    // Street Address
    safeSetText(`topmostSubform[0].Page5[0]._4a_Address_St[0]`, prop.propertyAddress?.streetAddress || '');

    // Address Unit
    safeSetText(`topmostSubform[0].Page5[0]._4a_Address_Unit[0]`, prop.propertyAddress?.apt || '');

    // Address City
    safeSetText(`topmostSubform[0].Page5[0]._4a_Address_City[0]`, prop.propertyAddress?.city || '');

    // Address State
    safeSetText(`topmostSubform[0].Page5[0]._4a_Address_State[0]`, prop.propertyAddress?.state || '');

    // Address Zip
    safeSetText(`topmostSubform[0].Page5[0]._4a_Address_Zip[0]`, prop.propertyAddress?.zipCode || '');

    // Property Count (if available, otherwise use propertiesOwned.properties.length)
    safeSetText(`topmostSubform[0].Page5[0]._4a_Property_County[0]`, prop.propertyCount?.toString() || propertiesOwned.properties.length.toString());

    // Units (if available)
    safeSetText(`topmostSubform[0].Page5[0]._4a_Units[0]`, prop.units?.toString() || '');

    // Present Market Value
    safeSetText(`topmostSubform[0].Page5[0]._4a_Value[0]`, prop.presentMarketValue?.toString() || '');
  });
}

//make the radio button group13,14, 1. Mixed-Use Property.2 Manufactured Home respectively.
// Handle Mixed-Use Property radio button (Group13)
try {
  // Check if isMixedUse property exists and use its value
  const isMixedUse = property.isMixedUse && 
                     (property.isMixedUse === "Yes" || 
                      property.isMixedUse === true || 
                      property.isMixedUse === "true");
  
  const mixedUseRadioGroup = 'Group13';
  form.getRadioGroup(mixedUseRadioGroup).select(isMixedUse ? 'YES' : 'NO');
} catch (e) {
  console.log('Error setting Mixed-Use Property radio button:', e.message);
}

// Handle Manufactured Home radio button (Group14)
try {
  // Check if isManufactured property exists and use its value
  const isManufacturedHome = property.isManufactured && 
                            (property.isManufactured === "Yes" || 
                             property.isManufactured === true || 
                             property.isManufactured === "true");
  
  const manufacturedHomeRadioGroup = 'Group14';
  form.getRadioGroup(manufacturedHomeRadioGroup).select(isManufacturedHome ? 'YES' : 'NO');
} catch (e) {
  console.log('Error setting Manufactured Home radio button:', e.message);
}
    // Property type dropdown
    // if (property.propertyType) {
    //   const propertyType = property.propertyType.toLowerCase();
    //   let propertyTypeRadioGroup = 'Group24';
      
    //   if (propertyType.includes('single family') || propertyType.includes('singlefamily')) {
    //     form.getRadioGroup(propertyTypeRadioGroup).select('SF');
    //   } else if (propertyType.includes('condo')) {
    //     form.getRadioGroup(propertyTypeRadioGroup).select('Condo');
    //   } else if (propertyType.includes('pud')) {
    //     form.getRadioGroup(propertyTypeRadioGroup).select('PUD');
    //   } else if (propertyType.includes('2-4')) {
    //     form.getRadioGroup(propertyTypeRadioGroup).select('2-4 Unit');
    //   } else if (propertyType.includes('manufactured')) {
    //     form.getRadioGroup(propertyTypeRadioGroup).select('MFD Home');
    //   } else {
    //     form.getRadioGroup(propertyTypeRadioGroup).select('Other');
    //   }
    // }
    
    // Check FHA box if applicable
    if (loanDetails.loanType && loanDetails.loanType.toLowerCase().includes('fha')) {
      form.getCheckBox('topmostSubform[0].Page5[0]._4a_FHA[0]').check();
    }

    //4b doesnot apply check button, make it tick
    form.getCheckBox('topmostSubform[0].Page5[0]._4b_Does_Not_Apply[0]').check();
    


    // --- Down Payment and Assets (Page 5) ---
    // Check if we have gift funds or other assets that might be used for down payment
    if (loanDetails.downPayment > 0) {
      form.getCheckBox('topmostSubform[0].Page5[0]._4d_Does_Not_Apply[0]').uncheck();
      
      // Initialize an array to track sources of funds
      const fundingSources = [];
      
      // Process gift funds if available
      if (assets && assets.giftsAndGrants && assets.giftsAndGrants.length > 0) {
        assets.giftsAndGrants.forEach((gift, index) => {
          if (index < 2) { // Only process first two gifts due to PDF form limitations
            const rowNum = index + 1;
            try {
              // Set gift asset type based on the assetType field
              let assetTypeValue = 'Gift Funds';
              if (gift.assetType && gift.assetType.toLowerCase().includes('equity')) {
                assetTypeValue = 'Gift of Equity';
              } else if (gift.assetType && gift.assetType.toLowerCase().includes('grant')) {
                assetTypeValue = 'Grant';
              }
              
              form.getDropdown(`topmostSubform[0].Page5[0]._4d_Table[0].TR${rowNum}[0]._4d_Asset_Type${rowNum}[0]`).select(assetTypeValue);
              
              // Set source based on the gift source
              let sourceValue = 'Other';
              if (gift.source) {
                const source = gift.source.toLowerCase();
                if (source.includes('relative') || source.includes('family')) {
                  sourceValue = 'Relative';
                } else if (source.includes('employer')) {
                  sourceValue = 'Employer';
                } else if (source.includes('municipality') || source.includes('government')) {
                  sourceValue = 'Municipality';
                } else if (source.includes('nonprofit')) {
                  sourceValue = 'Nonprofit';
                }
              }
              
              form.getDropdown(`topmostSubform[0].Page5[0]._4d_Table[0].TR${rowNum}[0]._4d_Source${rowNum}[0]`).select(sourceValue);
              
              // Set gift amount
              form.getTextField(`topmostSubform[0].Page5[0]._4d_Table[0].TR${rowNum}[0]._4d_Cash${rowNum}[0]`).setText(String(gift.value || 0));
              
              fundingSources.push({
                type: assetTypeValue,
                amount: gift.value || 0
              });
            } catch (e) {
              console.log(`Error setting gift fund fields for row ${rowNum}:`, e.message);
            }
          }
        });
      }
      
      // If no gifts were processed or we need additional rows for down payment
      if (fundingSources.length === 0 || loanDetails.downPayment > fundingSources.reduce((sum, src) => sum + src.amount, 0)) {
        // Calculate remaining amount needed
        const giftTotal = fundingSources.reduce((sum, src) => sum + src.amount, 0);
        const remainingAmount = Math.max(0, loanDetails.downPayment - giftTotal);
        
        if (remainingAmount > 0) {
          // Use the next available row
          const rowNum = fundingSources.length + 1;
          if (rowNum <= 2) { // Only process if we haven't filled 2 rows yet
            try {
              // For remaining amount, use checking/savings or default to Cash
              form.getDropdown(`topmostSubform[0].Page5[0]._4d_Table[0].TR${rowNum}[0]._4d_Asset_Type${rowNum}[0]`).select('Cash');
              form.getDropdown(`topmostSubform[0].Page5[0]._4d_Table[0].TR${rowNum}[0]._4d_Source${rowNum}[0]`).select('Borrower');
              form.getTextField(`topmostSubform[0].Page5[0]._4d_Table[0].TR${rowNum}[0]._4d_Cash${rowNum}[0]`).setText(String(remainingAmount));
            } catch (e) {
              console.log(`Error setting remaining down payment fields for row ${rowNum}:`, e.message);
            }
          }
        }
      }
      
      // If there are closing costs and we haven't filled all rows, add them
      if (loanDetails.closingCosts && loanDetails.closingCosts > 0) {
        const rowNum = Math.min(fundingSources.length + 1, 2); // Use row 2 if available, otherwise stay at max row
        try {
          form.getDropdown(`topmostSubform[0].Page5[0]._4d_Table[0].TR${rowNum}[0]._4d_Asset_Type${rowNum}[0]`).select('Closing Cost');
          form.getDropdown(`topmostSubform[0].Page5[0]._4d_Table[0].TR${rowNum}[0]._4d_Source${rowNum}[0]`).select('Borrower');
          form.getTextField(`topmostSubform[0].Page5[0]._4d_Table[0].TR${rowNum}[0]._4d_Cash${rowNum}[0]`).setText(String(loanDetails.closingCosts));
        } catch (e) {
          console.log(`Error setting closing costs fields for row ${rowNum}:`, e.message);
        }
      }
    } else {
      // No down payment information available
      form.getCheckBox('topmostSubform[0].Page5[0]._4d_Does_Not_Apply[0]').check();
    }
    
    //deposited,not deposited Group 17,18 radiouttons, and object is like:assets


// "Relative"

    // Handle Deposited and Not Deposited radio buttons (Group 17, 18)
    if (assets && assets.checkingAndSavings && assets.checkingAndSavings.length > 0) {
      // Check if any asset is deposited
      const hasDepositedAssets = assets.checkingAndSavings.some(asset => asset.deposited);
      const depositedRadioGroup = 'Group17';
      form.getRadioGroup(depositedRadioGroup).select(hasDepositedAssets ? 'Deposited' : 'Not Deposited');
      // Check if any asset is not deposited
      const hasNotDepositedAssets = assets.checkingAndSavings.some(asset => !asset.deposited);
      const notDepositedRadioGroup = 'Group18';
      form.getRadioGroup(notDepositedRadioGroup).select(hasNotDepositedAssets ? 'Deposited' : 'Not Deposited');
    } 
    else {
      // If no assets, do nothing
    }




    // --- Property Expenses and Existing Loans (Page 5) ---
    //form.getCheckBox('topmostSubform[0].Page5[0]._4d_Does_Not_Apply[0]').check();

    
    // --- Property Expenses Section 4c ---
    if (property.proposedRentalIncome > 0 || property.netMonthlyRentalIncome > 0) {
      form.getCheckBox('topmostSubform[0].Page5[0]._4c_Does_Not_Apply[0]').uncheck();
      
      // Rental income fields
      if (property.proposedRentalIncome > 0) {
        form.getTextField('topmostSubform[0].Page5[0]._4c_Table[0].TR1[0]._4c_Amount1[0]').setText(String(property.proposedRentalIncome));
      }
      
      if (property.netMonthlyRentalIncome > 0) {
        form.getTextField('topmostSubform[0].Page5[0]._4c_Table[0].TR2[0]._4c_Amount2[0]').setText(String(property.netMonthlyRentalIncome));
      }
    } else {
      form.getCheckBox('topmostSubform[0].Page5[0]._4c_Does_Not_Apply[0]').check();
    }
  }



  // --- Declarations (Page 6) ---
  if (declarations) {
  // A. Will you occupy the property as your primary residence?
  form.getRadioGroup('Group19').select(declarations.occupyAsPrimary ? 'YES' : 'NO');

  // A(1). Had ownership interest in the past 3 years
  if (declarations.hadOwnershipInterest !== null) {
    form.getRadioGroup('Group20').select(declarations.hadOwnershipInterest ? 'YES' : 'NO');

    if (declarations.ownedPropertyType) {
      // Dropdown: What type of property did you own? (PR, SR, SH, IP)
      try {
        // Try different possible field names for the property type dropdown
        const possibleFieldNames = [
          'topmostSubform[0].Page6[0].L5a3[0]._5a32[0]._5a_About_A4[0]',
          'topmostSubform[0].Page6[0]._5a_About_A4[0]',
          'topmostSubform[0].Page6[0].L5a3[0]._5a_About_A4[0]'
        ];
        
        let fieldFound = false;
        for (const fieldName of possibleFieldNames) {
          try {
            form.getDropdown(fieldName).select(declarations.ownedPropertyType);
            fieldFound = true;
            break;
          } catch (e) {
            // Field not found, try next one
          }
        }
        
        if (!fieldFound) {
          console.log("Warning: Could not find property type dropdown field in PDF");
        }
      } catch (e) {
        console.log("Error setting property type:", e.message);
      }
    }

    if (declarations.titleHoldingType) {
      // Dropdown: How did you hold title to the property? (S, SP, O)
      try {
        // Try different possible field names for the title holding type dropdown
        const possibleFieldNames = [
          'topmostSubform[0].Page6[0].L5a3[0]._5a33[0]._5a_About_A5[0]',
          'topmostSubform[0].Page6[0]._5a_About_A5[0]',
          'topmostSubform[0].Page6[0].L5a3[0]._5a_About_A5[0]'
        ];
        
        let fieldFound = false;
        for (const fieldName of possibleFieldNames) {
          try {
            form.getDropdown(fieldName).select(declarations.titleHoldingType);
            fieldFound = true;
            break;
          } catch (e) {
            // Field not found, try next one
          }
        }
        
        if (!fieldFound) {
          console.log("Warning: Could not find title holding type dropdown field in PDF");
        }
      } catch (e) {
        console.log("Error setting title holding type:", e.message);
      }
    }
  }

  // B. Family relationship with seller?
  form.getRadioGroup('Group21').select(declarations.familyRelationship ? 'YES' : 'NO');

  // C. Borrowing money
  form.getRadioGroup('Group22').select(declarations.borrowingMoney ? 'YES' : 'NO');
  if (declarations.borrowingMoney && declarations.borrowingMoneyAmount) {
    form.getTextField('topmostSubform[0].Page6[0]._5a_About_C2[0]')
        .setText(String(declarations.borrowingMoneyAmount));
  }

  // D(1). Applying for mortgage on another property?
  form.getRadioGroup('Group23').select(declarations.applyingForMortgage ? 'YES' : 'NO');

  // D(2). Applying for new credit?
  form.getRadioGroup('Group24').select(declarations.applyingForNewCredit ? 'YES' : 'NO');

  // E. Property subject to lien?
  form.getRadioGroup('Group25').select(declarations.propertySubjectToLien ? 'YES' : 'NO');

  // F. Co-signer?
  form.getRadioGroup('Group26').select(declarations.coSigner ? 'YES' : 'NO');

  // G. Outstanding judgments?
  form.getRadioGroup('Group27').select(declarations.outstandingJudgements ? 'YES' : 'NO');

  // H. Delinquent on federal debt?
  form.getRadioGroup('Group28').select(declarations.delinquent ? 'YES' : 'NO');

  // I. Party to lawsuit?
  form.getRadioGroup('Group29').select(declarations.partyToLawsuit ? 'YES' : 'NO');

  // J. Conveyed title?
  form.getRadioGroup('Group30').select(declarations.conveyedTitle ? 'YES' : 'NO');

  // K. Pre-foreclosure sale?
  form.getRadioGroup('Group31').select(declarations.preForeclosureSale ? 'YES' : 'NO');

  // L. Property foreclosed?
  form.getRadioGroup('Group32').select(declarations.propertyForeclosed ? 'YES' : 'NO');

  // M. Declared bankruptcy?
  form.getRadioGroup('Group33').select(declarations.declaredBankruptcy ? 'YES' : 'NO');
  if (declarations.declaredBankruptcy && declarations.bankruptcyType) {
    const chapter = declarations.bankruptcyType.trim().toLowerCase();
    if (chapter === 'chapter 7') {
      form.getCheckBox('topmostSubform[0].Page6[0]._5bM_type[0].ch7[0]._5bM_ch7[0]').check();
    } else if (chapter === 'chapter 11') {
      form.getCheckBox('topmostSubform[0].Page6[0]._5bM_type[0].ch11[0]._5bM_ch11[0]').check();
    } else if (chapter === 'chapter 12') {
      form.getCheckBox('topmostSubform[0].Page6[0]._5bM_type[0].ch12[0]._5bM_ch12[0]').check();
    } else if (chapter === 'chapter 13') {
      form.getCheckBox('topmostSubform[0].Page6[0]._5bM_type[0].ch13[0]._5bM_ch13[0]').check();
    }

    // Optional: store value of bankruptcyType in a text field (if needed)
    form.getTextField('topmostSubform[0].Page6[0]._5a_About_C2[0]')
        .setText(declarations.bankruptcyType);
  }
}


  // --- Demographics (Page 8) ---
  if (demographics) {
    // Ethnicity
    if (demographics.ethnicity === "hispanic") {
      form.getCheckBox('topmostSubform[0].Page8[0].ethnicity[0].hispanic[0]._8_hispanic[0]').check();
      form.getCheckBox('topmostSubform[0].Page8[0].ethnicity[0].not_hispanic[0]._8_not_hispanic[0]').uncheck();
      form.getCheckBox('topmostSubform[0].Page8[0].ethnicity[0].refuse[0]._8_ethnicity_refuse[0]').uncheck();
    
      // Hispanic origin
      if (demographics.origin === "mexican") {
        form.getCheckBox('topmostSubform[0].Page8[0].ethnicity[0].hispanic[0].hispanic[0].mexican[0]._8_ethnicity_Mexican[0]').check();
      } else if (demographics.origin === "puerto-rican") {
        form.getCheckBox('topmostSubform[0].Page8[0].ethnicity[0].hispanic[0].hispanic[0].puertorican[0]._8_ethnicity_Puerto_Rican[0]').check();
      } else if (demographics.origin === "cuban") {
        form.getCheckBox('topmostSubform[0].Page8[0].ethnicity[0].hispanic[0].hispanic[0].cuban[0]._8_ethnicity_Cuban[0]').check();
      } else if (demographics.origin === "other" && demographics.otherOrigin) {
        form.getCheckBox('topmostSubform[0].Page8[0].ethnicity[0].hispanic[0].hispanic[0].other[0]._8_hispanic_other[0]').check();
        form.getTextField('topmostSubform[0].Page8[0].ethnicity[0].hispanic[0].hispanic[0].other[0]._8_other_hispanic[0]').setText(demographics.otherOrigin);
      }
    } else if (demographics.ethnicity === "not-hispanic") {
      form.getCheckBox('topmostSubform[0].Page8[0].ethnicity[0].not_hispanic[0]._8_not_hispanic[0]').check();
      form.getCheckBox('topmostSubform[0].Page8[0].ethnicity[0].hispanic[0]._8_hispanic[0]').uncheck();
      form.getCheckBox('topmostSubform[0].Page8[0].ethnicity[0].refuse[0]._8_ethnicity_refuse[0]').uncheck();
    } else if (demographics.ethnicity === "refuse") {
      form.getCheckBox('topmostSubform[0].Page8[0].ethnicity[0].refuse[0]._8_ethnicity_refuse[0]').check();
      form.getCheckBox('topmostSubform[0].Page8[0].ethnicity[0].hispanic[0]._8_hispanic[0]').uncheck();
      form.getCheckBox('topmostSubform[0].Page8[0].ethnicity[0].not_hispanic[0]._8_not_hispanic[0]').uncheck();
    }
    
    // Race
    if (demographics.race === "american-indian") {
      form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].native_american[0]._8_race_native_american[0]').check();
      if (demographics.tribe) {
        form.getTextField('topmostSubform[0].Page8[0]._8_race[0].native_american[0]._8_race_tribe[0]').setText(demographics.tribe);
      }
    } else if (demographics.race === "asian") {
      form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].asian[0]._8_race_asian[0]').check();
      
      // Asian sub-origin
      if (demographics.asianOrigin === "indian") {
        form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].asian[0].asian[0].indian[0]._8_race_indian[0]').check();
      } else if (demographics.asianOrigin === "chinese") {
        form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].asian[0].asian[0].chinese[0]._8_race_chinese[0]').check();
      } else if (demographics.asianOrigin === "filipino") {
        form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].asian[0].asian[0].filipino[0]._8_race_filipino[0]').check();
      } else if (demographics.asianOrigin === "japanese") {
        form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].asian[0].asian[0].japanese[0]._8_race_japanese[0]').check();
      } else if (demographics.asianOrigin === "korean") {
        form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].asian[0].asian[0].korean[0]._8_race_korean[0]').check();
      } else if (demographics.asianOrigin === "vietnamese") {
        form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].asian[0].asian[0].vietnamese[0]._8_race_vietnamese[0]').check();
      } else if (demographics.asianOrigin === "other" && demographics.otherOrigin) {
        form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].asian[0].asian[0].other[0]._8_race_asian_other[0]').check();
        form.getTextField('topmostSubform[0].Page8[0]._8_race[0].asian[0].asian[0].other[0]._8_asian_race[0]').setText(demographics.otherOrigin);
      }
    } else if (demographics.race === "black") {
      form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].black[0]._8_race_black[0]').check();
    } else if (demographics.race === "pacific-islander") {
      form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].pacific[0]._8_race_pacific[0]').check();
      
      // Pacific Islander sub-origin
      if (demographics.pacificIslanderOrigin === "hawaiian") {
        form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].pacific[0].pacific[0].hawaiian[0]._8_race_hawaiian[0]').check();
      } else if (demographics.pacificIslanderOrigin === "guamanian") {
        form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].pacific[0].pacific[0].guanamian[0]._8_race_guamanian[0]').check();
      } else if (demographics.pacificIslanderOrigin === "samoan") {
        form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].pacific[0].pacific[0].samoan[0]._8_race_samoan[0]').check();
      } else if (demographics.pacificIslanderOrigin === "other" && demographics.otherOrigin) {
        form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].pacific[0].pacific[0].other[0]._8_race_pacific_other[0]').check();
        form.getTextField('topmostSubform[0].Page8[0]._8_race[0].pacific[0].pacific[0].other[0]._8_pacific_race[0]').setText(demographics.otherOrigin);
      }
    } else if (demographics.race === "white") {
      form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].white[0]._8_race_white[0]').check();
    } else if (demographics.race === "refuse") {
      form.getCheckBox('topmostSubform[0].Page8[0]._8_race[0].not_provide[0]._8_race_refuse[0]').check();
    }
    
    // Gender
    if (demographics.gender === "male") {
      form.getRadioGroup('Group35').select('Male');
    } else if (demographics.gender === "female") {
      form.getRadioGroup('Group35').select('Female');
    } else {
      form.getRadioGroup('Group35').select('I do not wish to provide this information');
    }
  }
  
  // --- Military Service (Page 8) ---
  //define military service object
  const militaryService = loanDetails.militaryService || null;
  if (militaryService) {
    if (militaryService.hasServed) {
      // Currently serving
      if (militaryService.currentlyServing) {
        form.getCheckBox('topmostSubform[0].Page8[0]._7[0].current[0]._7_current[0]').check();
        
        // Active duty expiration date if available
        if (militaryService.expirationDate) {
          const expDate = new Date(militaryService.expirationDate);
          form.getTextField('topmostSubform[0].Page8[0]._7[0].current[0]._7_Active_Duty_Month[0]').setText(String(expDate.getMonth() + 1).padStart(2, '0'));
          form.getTextField('topmostSubform[0].Page8[0]._7[0].current[0]._7_Active_Duty_day[0]').setText(String(expDate.getDate()).padStart(2, '0'));
          form.getTextField('topmostSubform[0].Page8[0]._7[0].current[0]._7_Active_Duty_Year[0]').setText(String(expDate.getFullYear()));
        }
      } else {
        form.getCheckBox('topmostSubform[0].Page8[0]._7[0].current[0]._7_current[0]').uncheck();
      }
      
      // Retired status
      if (militaryService.isRetired) {
        form.getCheckBox('topmostSubform[0].Page8[0]._7[0].retired[0]._7_retired[0]').check();
      } else {
        form.getCheckBox('topmostSubform[0].Page8[0]._7[0].retired[0]._7_retired[0]').uncheck();
      }
      
      // Non-activated status
      if (militaryService.isNonActivated) {
        form.getCheckBox('topmostSubform[0].Page8[0]._7[0].non_active[0]._7_non_active[0]').check();
      } else {
        form.getCheckBox('topmostSubform[0].Page8[0]._7[0].non_active[0]._7_non_active[0]').uncheck();
      }
      
      // Surviving spouse status
      if (militaryService.isSurvivingSpouse) {
        form.getCheckBox('topmostSubform[0].Page8[0]._7[0].surviving[0]._7_surviving[0]').check();
      } else {
        form.getCheckBox('topmostSubform[0].Page8[0]._7[0].surviving[0]._7_surviving[0]').uncheck();
      }
    }
  }

  // --- Final PDF Preparation ---
  // Clear all extra "Does Not Apply" checkboxes to ensure they're in the correct state
  form.getCheckBox('topmostSubform[0].Page3[0]._2b_Does_Not_Apply[0]').check();
  form.getCheckBox('topmostSubform[0].Page4[0]._3_Do_Not_Own[0]').check();
  form.getCheckBox('topmostSubform[0].Page4[0]._3b_No_Additional[0]').check();
  form.getCheckBox('topmostSubform[0].Page4[0]._3c_No_Additional[0]').check();
  
  // Add signature date (current date)
  const today = new Date();
  const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
  
  try {
    form.getTextField('topmostSubform[0].Page9[0].f9_159[0]').setText(formattedDate);
  } catch (e) {
    console.log('Error setting signature date:', e.message);
  }
  
  // Flatten the form to prevent further editing (optional)
  //form.flatten();
  
  // --- Save the filled PDF ---
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// Debug utility
const debug = (message, data) => {
  console.log(`[LoanDetails] ${message}`, data);
};

const normalizeEmploymentType = (loan) => {
  if (!loan) return "employee";

  const extractType = (value) => {
    if (value === undefined || value === null) return null;
    const str = String(value).toLowerCase();

    if (["yes", "true", "self", "self-employed", "self_employed"].some((token) => str.includes(token))) {
      return "self-employed";
    }

    if (["1099", "contractor"].some((token) => str.includes(token))) {
      return "self-employed";
    }

    if (["no", "false", "w2", "w-2", "employee"].some((token) => str.includes(token))) {
      return "employee";
    }

    return null;
  };

  const candidateValues = [
    loan?.borrower?.employment?.employmentType,
    loan?.borrowerDetails?.employmentType,
    loan?.employmentType,
    loan?.loanDetails?.employmentType,
    loan?.borrowerDetails?.employers?.[0]?.isSelfEmployed,
    loan?.borrowerDetails?.employers?.[0]?.employmentStatus,
  ];

  for (const value of candidateValues) {
    const normalized = extractType(value);
    if (normalized) {
      return normalized;
    }
  }

  return "employee";
};

const deriveOwnsHome = (loan) => {
  if (!loan) return false;

  const rawValues = [
    loan?.propertiesOwned?.ownsProperty,
    loan?.borrowerDetails?.propertiesOwned?.ownsProperty,
    loan?.borrowerDetails?.ownsProperty,
  ];

  for (const value of rawValues) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (["yes", "true", "y", "1"].includes(lower)) return true;
      if (["no", "false", "n", "0"].includes(lower)) return false;
    } else {
      return Boolean(value);
    }
  }

  return false;
};

const LoanDetails = ({ backUrl, isCompanyView } = {}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;
  const [loan, setLoan] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard"); // Change this line
  // At the top of your component
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedLoan, setLastSavedLoan] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [cachedData, setCachedData] = useState(null);

  // Tabs where the bar should NOT show
  const NO_SAVE_TABS = ["dashboard", "documents", "milestones"];
  
  // Tabs where save functionality is needed
  const SAVE_TABS = ["borrower", "loan", "property", "financial", "additional"];

  // Call this to cancel changes
  const handleCancel = () => {
    // Revert unsaved edits to last persisted snapshot
    if (lastSavedLoan) {
      setLoan(lastSavedLoan);
    }
    setHasUnsavedChanges(false);
  };

  // Save all changes to the loan
  const saveLoan = async () => {
    try {
      setSaving(true);
      const response = await lenderService.updateLoan(id, loan);
      const savedLoan = response?.data?.data || loan;
      setLoan(savedLoan);
      setLastSavedLoan(savedLoan);
      toast.success("Loan details saved successfully");
      setSaving(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving loan:", error);
      toast.error("Failed to save loan details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Helper function to normalize loan data structure
  const normalizeData = (loanData) => {
    return {
      borrowerDetails: loanData.borrowerDetails || {},
      loanDetails: loanData.loanDetails || {},
      property: loanData.property || {},
      income: loanData.income || {},
      assets: loanData.assets || [],
      debts: loanData.debts || [],
      propertiesOwned: loanData.propertiesOwned || [],
      declarations: loanData.declarations || {},
      demographics: loanData.demographics || {},
      militaryService: loanData.militaryService || {},
      ...loanData,
    };
  };

  // Add new state to track accordion expansion
  // Legacy accordion state (Application tab) removed; keep true for layout components expecting it.
  const [isApplicationExpanded] = useState(true);
  
  // State for mobile navigation drawer
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const employmentType = useMemo(() => normalizeEmploymentType(loan), [loan]);
  const ownsHome = useMemo(() => deriveOwnsHome(loan), [loan]);

  // Functions to handle dependents array
  const handleAddDependent = () => {
    setLoan(prevLoan => ({
      ...prevLoan,
      borrowerDetails: {
        ...(prevLoan.borrowerDetails || {}),
        dependents: [...(prevLoan.borrowerDetails?.dependents || []), { name: '', age: '', relationship: '' }]
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleRemoveDependent = (index) => {
    setLoan(prevLoan => ({
      ...prevLoan,
      borrowerDetails: {
        ...(prevLoan.borrowerDetails || {}),
        dependents: prevLoan.borrowerDetails?.dependents?.filter((_, i) => i !== index) || []
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleDependentChange = (index, field, value) => {
    setLoan(prevLoan => ({
      ...prevLoan,
      borrowerDetails: {
        ...(prevLoan.borrowerDetails || {}),
        dependents: prevLoan.borrowerDetails?.dependents?.map((dependent, i) => 
          i === index ? { ...dependent, [field]: value } : dependent
        ) || []
      }
    }));
    setHasUnsavedChanges(true);
  };

  // Tab order (per spec): keep a single flat list in the left nav
  const mainTabs = [
    { id: "dashboard", label: "Loan Dashboard", icon: BarChart2 },
    { id: "borrower", label: "Borrower Information", icon: User },
    { id: "loan", label: "Loan Details", icon: FileText },
    { id: "property", label: "Property Information", icon: Home },
    { id: "financial", label: "Financial Information", icon: Wallet },
    { id: "documents", label: "Documents", icon: Files },
    ...(PPE_ENABLED
      ? [{ id: "products-pricing", label: "PPE", icon: SlidersHorizontal }]
      : []),
    { id: "milestones", label: "Milestones", icon: Trophy },
    // MCR Tabs (separator handled in VerticalTabNavigation)
    { id: "audit-dates", label: "Audits and Dates", icon: CalendarClock, isMCR: true },
    { id: "funding-revenue", label: "Funding and Revenue", icon: DollarSign, isMCR: true },
    { id: "mcr-audit", label: "MCR Data", icon: ShieldCheck, isMCR: true },
    { id: "additional", label: "Additional Information", icon: ClipboardList },
  ];

  const applicationSubTabs = [];
  // Create a flat array of all valid tabs for validation
  const allTabs = [
    ...mainTabs.map((tab) => tab.id),
    ...applicationSubTabs.map((tab) => tab.id),
  ];

  // Function to handle tab clicks
  const handleTabClick = (tabId) => {
    router.push(`/lender/loans/${id}?tab=${tabId}`, undefined, {
      shallow: true,
    });
    setActiveTab(tabId);
  };

  const isSubTabActive = false;

  // Sync active tab from URL query without overriding immediate user clicks.
  useEffect(() => {
    if (!router.isReady || !id) return;

    const tabFromUrl =
      typeof router.query.tab === "string" ? router.query.tab : null;
    const isValidTab = allTabs.includes(tabFromUrl);

    if (tabFromUrl && isValidTab) {
      // Only update state when URL tab actually changed.
      if (tabFromUrl !== activeTab) {
        setActiveTab(tabFromUrl);
      }

      // If it's a sub-tab, keep accordion expanded.
      if (
        applicationSubTabs.some((tab) => tab.id === tabFromUrl) &&
        !isApplicationExpanded
      ) {
        setIsApplicationExpanded(true);
      }
    } else if (!tabFromUrl && activeTab !== "dashboard") {
      // If no tab is specified, set URL default once.
      router.push(`/lender/loans/${id}?tab=dashboard`, undefined, {
        shallow: true,
      });
    } else if (tabFromUrl === "products-pricing" && !PPE_ENABLED) {
      router.push(`/lender/loans/${id}?tab=dashboard`, undefined, {
        shallow: true,
      });
      setActiveTab("dashboard");
    }
  }, [router.isReady, router.query.tab, id, activeTab, isApplicationExpanded]);

  // Inside the LoanDetails component, add a new state for parameters data
  const [parametersData, setParametersData] = useState(null);
  const [loadingParameters, setLoadingParameters] = useState(false);

  // Add a function to fetch the parameters data
  const fetchLoanParameters = async () => {
    if (!id) return;

    try {
      setLoadingParameters(true);
      // Replace this with your actual API call to get the parameters data
      const response = await lenderService.getLoanParameters(id);
      if (response && response.data) {
        setParametersData(response.data);
      }
    } catch (error) {
      console.error("Error fetching loan parameters:", error);
    } finally {
      setLoadingParameters(false);
    }
  };

  // Update the useEffect that fetches loan details to also fetch parameters
  useEffect(() => {
    // Your existing loan details fetching code

    // Then fetch parameters if tab is dashboard
    if (activeTab === "dashboard") {
      fetchLoanParameters();
    }
  }, [id, activeTab]);

  const fetchLoanDetails = async (forceRefresh = false) => {
    try {
      // Check if we have cached data and it's less than 30 seconds old
      const now = Date.now();
      const cacheAge = now - (lastFetchTime || 0);
      const cacheValid = cacheAge < 30000; // 30 seconds cache

      if (!forceRefresh && cachedData && cacheValid) {
        console.log("Using cached data (age:", cacheAge, "ms)");
        setLoan(cachedData.loan);
        setLastSavedLoan(cachedData.loan);
        setDocuments(cachedData.documents);
        return;
      }

      setLoading(true);
      setError(null);

      // Try the optimized endpoint first, fallback to original if it fails
      let response;
      try {
        // Use lender service for both lender and company users
        // The backend will handle authorization based on user role
        response = await lenderService.getLoanWithDetails(id);
        console.log("Response from getLoanWithDetails:", response);
      } catch (error) {
        console.warn("getLoanWithDetails failed, falling back to original endpoint:", error);
        // Fallback to original endpoint
        response = await lenderService.getLoan(id);
        console.log("Response from original getLoan:", response);
      }
      
      if (response && response.data) {
        // Handle different response structures from different endpoints
        let loanData, docsData, milestonesData;
        
        if (response.data.data.loan) {
          // New optimized endpoint structure
          loanData = response.data.data.loan;
          docsData = response.data.data.documents;
          milestonesData = response.data.data.milestones;
          console.log("🔍 [DEBUG] Using new endpoint structure");
        } else {
          // Original endpoint structure
          loanData = response.data.data;
          docsData = []; // Documents will be fetched separately if needed
          milestonesData = [];
          console.log("🔍 [DEBUG] Using original endpoint structure");
        }
        
        console.log("🔍 [DEBUG] Full response structure:", response.data);
        console.log("🔍 [DEBUG] response.data.data:", response.data.data);
        
        // Handle the case where loanData might be nested differently
        const actualLoanData = loanData?.data || loanData;
        
        // Ensure all required properties exist with defaults
        const normalizedData = {
          borrowerDetails: actualLoanData?.borrowerDetails || {},
          loanDetails: actualLoanData?.loanDetails || {},
          property: actualLoanData?.property || {},
          income: actualLoanData?.income || {},
          assets: actualLoanData?.assets || [],
          debts: actualLoanData?.debts || [],
          propertiesOwned: actualLoanData?.propertiesOwned || [],
          declarations: actualLoanData?.declarations || {},
          demographics: actualLoanData?.demographics || {},
          militaryService: actualLoanData?.militaryService || {},
          ...actualLoanData,
        };

        console.log("Normalized data structure:", normalizedData);
        setLoan(normalizedData);
        setLastSavedLoan(normalizedData);
        
        // Set documents and milestones from the same response
        setDocuments(Array.isArray(docsData) ? docsData : []);
        setMilestones(Array.isArray(milestonesData) ? milestonesData : []);
        
        // Debug logging for milestones
        console.log("🔍 [DEBUG] Milestones data from API:", milestonesData);
        console.log("🔍 [DEBUG] Milestones array length:", Array.isArray(milestonesData) ? milestonesData.length : 'Not an array');
        console.log("🔍 [DEBUG] Milestones data type:", typeof milestonesData);
        
        // If documents weren't included in the response, fetch them separately
        if (!Array.isArray(docsData) || docsData.length === 0) {
          try {
            const docsResponse = await lenderService.getLoanDocuments(id);
            if (docsResponse && docsResponse.data) {
              const separateDocsData = docsResponse.data?.data || docsResponse.data;
              setDocuments(Array.isArray(separateDocsData) ? separateDocsData : []);
            }
          } catch (docError) {
            console.error("Error fetching loan documents:", docError);
          }
        }
        
        // Cache the data for future use
        setCachedData({
          loan: normalizedData,
          documents: Array.isArray(docsData) ? docsData : [],
          milestones: milestonesData || []
        });
        setLastFetchTime(Date.now());
        
        // Store milestones in state if needed for the dashboard
        if (activeTab === "dashboard" && milestonesData) {
          // You can store milestones in state if needed for other components
          console.log("Milestones loaded:", milestonesData.length);
        }
      } else {
        console.warn("Failed to fetch loan details");
        setError("Failed to load loan details");
        toast.error("Failed to load loan details");
      }
    } catch (error) {
      console.error("Error fetching loan details:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to load loan details. Please try again later.";
      if (error.response?.status === 404) {
        errorMessage = "Loan not found. It may have been deleted or you don't have permission to view it.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to view this loan.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      setError("An error occurred while loading the loan details");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // Don't fetch until id is available
    if (!id) return;

    fetchLoanDetails();
  }, [id]);

  // Function to refresh data (useful for after updates)
  const refreshData = () => {
    fetchLoanDetails(true); // Force refresh
  };

  const handleRemoveDocument = async (documentId) => {
    // Document removal is only for borrowers, but we can show a message here
    toast.info("Only borrowers can remove documents");
  };

  const getStatusBadgeColor = (status) => {
    if (!status) return "bg-gray-50 text-gray-800";

    status = status.toLowerCase();
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-800";
      case "approved":
        return "bg-green-50 text-green-800";
      case "rejected":
        return "bg-red-50 text-red-800";
      case "closed":
        return "bg-gray-50 text-gray-800";
      case "draft":
        return "bg-blue-50 text-blue-800";
      default:
        return "bg-gray-50 text-gray-800";
    }
  };

  // Handle form field changes with better null checks
  const handleFieldChange = (section, field, value) => {
    console.log(`Updating ${section}.${field} with:`, value);
    // Set unsaved changes flag
    setHasUnsavedChanges(true);
    
    setLoan((prev) => {
      const prevSectionData = prev[section] || {};

      // Split the field string by '.' to handle nested fields
      const fieldParts = field.split('.');

      if (fieldParts.length > 1) {
        // Handle nested fields (e.g., "borrowerDetails.currentAddress.streetAddress")
        const topLevelField = fieldParts[0]; // e.g., "currentAddress"
        const nestedFields = fieldParts.slice(1); // e.g., ["streetAddress"]

        let updatedTopLevelData = { ...(prevSectionData[topLevelField] || {}) };
        let currentNested = updatedTopLevelData;

        // Traverse and create/update nested objects
        for (let i = 0; i < nestedFields.length; i++) {
          const part = nestedFields[i];
          if (i === nestedFields.length - 1) {
            // Last part is the actual field to update
            currentNested[part] = value;
          } else {
            // Create nested object if it doesn't exist
            currentNested[part] = { ...(currentNested[part] || {}) };
            currentNested = currentNested[part];
          }
        }

        return {
          ...prev,
          [section]: {
            ...prevSectionData,
            [topLevelField]: updatedTopLevelData,
          },
        };
      } else { // Removed the 'addresses' special case here
        // Handle top-level fields within a section (or whole objects like mailingAddress)
        return {
          ...prev,
          [section]: {
            ...prevSectionData,
            [field]: value,
          },
        };
      }
    });
  };

  // First implementation of handleNestedFieldChange is removed to avoid duplication.
  // Using the second implementation at line ~1068 with debug() instead of console.log()


  const handleDownloadURLA = async () => {
    try {
      const pdfBytes = await generateURLAPdf(loan.borrowerDetails, loan.assets, loan.income, loan.debts, loan.propertiesOwned, loan.loanDetails, loan.property, loan.declarations, loan.demographics);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `URLA_${loan.loanNumber || loan._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("URLA PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating URLA PDF:", error);
      toast.error("Failed to generate URLA PDF: " + error.message);
    }
  };

  const handleDownloadMismoXml = () => {
    if (!loan) {
      toast.error("Loan data not available");
      return;
    }
    
    try {
      // Generate XML string from loan data
      const xmlString = generateMismoXml(loan);
      
      // Download as XML file
      const filename = `MISMO_${loan.loanNumber || loan._id}.xml`;
      downloadXmlFile(xmlString, filename);
      
      toast.success("MISMO 3.4 file downloaded successfully");
    } catch (error) {
      console.error("Error generating MISMO XML:", error);
      toast.error("Failed to generate MISMO 3.4 file");
    }
  };

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Phase 4: GHL opportunity manual sync (button-driven)
  const [showGhlOpportunityModal, setShowGhlOpportunityModal] = useState(false);
  const [ghlPipelines, setGhlPipelines] = useState([]);
  const [ghlPipelineId, setGhlPipelineId] = useState('');
  const [ghlPipelineStageId, setGhlPipelineStageId] = useState('');
  const [ghlOpportunityStatus, setGhlOpportunityStatus] = useState('open');
  const [syncingToGhl, setSyncingToGhl] = useState(false);
  const [ghlOppError, setGhlOppError] = useState('');
  const [linkingBorrowerToGhl, setLinkingBorrowerToGhl] = useState(false);
  const [openGhlSelect, setOpenGhlSelect] = useState(null); // 'pipeline' | 'stage' | 'status' | null
  const ghlModalRef = useRef(null);
  const [ghlContacts, setGhlContacts] = useState([]);
  const [ghlContactId, setGhlContactId] = useState('');
  
  // Status colors are now defined directly in the className with Tailwind

  const handleNoteButtonClick = () => {
    debug('Opening note modal', { loanId: id });
    setIsNoteModalOpen(true);
  };

  const handleMessageButtonClick = () => {
    debug('Opening message modal', { loanId: id });
    setIsMessageModalOpen(true);
  };
  
  const handleSettingsButtonClick = () => {
    debug('Opening settings modal', { loanId: id });
    setIsSettingsModalOpen(true);
  };

  const openGhlOpportunityDialog = async () => {
    try {
      setShowGhlOpportunityModal(true);
      setGhlOppError('');
      const [pRes, cRes] = await Promise.all([
        lenderService.getGhlOpportunityPipelines(),
        lenderService.getGhlLoanOfficerContacts()
      ]);
      const pipelines = pRes?.data?.data?.pipelines || [];
      const contacts = cRes?.data?.data?.contacts || [];
      setGhlPipelines(pipelines);
      setGhlContacts(contacts);
      if (pipelines.length && !ghlPipelineId) {
        setGhlPipelineId(pipelines[0]._id || pipelines[0].id || '');
      }
      // Default contact to the current loan's borrower contact if present in list
      if (!ghlContactId && loan?._id) {
        const borrowerId = loan?.borrower?._id || loan?.borrower;
        const match = contacts.find((c) => String(c.borrowerId) === String(borrowerId));
        if (match?.ghlContactId) setGhlContactId(match.ghlContactId);
      }
    } catch (e) {
      console.error('Error loading GHL pipelines:', e);
      const msg = e?.response?.data?.message || 'Failed to load GHL pipelines';
      setGhlOppError(msg);
      toast.error(msg);
    }
  };

  const selectedPipeline = ghlPipelines.find((p) => String(p?._id || p?.id) === String(ghlPipelineId));
  const pipelineStages =
    selectedPipeline?.stages ||
    selectedPipeline?.pipelineStages ||
    selectedPipeline?.stagesList ||
    [];

  useEffect(() => {
    if (!showGhlOpportunityModal) return;
    const onDocMouseDown = (e) => {
      if (!ghlModalRef.current) return;
      if (!ghlModalRef.current.contains(e.target)) {
        setOpenGhlSelect(null);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [showGhlOpportunityModal]);

  const Dropdown = ({
    id,
    label,
    value,
    onChange,
    options,
    placeholder = 'Select...',
    disabled = false
  }) => {
    const isOpen = openGhlSelect === id;
    const selected = options.find((o) => String(o.value) === String(value)) || null;
    return (
      <div className="relative">
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpenGhlSelect((prev) => (prev === id ? null : id))}
          className="w-full text-left bg-white border border-gray-300 rounded-lg px-3 pr-9 py-2.5 text-sm text-gray-900 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:border-gray-300"
        >
          <span className={selected ? 'text-gray-900' : 'text-gray-500'}>
            {selected ? selected.label : placeholder}
          </span>
          <svg
            className="pointer-events-none absolute right-3 top-9 h-4 w-4 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
            <div className="max-h-56 overflow-auto py-1">
              {options.map((opt) => {
                const active = String(opt.value) === String(value);
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setOpenGhlSelect(null);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                      active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
              {!options.length && (
                <div className="px-3 py-2 text-sm text-gray-500">No options</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  
  // Handle nested field changes
  const handleNestedFieldChange = (section, nestedSection, field, value) => {
    debug(`Updating ${section}.${nestedSection}.${field} with:`, value);
    setHasUnsavedChanges(true);
    
    setLoan((prev) => {
      // Make sure the section and nested section exist
      const sectionData = prev[section] || {};
      const nestedSectionData = sectionData[nestedSection] || {};
      
      // Create the updated nested section with the new field value
      const updatedNestedSection = {
        ...nestedSectionData,
        [field]: value
      };
      
      // Create the updated section with the new nested section
      const updatedSection = {
        ...sectionData,
        [nestedSection]: updatedNestedSection
      };
      
      // Return the updated loan data
      return {
        ...prev,
        [section]: updatedSection
      };
    });
  };
  
  // Monitor changes to hasUnsavedChanges
  useEffect(() => {
    console.log(`hasUnsavedChanges changed to: ${hasUnsavedChanges}`, {
      activeTab,
      isExcludedTab: NO_SAVE_TABS.includes(activeTab)
    });
  }, [hasUnsavedChanges, activeTab]);

  const handleSendPreApprovalLetter = async () => {
    try {
      // Show loading toast
      const loadingToastId = toast.loading('Sending pre-approval letter...');
      
      // Use the loan service to send the pre-approval letter
      const result = await loanService.sendPreApprovalLetter(id);
      
      // Dismiss the loading toast
      toast.dismiss(loadingToastId);
      
      if (result.success) {
        // Show success toast
        toast.success('Pre-approval letter sent successfully!');
        
        // If the loan status was updated, refresh the loan details
        if (result.data?.data?.loanStatus !== loan.status) {
          fetchLoanDetails();
        }
      } else {
        // Show error toast
        toast.error(`Failed to send pre-approval letter: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending pre-approval letter:', error);
      toast.error('Failed to send pre-approval letter. Please try again.');
    }
  };

  return (
    <ProtectedRoute allowedRoles={["lender", "company"]}>
      <MainLayout>
        <div className="overflow-hidden">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <LoanDetailsSkeleton />
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error loading loan details
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : loan ? (
              <>
                {/* GHL Opportunity Sync Modal */}
                {showGhlOpportunityModal && (
                  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
                    <div ref={ghlModalRef} className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 border border-gray-100">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Add Loan to GHL Pipeline</h2>
                      <p className="text-sm text-gray-600 mb-4">
                        Select a pipeline stage and opportunity status. The opportunity will be assigned to you automatically.
                      </p>

                      {ghlOppError && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                          {ghlOppError}
                        </div>
                      )}

                      <div className="space-y-4">
                        <Dropdown
                          id="contact"
                          label="Contact"
                          value={ghlContactId}
                          onChange={(val) => setGhlContactId(val)}
                          options={ghlContacts.map((c) => ({
                            value: c.ghlContactId,
                            label: `${c.name}${c.email ? ` • ${c.email}` : ''}`
                          }))}
                          placeholder="Select contact"
                        />

                        <Dropdown
                          id="pipeline"
                          label="Pipeline"
                          value={ghlPipelineId}
                          onChange={(val) => {
                            setGhlPipelineId(val);
                            setGhlPipelineStageId('');
                          }}
                          options={ghlPipelines.map((p) => ({ value: p._id || p.id, label: p.name || (p._id || p.id) }))}
                          placeholder="Select pipeline"
                        />

                        <Dropdown
                          id="stage"
                          label="Pipeline Stage"
                          value={ghlPipelineStageId}
                          onChange={(val) => setGhlPipelineStageId(val)}
                          options={pipelineStages.map((s) => ({ value: s._id || s.id, label: s.name || (s._id || s.id) }))}
                          placeholder="Select stage"
                          disabled={!ghlPipelineId}
                        />

                        <Dropdown
                          id="status"
                          label="Opportunity Status"
                          value={ghlOpportunityStatus}
                          onChange={(val) => setGhlOpportunityStatus(val)}
                          options={[
                            { value: 'open', label: 'Open' },
                            { value: 'won', label: 'Won' },
                            { value: 'lost', label: 'Lost' }
                          ]}
                          placeholder="Select status"
                        />
                      </div>

                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          type="button"
                          onClick={() => setShowGhlOpportunityModal(false)}
                          className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                          disabled={syncingToGhl}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!ghlPipelineId) {
                              toast.error('Please select a pipeline.');
                              return;
                            }
                            if (!ghlPipelineStageId) {
                              toast.error('Please select a pipeline stage.');
                              return;
                            }
                            if (!ghlContactId) {
                              toast.error('Please select a contact.');
                              return;
                            }
                            try {
                              setSyncingToGhl(true);
                              setGhlOppError('');
                              await lenderService.syncLoanToGhlOpportunity({
                                loanId: loan._id,
                                pipelineId: ghlPipelineId,
                                pipelineStageId: ghlPipelineStageId,
                                opportunityStatus: ghlOpportunityStatus,
                                contactId: ghlContactId
                              });
                              toast.success('Loan added to GHL pipeline');
                              setShowGhlOpportunityModal(false);
                              await fetchLoanDetails(true);
                            } catch (e) {
                              console.error('Error syncing loan to GHL:', e);
                              const msg = e?.response?.data?.message || 'Failed to sync loan to GHL';
                              setGhlOppError(msg);
                              toast.error(msg);
                            } finally {
                              setSyncingToGhl(false);
                            }
                          }}
                          className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                          disabled={syncingToGhl}
                        >
                          {syncingToGhl ? 'Syncing…' : 'Add to Pipeline'}
                        </button>
                      </div>

                      {ghlOppError && ghlOppError.toLowerCase().includes('linked ghl contact') && (
                        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                          <div className="text-sm text-amber-800">
                            Borrower isn’t linked to GHL yet. Link the borrower contact first, then try again.
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                setLinkingBorrowerToGhl(true);
                                setGhlOppError('');
                                const borrowerId = loan?.borrower?._id || loan?.borrower;
                                if (!borrowerId) {
                                  setGhlOppError('Unable to resolve borrowerId for this loan.');
                                  return;
                                }
                                await lenderService.linkBorrowerContactToGhl(borrowerId);
                                toast.success('Borrower linked to GHL');
                              } catch (e) {
                                const msg = e?.response?.data?.message || 'Failed to link borrower to GHL';
                                setGhlOppError(msg);
                                toast.error(msg);
                              } finally {
                                setLinkingBorrowerToGhl(false);
                              }
                            }}
                            className="shrink-0 px-3 py-1.5 text-sm rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
                            disabled={linkingBorrowerToGhl || syncingToGhl}
                          >
                            {linkingBorrowerToGhl ? 'Linking…' : 'Link Borrower'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="max-w-7xl mx-auto overflow-hidden">
                  <div className="flex items-center gap-3 mb-3 min-h-[2.5rem]">

                    <Link
                      href={user?.role === "lender" ? "/lender/loans" : "/company/lenders"}
                      className="group flex items-center px-2 py-1 rounded hover:bg-gray-100 transition"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 group-hover:text-primary transition"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-1 text-sm font-medium text-gray-500 group-hover:text-primary transition">
                        Go Back
                      </span>
                    </Link>
                    <span className="block w-px h-5 bg-gray-200"></span>
                    <h1 className="text-xl font-bold sm:text-2xl text-gray-900 tracking-tight leading-none">
                      Loan Application Details
                    </h1>
                  </div>
                </div>
                <div className="bg-white shadow-sm rounded-lg mb-6 px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-md p-2">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <rect x="4" y="3" width="16" height="18" rx="2" />
                          <path d="M8 7h8M8 11h4M8 15h8" />
                          <text x="16" y="17" fontSize="8" fill="currentColor">
                            $
                          </text>
                        </svg>
                      </div>
                      <div className="ml-2 min-w-0">
                        <h2 className="text-lg sm:text-xs lg:text-lg font-semibold truncate text-gray-900">
                          Loan {loan?.loanNumber || ""}
                        </h2>
                        <p className="text-xs text-gray-500 truncate ">
                          {loan?.loanDetails?.loanType || "Loan"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="flex items-center gap-1">
                          {user?.role === "lender" && (
                            <>
                              <button
                                title="Add Note"
                                onClick={handleNoteButtonClick}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                              >
                                <StickyNote className="h-5 w-5" />
                              </button>
                              <button
                                title="Send Message"
                                onClick={handleMessageButtonClick}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                              >
                                <MessageCircle className="h-5 w-5" />
                              </button>
                            </>
                          )}

                          {user?.role !== "admin" && (
                            <button
                              title="Credit Report"
                              onClick={() => {
                                router.push({
                                  pathname: `/lender/loans/${id}/credit-report`,
                                  query: {
                                    lenderId: loan?.lender, // Pass the lenderId 
                                  }
                                });
                              }}
                              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                            >
                              <CreditCard className="h-5 w-5" />
                            </button>
                          )}

                          
                          <button
                            title="Download 3.4 File"
                            onClick={handleDownloadMismoXml}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                          >
                            <Download className="h-5 w-5" />
                          </button>

                          <button
                            title="Download URLA"
                            onClick={handleDownloadURLA}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                          >
                            <FileText className="h-5 w-5" />
                          </button>
                          
                          <button
                            title="Application Settings"
                            onClick={handleSettingsButtonClick}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                          >
                            <Settings className="h-5 w-5" />
                          </button>
                          
                        </div>
                        <div className="w-full lg:w-auto flex items-center col-span-1 sm:col-span-2 lg:col-span-1">
                          {loan?.ghlOpportunityId ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] lg:text-xs font-semibold bg-green-50 text-green-800 border border-green-200 max-w-[170px]"
                                title={`GHL Opportunity ID: ${loan.ghlOpportunityId}`}
                              >
                                <span>GHL Synced</span>
                                <span className="font-mono text-[9px] lg:text-[10px] text-green-700 truncate max-w-[78px]">
                                  {String(loan.ghlOpportunityId).slice(0, 10)}…
                                </span>
                              </span>
                              <button
                                onClick={openGhlOpportunityDialog}
                                className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md font-semibold border border-green-600 text-green-700 bg-white hover:bg-green-50 shadow-sm transition-all duration-200 text-[10px] lg:text-xs leading-none"
                                title="Update this existing GHL opportunity"
                              >
                                Update
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={openGhlOpportunityDialog}
                              disabled={Boolean(loan?.ghlPipelineSlotBlocked)}
                              className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md font-semibold border shadow-sm transition-all duration-200 text-xs lg:text-sm ${
                                loan?.ghlPipelineSlotBlocked
                                  ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                                  : 'border-blue-600 text-blue-700 bg-white hover:bg-blue-50'
                              }`}
                              title={
                                loan?.ghlPipelineSlotBlocked
                                  ? loan?.ghlPipelineSlotBlockReason ||
                                    "Another loan for this borrower's GHL contact is already active in the pipeline. A new one can be added only after the previous loan is Closed, Funded, or Rejected."
                                  : 'Sync this loan to GHL pipeline'
                              }
                            >
                              Sync to GHL
                            </button>
                          )}
                          <button
                            onClick={handleSendPreApprovalLetter}
                            className="ml-2 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md font-semibold bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow transition-all duration-200 min-w-[300px] sm:min-w-0 text-center text-xs lg:text-sm"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12l2 2 4-4"
                              ></path>
                            </svg>

                            Send Pre-Approval Letter
                          </button>
                        </div>
                    </div>
                  </div>
                </div>
                <div className="flex">
                  {/* Desktop Vertical Tabs Navigation - Hidden on mobile/tablet */}
                  <div className="hidden lg:block">
                    <VerticalTabNavigation
                      mainTabs={mainTabs}
                      applicationSubTabs={applicationSubTabs}
                      activeTab={activeTab}
                      isApplicationExpanded={isApplicationExpanded}
                      handleTabClick={handleTabClick}
                      setActiveTab={setActiveTab}
                      router={router}
                      id={id}
                    />
                  </div>


                  {/* Content Area - Now responsive without min-width constraint on mobile */}
                  <div className="flex-1 space-y-6 overflow-hidden lg:min-w-[750px]">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveLoan();
                      }}
                    >
                      {/* Dashboard Tab */}
                      {/* Dashboard Tab Content */}
                      {activeTab === "dashboard" && (
                        <>
                          {console.log("🔍 [DEBUG] Passing milestones to LoanDashboard:", milestones)}
                        <LoanDashboard
                          loan={loan}
                          setLoan={setLoan}
                          fetchLoanDetails={fetchLoanDetails}
                          id={id}
                          documents={documents}
                            milestones={milestones}
                        />
                        </>
                      )}
                      {/* Loan Details Tab */}
                      {activeTab === "loan" && (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                          <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                              Loan Details
                            </h3>
                          </div>
                          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                            <LoanDetailsForm
                              loanInfo={loan.loanDetails || {}}
                              onChange={(field, value) => {
                                if (typeof field === "object" && field.target) {
                                  // Extract the actual field name by removing 'loanInfo.' prefix if present
                                  const fieldName = field.target.name.replace(
                                    "loanInfo.",
                                    ""
                                  );
                                  handleFieldChange(
                                    "loanDetails",
                                    fieldName,
                                    field.target.value
                                  );
                                } else {
                                  handleFieldChange(
                                    "loanDetails",
                                    field,
                                    value
                                  );
                                }
                              }}
                              userType="lender"
                            />
                          </div>

                          {/* MCR Classification Section - Lender Only */}
                          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                            <h4 className="text-md font-medium text-gray-900 mb-1">MCR Classification</h4>
                            <p className="text-xs text-gray-500 mb-4">These fields determine how this loan is categorized in MCR reports.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Funding Method */}
                              <div>
                                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Funding Method</label>
                                <div className="relative">
                                  <select
                                    value={loan?.fundingMethod || ""}
                                    onChange={(e) => { setLoan(prev => ({ ...prev, fundingMethod: e.target.value })); setHasUnsavedChanges(true); }}
                                    className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">— Select —</option>
                                    <option value="Brokered">Broker</option>
                                    <option value="Retail">Retail (Direct)</option>
                                    <option value="Non-Delegated">Non-Delegated</option>
                                    <option value="Delegated">Delegated Lender</option>
                                    <option value="Table-Funded">Table Funded</option>
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              {/* Doc Type */}
                              <div>
                                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Documentation Type</label>
                                <div className="relative">
                                  <select
                                    value={loan?.docType || ""}
                                    onChange={(e) => { setLoan(prev => ({ ...prev, docType: e.target.value })); setHasUnsavedChanges(true); }}
                                    className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">— Select —</option>
                                    <option value="Full Doc">Full Documentation</option>
                                    <option value="Alt/Reduced Doc">Alt / Reduced Documentation</option>
                                    <option value="Bank Statement">Bank Statement</option>
                                    <option value="DSCR">DSCR</option>
                                    <option value="Stated">Stated</option>
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              {/* QM Status */}
                              <div>
                                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">QM Status</label>
                                <div className="relative">
                                  <select
                                    value={loan?.qmStatus || ""}
                                    onChange={(e) => { setLoan(prev => ({ ...prev, qmStatus: e.target.value })); setHasUnsavedChanges(true); }}
                                    className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">— Select —</option>
                                    <option value="QM-Safe Harbor">QM — Safe Harbor</option>
                                    <option value="QM-Rebuttable Presumption">QM — Rebuttable Presumption</option>
                                    <option value="Non-QM">Non-QM</option>
                                    <option value="Not Subject to QM">Not Subject to QM</option>
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Boolean toggles */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
                              {[
                                { key: "interestOnlyFlag", label: "Interest Only" },
                                { key: "hoeparFlag", label: "HOEPA Loan" },
                                { key: "isReverseMortgage", label: "Reverse Mortgage" },
                                { key: "hasPrepaymentPenalty", label: "Prepayment Penalty" },
                                { key: "isPiggybackSecond", label: "Piggyback Second" },
                                { key: "hasMortgageInsurance", label: "Mortgage Insurance" },
                              ].map(({ key, label }) => (
                                <label key={key} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={loan?.[key] || false}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      if (key === "isReverseMortgage") {
                                        setLoan((prev) => ({
                                          ...prev,
                                          isReverseMortgage: checked,
                                          ...(!checked ? { reverseMortgageType: null } : {}),
                                        }));
                                      } else {
                                        setLoan((prev) => ({ ...prev, [key]: checked }));
                                      }
                                      setHasUnsavedChanges(true);
                                    }}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-700">{label}</span>
                                </label>
                              ))}
                            </div>
                            {loan?.isReverseMortgage && (
                              <div className="mt-4 max-w-md">
                                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                                  Reverse mortgage program (MCR AC700–AC720)
                                </label>
                                <div className="relative">
                                  <select
                                    value={loan?.reverseMortgageType || ""}
                                    onChange={(e) => {
                                      const v = e.target.value || null;
                                      setLoan((prev) => ({ ...prev, reverseMortgageType: v }));
                                      setHasUnsavedChanges(true);
                                    }}
                                    className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">— Select —</option>
                                    <option value="HECM-Standard">HECM-Standard</option>
                                    <option value="HECM-Saver">HECM-Saver</option>
                                    <option value="Proprietary/Other">Proprietary/Other</option>
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Borrower Information Tab */}
                      {activeTab === "borrower" && (
                        <>
                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Personal Details
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <PersonalDetails
                                borrower={loan.borrowerDetails || {}}
                                onChange={(field, value) => {
                                  if (
                                    typeof field === "object" &&
                                    field.target
                                  ) {
                                    handleFieldChange(
                                      "borrowerDetails",
                                      field.target.name,
                                      field.target.value
                                    );
                                  } else {
                                    handleFieldChange(
                                      "borrowerDetails",
                                      field,
                                      value
                                    );
                                  }
                                }}
                                addDependent={handleAddDependent}
                                removeDependent={handleRemoveDependent}
                                handleDependentChange={handleDependentChange}
                                userType="lender"
                              />
                            </div>
                          </div>

                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Employment History
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <EmploymentHistory
                                borrower={loan.borrowerDetails}
                                onChange={(field, value) => {
                                  if (field === "employers") {
                                    handleFieldChange(
                                      "borrowerDetails",
                                      "employers",
                                      value
                                    );
                                  } else if (
                                    typeof field === "object" &&
                                    field.target
                                  ) {
                                    handleFieldChange(
                                      "borrowerDetails",
                                      field.target.name,
                                      field.target.value
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
                                Residence History
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <ResidenceHistory
                                borrower={loan.borrowerDetails || {}}
                                userType="lender"
                                onChange={(field, value) => {
                                  if (field === "addresses") {
                                    handleFieldChange(
                                      "borrowerDetails",
                                      "addresses",
                                      value
                                    );
                                  } else if (
                                    typeof field === "object" &&
                                    field.target
                                  ) {
                                    handleFieldChange(
                                      "borrowerDetails",
                                      field.target.name,
                                      field.target.value
                                    );
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Property Information Tab */}
                      {activeTab === "property" && (
                        <>
                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Property Information
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <PropertyInformation
                                propertyInfo={loan.property || {}}
                                onChange={(field, value) => {
                                  if (
                                    typeof field === "object" &&
                                    field.target
                                  ) {
                                    // Extract the actual field name by removing 'propertyInfo.' prefix if present
                                    const fieldName = field.target.name.replace(
                                      "propertyInfo.",
                                      ""
                                    );
                                    handleFieldChange(
                                      "property",
                                      fieldName,
                                      field.target.value
                                    );
                                  } else {
                                    handleFieldChange("property", field, value);
                                  }
                                }}
                                userType="lender"
                              />
                            </div>
                          </div>

                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Properties Owned
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <PropertyOwned
                                propertiesOwned={loan.propertiesOwned || {}}
                                onChange={(updatedPropertyOwned) => {
                                  console.log("Updated property owned data:", updatedPropertyOwned);
                                  setLoan((prev) => ({
                                    ...prev,
                                    propertiesOwned: updatedPropertyOwned
                                  }));
                                  setHasUnsavedChanges(true);
                                }}
                                userType="lender"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Financial Information Tab */}
                      {activeTab === "financial" && (
                        <>
                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Income Information
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <Income
                                income={{
                                  ...(loan.income || {}),
                                  otherIncome: Array.isArray(
                                    loan.income?.otherIncome
                                  )
                                    ? loan.income.otherIncome
                                    : [],
                                }}
                                onChange={(field, value) => {
                                  if (
                                    typeof field === "object" &&
                                    field.target
                                  ) {
                                    // Extract field name by removing any prefix
                                    const fieldName = field.target.name.replace(
                                      "income.",
                                      ""
                                    );
                                    handleFieldChange(
                                      "income",
                                      fieldName,
                                      field.target.value
                                    );
                                  } else if (typeof field === "object") {
                                    // Handle case where entire object is passed
                                    setLoan((prev) => ({
                                      ...prev,
                                      income: field,
                                    }));
                                    setHasUnsavedChanges(true);
                                  } else {
                                    handleFieldChange("income", field, value);
                                  }
                                }}
                                userType="lender"
                              />
                            </div>
                          </div>

                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Assets
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <Assets
                                assets={loan.assets || []}
                                onChange={(assets) => {
                                  setLoan((prev) => ({
                                    ...prev,
                                    assets: assets,
                                  }));
                                  setHasUnsavedChanges(true);
                                }}
                                userType="lender"
                              />
                            </div>
                          </div>

                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Debts & Liabilities
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <Debts
                                debts={
                                  Array.isArray(loan.debts) ? loan.debts : []
                                }
                                expenses={
                                  Array.isArray(loan.expenses)
                                    ? loan.expenses
                                    : []
                                }
                                onChange={(field, value) => {
                                  if (field === "debts") {
                                    setLoan((prev) => ({
                                      ...prev,
                                      debts: Array.isArray(value) ? value : [],
                                    }));
                                    setHasUnsavedChanges(true);
                                  } else if (field === "expenses") {
                                    setLoan((prev) => ({
                                      ...prev,
                                      expenses: Array.isArray(value)
                                        ? value
                                        : [],
                                    }));
                                    setHasUnsavedChanges(true);
                                  }
                                }}
                                userType="lender"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Additional Information Tab */}
                      {activeTab === "additional" && (
                        <AdditionalInfo
                          loan={loan}
                          handleFieldChange={handleFieldChange}
                          setLoan={setLoan}
                          setHasUnsavedChanges={setHasUnsavedChanges}
                        />
                      )}

                      {/* Documents Tab */}
                      {activeTab === "documents" && (
                        <>
                          {/* Document Requirements Section */}
                          <LenderDocumentRequirements
                            loanId={id}
                            documents={documents}
                            employmentType={employmentType}
                            ownsHome={ownsHome}
                            refreshDocuments={() => {
                              try {
                                // Use the current id from props/state to fetch again
                                if (id) {
                                  setLoading(true);
                                  setError(null);

                                  Promise.all([
                                    lenderService.getLoan(id),
                                    lenderService.getLoanDocuments(id),
                                  ])
                                    .then(
                                      ([loanResponse, documentsResponse]) => {
                                        if (
                                          loanResponse &&
                                          (loanResponse.data ||
                                            loanResponse.data?.data)
                                        ) {
                                          // Process loan data
                                          const loanData =
                                            loanResponse.data?.data ||
                                            loanResponse.data;

                                          setLoan(normalizeData(loanData));
                                        } else {
                                          console.warn(
                                            "⚠️ No loan data found in response"
                                          );
                                        }

                                        if (
                                          documentsResponse &&
                                          documentsResponse.success
                                        ) {
                                          const newDocs =
                                            documentsResponse.data || [];

                                          setDocuments(newDocs);
                                        } else {
                                          console.warn(
                                            "⚠️ No documents found in response"
                                          );
                                        }

                                        console.log("✅ Data refresh complete");
                                      }
                                    )
                                    .catch((error) => {
                                      console.error(
                                        "❌ Error refreshing loan details:",
                                        error
                                      );
                                      console.error("❌ Error details:", {
                                        message: error.message,
                                        stack: error.stack?.slice(0, 200), // Only log first part of stack
                                      });
                                      toast.error(
                                        "Failed to refresh loan details"
                                      );
                                    })
                                    .finally(() => {
                                      console.log(
                                        "🔄 Setting loading state to false"
                                      );
                                      setLoading(false);
                                      console.log(
                                        "=== END OF REFRESH OPERATION ===\n"
                                      );
                                    });
                                } else {
                                  console.error(
                                    "❌ Cannot refresh - no loan ID available"
                                  );
                                }
                              } catch (error) {
                                console.error(
                                  "❌ Unexpected error during refresh operation:",
                                  error
                                );
                                console.error("❌ Error details:", {
                                  message: error.message,
                                  stack: error.stack?.slice(0, 200), // Only log first part of stack
                                });
                                setLoading(false);
                              }
                            }}
                          />
                        </>
                      )}

                      {/* Products & Pricing Tab */}
                      {PPE_ENABLED && activeTab === "products-pricing" && (
                        <ProductsPricingTab loan={loan} />
                      )}

                      {/* Milestones Tab */}
                      {activeTab === "milestones" && (
                        <>
                          <LoanMilestones loanId={id} />
                        </>
                      )}

                      {/* ===== MCR TABS ===== */}
                      {/* Audit & Dates Tab */}
                      {activeTab === "audit-dates" && (
                        <AuditDatesTab
                          loanId={id}
                          loan={loan}
                          fetchLoanDetails={fetchLoanDetails}
                        />
                      )}

                      {/* Funding / Revenue Tab */}
                      {activeTab === "funding-revenue" && (
                        <FundingRevenueTab
                          loanId={id}
                          loan={loan}
                        />
                      )}

                      {/* MCR Data Audit Tab */}
                      {activeTab === "mcr-audit" && (
                        <MCRDataAuditTab
                          loanId={id}
                          loan={loan}
                          setLoan={setLoan}
                          setActiveMainTab={setActiveTab}
                          fetchLoanDetails={fetchLoanDetails}
                        />
                      )}
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No loan found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This loan doesn't exist or you don't have permission to view
                  it.
                </p>
                <div className="mt-6">
                  <Link
                    href={backUrl || "/lender/loans"}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Return to Loans
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add the NoteModal component */}
        <NoteModal 
          isOpen={isNoteModalOpen} 
          onClose={() => setIsNoteModalOpen(false)} 
          loanId={id}
        />

        {isMessageModalOpen && (
          <>
            <div
              className="fixed inset-y-0 right-0 left-0 md:left-16 bg-black/30 z-40"
              onClick={() => setIsMessageModalOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 left-0 md:left-16 z-50 p-3 md:p-6">
              <div className="h-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Borrower Communications</h3>
                  <button
                    type="button"
                    onClick={() => setIsMessageModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                    aria-label="Close communications modal"
                  >
                    &times;
                  </button>
                </div>
                <div className="flex-1 p-3 bg-gray-50 min-h-0">
                  <LoanMessagesPanel />
                </div>
              </div>
            </div>
          </>
        )}
        
        <LoanApplicationSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          loan={loan}
          loanId={id}
          onUpdateLoan={setLoan}
        />
        
        {/* Mobile Expandable Navigation */}
        <MobileExpandableNavigation
          isOpen={isMobileNavOpen}
          onToggle={() => setIsMobileNavOpen(!isMobileNavOpen)}
          onClose={() => setIsMobileNavOpen(false)}
          mainTabs={mainTabs}
          applicationSubTabs={applicationSubTabs}
          activeTab={activeTab}
          handleTabClick={handleTabClick}
        />
        
        {/* Application tabs: sticky save/discard bar (matches Funding/Revenue UX) */}
        {hasUnsavedChanges && SAVE_TABS.includes(activeTab) && (
          <div className="sticky bottom-0 z-50 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 px-6 py-3.5 flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">Unsaved changes</span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
              >
                Discard
              </button>
              <button
                onClick={saveLoan}
                disabled={saving}
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LoanDetails;
