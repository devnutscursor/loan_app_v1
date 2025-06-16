import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import Link from "next/link";
import MainLayout from "../../../components/layout/MainLayout";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import { lenderService } from "../../../services/api";
import LoanDashboard from "../../../components/lender/loans/LoanDashboard";
import { MessageCircle, StickyNote, Download } from "lucide-react";
import {
  BarChart2,
  User,
  FileText,
  Home,
  Wallet,
  ClipboardList, // or ClipboardCheck if you prefer
  Files, // instead of FileStack
  Trophy, // or Flag if you prefer
  FileSpreadsheet, // For Application tab icon
  ChevronDown, // For accordion expand/collapse
  ChevronRight,
} from "lucide-react";
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
import MilitaryService from "../../../components/forms/additional/MilitaryService";
import Declarations from "../../../components/forms/declarations/Declarations";
import Demographics from "../../../components/forms/declarations/Demographics";

// Import document components
import DocumentsCard from "../../../components/borrower/loan/DocumentsCard";
import LenderDocumentRequirements from "../../../components/lender/documents/LenderDocumentRequirements";
import BorrowerScenarioTailwind from "../../../components/lender/loans/BorrowerScenarioTailwind";
import LoanMilestones from "../../../components/lender/loans/LoanMilestones";
import { PDFDocument } from "pdf-lib";
import { generateMismoXml, downloadXmlFile } from "../../../utils/xmlGenerator";
import NoteModal from "../../../components/common/NoteModal";

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

  // --- Personal Info ---
  const fullName = `${borrowerDetails.firstName || ''} ${borrowerDetails.middleName || ''} ${borrowerDetails.lastName || ''} ${borrowerDetails.suffix || ''}`.trim();
  form.getTextField('topmostSubform[0].Page1[0]._1a_Borrower_s_Name[0]').setText(fullName);
  form.getTextField('topmostSubform[0].Page1[0]._1a_Email[0]').setText(borrowerDetails.email || '');
  form.getTextField('topmostSubform[0].Page1[0]._1a_Dependents[0]').setText((borrowerDetails.dependents?.length || 0).toString());
  form.getTextField('topmostSubform[0].Page1[0]._1a_Dependent_Age[0]').setText((borrowerDetails.dependents || []).map(d => d.age).join(', '));
  form.getTextField('topmostSubform[0].Page1[0].credit[0].joint[0]._1a_Initials[0]').setText((borrowerDetails.suffix || ''));
  // Date of Birth
  if (borrowerDetails.dateOfBirth) {
    const dob = new Date(borrowerDetails.dateOfBirth);
    form.getTextField('topmostSubform[0].Page1[0]._1a_Birth_1[0]').setText(String(dob.getMonth() + 1).padStart(2, '0'));
    form.getTextField('topmostSubform[0].Page1[0]._1a_Birth_2[0]').setText(String(dob.getDate()).padStart(2, '0'));
    form.getTextField('topmostSubform[0].Page1[0]._1a_Birth_3[0]').setText(String(dob.getFullYear()));
  }
  // Phone
  const phone = (borrowerDetails.phone || '').replace(/\D/g, '').padEnd(10, '0');
  form.getTextField('topmostSubform[0].Page1[0]._1a_PhoneH1[0]').setText(phone.slice(0, 3));
  form.getTextField('topmostSubform[0].Page1[0]._1a_PhoneH2[0]').setText(phone.slice(3, 6));
  form.getTextField('topmostSubform[0].Page1[0]._1a_PhoneH3[0]').setText(phone.slice(6, 10));
  // SSN
  //if (form.getTextField('topmostSubform[0].Page1[0]._1a_SSN[0]')) {
    //form.getTextField('topmostSubform[0].Page1[0]._1a_SSN[0]').setText(borrowerDetails.ssn || '');
  //}

  // --- Current Address ---
  const curr = borrowerDetails.currentAddress || {};
  form.getTextField('topmostSubform[0].Page1[0]._1a_Address_St[0]').setText(curr.streetAddress || '');
  form.getTextField('topmostSubform[0].Page1[0]._1a_Address_City[0]').setText(curr.city || '');
  if (curr.state) form.getDropdown('topmostSubform[0].Page1[0]._1a_Address_State[0]').select(curr.state);
  form.getTextField('topmostSubform[0].Page1[0]._1a_Address_Zip[0]').setText(curr.zipCode || '');
  form.getTextField('topmostSubform[0].Page1[0]._1a_Address_Country[0]').setText(borrowerDetails.citizenship);

  const yearsAtAddress = borrowerDetails?.currentAddress?.yearsAtAddress || 0;
 // Check if the user has been at the current address for less than 2 years
 if (yearsAtAddress < 2) {
  // Mark the checkbox for "Does Not Apply" for the former address
  form.getCheckBox('topmostSubform[0].Page1[0]._1a_Does_Not_Apply1[0]').check();
} else {
  // Uncheck the "Does Not Apply" checkbox if the user has been at the current address for 2 or more years
  form.getCheckBox('topmostSubform[0].Page1[0]._1a_Does_Not_Apply1[0]').uncheck();
}

  // --- Previous Address (first one) ---
  const prev = (borrowerDetails.previousAddresses || [])[0] || {};
  form.getTextField('topmostSubform[0].Page1[0]._1a_FormerAddress_St[0]').setText(prev.streetAddress || '');
  form.getTextField('topmostSubform[0].Page1[0]._1a_Former_Address_Unit[0]').setText(prev.aptSteNum || '');
  form.getTextField('topmostSubform[0].Page1[0]._1a_Former_Address_City[0]').setText(prev.city || '');
  if (prev.state) form.getDropdown('topmostSubform[0].Page1[0]._1a_Former_Address_State[0]').select(prev.state);
  form.getTextField('topmostSubform[0].Page1[0]._1a_Former_Address_Zip[0]').setText(prev.zipCode || '');
  form.getTextField('topmostSubform[0].Page1[0]._1a_Former_Address_Country[0]').setText(borrowerDetails.citizenship);

   // --- Mailing Address ---
   const mail = borrowerDetails.mailingAddress || {};
   form.getTextField('topmostSubform[0].Page1[0]._1a_Mail_Address_St[0]').setText(mail.streetAddress || '');
   //form.getTextField('topmostSubform[0].Page1[0]._1a_Mail_Address_Unit[0]').setText(mail.aptSteNum || '');
   form.getTextField('topmostSubform[0].Page1[0]._1a_Mail_Address_City[0]').setText(mail.city || '');
   if (mail.state) form.getDropdown('topmostSubform[0].Page1[0]._1a_Mail_Address_State[0]').select(mail.state);
   form.getTextField('topmostSubform[0].Page1[0]._1a_Mail_Address_Zip[0]').setText(mail.zipCode || '');
   form.getTextField('topmostSubform[0].Page1[0]._1a_Mail_Address_Country[0]').setText(borrowerDetails.citizenship);
 
 

  // --- Employer (first one) ---
  const emp = (borrowerDetails.employers || [])[0] || {};
  form.getTextField('topmostSubform[0].Page1[0]._1b_Employer[0]').setText(emp.companyName || '');
  form.getTextField('topmostSubform[0].Page1[0]._1b_PhoneE1[0]').setText((emp.companyPhone || '').replace(/\D/g, '').slice(0, 3));
  form.getTextField('topmostSubform[0].Page1[0]._1b_PhoneE2[0]').setText((emp.companyPhone || '').replace(/\D/g, '').slice(3, 6));
  form.getTextField('topmostSubform[0].Page1[0]._1b_PhoneE3[0]').setText((emp.companyPhone || '').replace(/\D/g, '').slice(6, 10));
  form.getTextField('topmostSubform[0].Page1[0]._1b_Position[0]').setText(emp.jobTitle || '');
  form.getTextField('topmostSubform[0].Page1[0]._1b_Employment_Start_Month[0]').setText(emp.startDate ? String(new Date(emp.startDate).getMonth() + 1).padStart(2, '0') : '');
  form.getTextField('topmostSubform[0].Page1[0]._1b_Employment_Start_Day[0]').setText(emp.startDate ? String(new Date(emp.startDate).getDate()).padStart(2, '0') : '');
  form.getTextField('topmostSubform[0].Page1[0]._1b_Employment_Start_Year[0]').setText(emp.startDate ? String(new Date(emp.startDate).getFullYear()) : '');
  form.getTextField('topmostSubform[0].Page1[0]._1b_City[0]').setText(emp.city || '');
  if (emp.state) form.getDropdown('topmostSubform[0].Page1[0]._1b_State[0]').select(emp.state);
  form.getTextField('topmostSubform[0].Page1[0]._1b_Zip[0]').setText(emp.zipCode || '');
  form.getTextField('topmostSubform[0].Page1[0]._1b_Country[0]').setText(borrowerDetails.citizenship);
  form.getTextField('topmostSubform[0].Page1[0]._1b_Address[0]').setText(emp.streetAddress || '');

  // --- Employer (second) or Does Not Apply ---
  const employers = borrowerDetails.employers || [];
  if (employers.length === 1) {
    // Only one employer, check Does Not Apply for employer 2
    form.getCheckBox('topmostSubform[0].Page2[0]._1c_Does_Not_Apply[0]').check();
  } else if (employers.length > 1) {
    // Fill employer 2 fields (index 1)
    const emp2 = employers[1];
    form.getTextField('topmostSubform[0].Page2[0]._1c_Employer[0]').setText(emp2.companyName || '');
    form.getTextField('topmostSubform[0].Page2[0]._1c_PhoneE1[0]').setText((emp2.companyPhone || '').replace(/\D/g, '').slice(0, 3));
    form.getTextField('topmostSubform[0].Page2[0]._1c_PhoneE2[0]').setText((emp2.companyPhone || '').replace(/\D/g, '').slice(3, 6));
    form.getTextField('topmostSubform[0].Page2[0]._1c_PhoneE3[0]').setText((emp2.companyPhone || '').replace(/\D/g, '').slice(6, 10));
    form.getTextField('topmostSubform[0].Page2[0]._1c_Position[0]').setText(emp2.jobTitle || '');
    form.getTextField('topmostSubform[0].Page2[0]._1c_Employment_Start_Month[0]').setText(emp2.startDate ? String(new Date(emp2.startDate).getMonth() + 1).padStart(2, '0') : '');
    form.getTextField('topmostSubform[0].Page2[0]._1c_Employment_Start_Day[0]').setText(emp2.startDate ? String(new Date(emp2.startDate).getDate()).padStart(2, '0') : '');
    form.getTextField('topmostSubform[0].Page2[0]._1c_Employment_Start_Year[0]').setText(emp2.startDate ? String(new Date(emp2.startDate).getFullYear()) : '');
    form.getTextField('topmostSubform[0].Page2[0]._1c_City[0]').setText(emp2.city || '');
    if (emp2.state) form.getDropdown('topmostSubform[0].Page2[0]._1c_State[0]').select(emp2.state);
    form.getTextField('topmostSubform[0].Page2[0]._1c_Zip[0]').setText(emp2.zipCode || '');
    form.getTextField('topmostSubform[0].Page2[0]._1c_Country[0]').setText(borrowerDetails.citizenship);
    form.getTextField('topmostSubform[0].Page2[0]._1c_Address[0]').setText(emp2.streetAddress || '');
  }

  // check doesnot apply box in  1d  portion in our form as it is not applicable for us
form.getCheckBox('topmostSubform[0].Page2[0]._1d_Does_Not_Apply[0]').check();


  // --- Income (Other Monthly Income Table) ---
  if (income) {
    // 1) Monthly income (baseIncome + bonuses + commissions + militaryEntitlements)
    const monthlyIncome =
      (parseFloat(income.baseIncome) || 0) +
      (parseFloat(income.bonuses) || 0) +
      (parseFloat(income.commissions) || 0) +
      (parseFloat(income.militaryEntitlements) || 0);
    // 2) otherIncome (sum of all otherIncome amounts)
    const otherIncome = (income.otherIncome || []).reduce((sum, oi) => sum + (parseFloat(oi.amount) || 0), 0);
    // 3) overtime
    const overtime = parseFloat(income.overtime) || 0;

    // Row 1: monthlyIncome
    form.getDropdown('topmostSubform[0].Page2[0].Table1[0].T1R1[0]._1e_Income_Other_Sources1[0]').select('monthlyIncome');
    form.getTextField('topmostSubform[0].Page2[0].Table1[0].T1R1[0]._1e_Other_Monthly_Income1[0]').setText(monthlyIncome ? String(monthlyIncome) : '');
    // Row 2: otherIncome
    form.getDropdown('topmostSubform[0].Page2[0].Table1[0].T1R2[0]._1e_Income_Other_Sources2[0]').select('otherIncome');
    form.getTextField('topmostSubform[0].Page2[0].Table1[0].T1R2[0]._1e_Other_Monthly_Income2[0]').setText(income.otherIncome[0].amount ? String(income.otherIncome[0].amount) : '');
    // Row 3: overtime
    form.getDropdown('topmostSubform[0].Page2[0].Table1[0].T1R3[0]._1e_Income_Other_Sources3[0]').select('overtime');
    form.getTextField('topmostSubform[0].Page2[0].Table1[0].T1R3[0]._1e_Other_Monthly_Income3[0]').setText(income.overtime ? String(income.overtime) : '');
    // Total Other Monthly Income
    let totalOther = 0;
    totalOther += parseFloat(monthlyIncome) || 0;
    totalOther += parseFloat(income.otherIncome) || 0;
    totalOther += parseFloat(income.overtime) || 0;
    (income.otherIncome || []).forEach(oi => {
      totalOther += parseFloat(oi.amount) || 0;
    });
    form.getTextField('topmostSubform[0].Page2[0].Table1[0].T1R4[0]._1e_Total_Other_Monthly_Income[0]').setText(totalOther ? String(totalOther) : '');
    // You can now use monthlyIncome, otherIncome, and overtime variables for any additional PDF fields as needed
  }




  // --- Assets (Checking/Savings, Gifts/Grants, Stocks/Bonds, Miscellaneous) ---
if (assets) {
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
  for (let i = 0; i < 5; i++) {
    const idx = i + 1;
    const row = assetRows[i] || {};
    form.getDropdown(`topmostSubform[0].Page3[0].Table2a[0].TR${idx}[0]._2a_Account_Type${idx}[0]`).select(row.type || '');
    form.getTextField(`topmostSubform[0].Page3[0].Table2a[0].TR${idx}[0]._2a_Financial${idx}[0]`).setText(row.financial || '');
    form.getTextField(`topmostSubform[0].Page3[0].Table2a[0].TR${idx}[0]._2a_Account${idx}[0]`).setText(row.account || '');
    form.getTextField(`topmostSubform[0].Page3[0].Table2a[0].TR${idx}[0]._2a_Cash${idx}[0]`).setText(row.value ? String(row.value) : '');
  }
  // Set total cash field
  const totalAssets = assetRows.reduce((sum, row) => sum + (parseFloat(row.value) || 0), 0);
  form.getTextField('topmostSubform[0].Page3[0].Table2a[0].TR6[0]._2a_Total_Cash[0]').setText(totalAssets ? String(totalAssets) : '');



  // check doesnot apply box in  2b  portion in our form as it is not applicable for us
  form.getCheckBox('topmostSubform[0].Page3[0]._2b_Does_Not_Apply[0]').check();

  // --- Debts ---
  if (debts && debts.length > 0) {
    debts.forEach((debt, index) => {
      if (index < 5) { // Only handle up to 5 debts as that's what the PDF has
        const rowNum = index + 1;
        
        // Account Type - Set to "Other" as default
        form.getDropdown(`topmostSubform[0].Page3[0].Table2c[0].TR${rowNum}[0]._2c_Account_Type${rowNum}[0]`).select('Other');
        
        // Company (Creditor)
        form.getTextField(`topmostSubform[0].Page3[0].Table2c[0].TR${rowNum}[0]._2c_Company${rowNum}[0]`).setText(debt.creditor || '');
        
        // Unpaid Balance
        form.getTextField(`topmostSubform[0].Page3[0].Table2c[0].TR${rowNum}[0]._2c_Unpaid${rowNum}[0]`).setText(debt.balance ? String(debt.balance) : '');
        
        // Monthly Payment
        form.getTextField(`topmostSubform[0].Page3[0].Table2c[0].TR${rowNum}[0]._2c_Monthly${rowNum}[0]`).setText(debt.monthlyPayment ? String(debt.monthlyPayment) : '');
        
        // Paid Off checkbox
        if (debt.paidAtClosing) {
          form.getCheckBox(`topmostSubform[0].Page3[0].Table2c[0].TR${rowNum}[0]._2c_Paid_Off${rowNum}[0]`).check();
        }
      }
    });
  }

}


  

  



  // --- Property Information (Page 5) ---
  if (propertiesOwned && loanDetails && property) {
    // Fill loan amount from loanDetails
    form.getTextField('topmostSubform[0].Page5[0]._4a_Loan_Amount[0]').setText(loanDetails.loanAmount ? String(loanDetails.loanAmount) : '');

    // Fill property details
    //form.getTextField('topmostSubform[0].Page5[0]._4a_Address_St[0]').setText(property.streetAddress || '');
    //form.getTextField('topmostSubform[0].Page5[0]._4a_Address_Unit[0]').setText(property.aptSteNum || '');
    //form.getTextField('topmostSubform[0].Page5[0]._4a_Address_City[0]').setText(property.city || '');
    //if (property.state) form.getDropdown('topmostSubform[0].Page5[0]._4a_Address_State[0]').select(property.state);
    form.getTextField('topmostSubform[0].Page5[0]._4a_Address_Zip[0]').setText(property.zipCode || '');
    //form.getTextField('topmostSubform[0].Page5[0]._4a_Property_County[0]').setText(property.county || '');
    
    // Fill number of units
    form.getTextField('topmostSubform[0].Page5[0]._4a_Units[0]').setText(property.numberOfUnits ? String(property.numberOfUnits) : '');
    
    // Fill property value
    form.getTextField('topmostSubform[0].Page5[0]._4a_Value[0]').setText(property.propertyValue ? String(property.propertyValue) : '');

    // Fill loan purpose based on loanType and property details
    let purpose = loanDetails.loanType;
    form.getTextField('topmostSubform[0].Page5[0].loan_purpose[0].other[0]._4a_Purpose_other_spec[0]').setText(purpose);

    // --- Down Payment and Assets (Page 5) ---
    // Check if there are any assets to report
    if (loanDetails.downPayment > 0 || loanDetails.loanParameters) {
      // Fill down payment information
      form.getDropdown('topmostSubform[0].Page5[0]._4d_Table[0].TR1[0]._4d_Asset_Type1[0]').select('Down Payment');
      form.getDropdown('topmostSubform[0].Page5[0]._4d_Table[0].TR1[0]._4d_Source1[0]').select('Borrower');
      form.getTextField('topmostSubform[0].Page5[0]._4d_Table[0].TR1[0]._4d_Cash1[0]').setText(String(loanDetails.downPayment));

      // Fill additional assets if available
      if (loanDetails.loanParameters) {
        const params = loanDetails.loanParameters;
        
        // Second row: Property Taxes
        if (params.propertyTaxes) {
          form.getDropdown('topmostSubform[0].Page5[0]._4d_Table[0].TR2[0]._4d_Asset_Type2[0]').select('Property Taxes');
          form.getDropdown('topmostSubform[0].Page5[0]._4d_Table[0].TR2[0]._4d_Source2[0]').select('Annual');
          form.getTextField('topmostSubform[0].Page5[0]._4d_Table[0].TR2[0]._4d_Cash2[0]').setText(String(params.propertyTaxes));
        }
      }
    } else {
      // If no assets to report, check "Does Not Apply" box
      form.getCheckBox('topmostSubform[0].Page5[0]._4d_Does_Not_Apply[0]').check();
    }

    // Check FHA box if applicable (you might want to add a flag in your schema for this)
    //form.getCheckBox('topmostSubform[0].Page5[0]._4a_FHA[0]').check();

    // --- Property Expenses and Ownership (Page 5) ---
    // Check if there are any properties owned or expenses to report
    if (propertiesOwned.ownsProperty || propertiesOwned.firstMortgage > 0 || propertiesOwned.realEstateTaxes > 0 || 
        propertiesOwned.hazardInsurance > 0 || propertiesOwned.hoaDues > 0 || propertiesOwned.mortgageInsurance > 0 || 
        propertiesOwned.otherFinancing > 0 || propertiesOwned.otherHousingExpenses > 0 || propertiesOwned.rent > 0) {
      
      // First row: First Mortgage
      if (propertiesOwned.firstMortgage > 0) {
        form.getTextField('topmostSubform[0].Page5[0]._4c_Table[0].TR1[0]._4c_Amount1[0]').setText(String(property.proposedRentalIncome));
      }
      
      form.getTextField('topmostSubform[0].Page5[0]._4c_Table[0].TR2[0]._4c_Amount2[0]').setText(String(property.netMonthlyRentalIncome));

    } else {
      // If no properties or expenses to report, check "Does Not Apply" box
      form.getCheckBox('topmostSubform[0].Page5[0]._4c_Does_Not_Apply[0]').check();
    }

    // --- Declarations (Page 6) ---
    // Property declarations
    if (declarations.hadOwnershipInterest) {
      form.getDropdown('topmostSubform[0].Page6[0].L5a3[0]._5a31[0]._5a_About_A3[0]').select('Yes');
      if (declarations.ownedPropertyType) {
        form.getDropdown('topmostSubform[0].Page6[0].L5a3[0]._5a32[0]._5a_About_A4[0]').select(declarations.ownedPropertyType);
      }
    } else {
      form.getDropdown('topmostSubform[0].Page6[0].L5a3[0]._5a31[0]._5a_About_A3[0]').select('No');
    }

    // Bankruptcy information
    if (declarations.declaredBankruptcy) {
      form.getCheckBox('topmostSubform[0].Page6[0]._5bM_type[0].ch7[0]._5bM_ch7[0]').check();
      if (declarations.bankruptcyType) {
        form.getTextField('topmostSubform[0].Page6[0]._5a_About_C2[0]').setText(declarations.bankruptcyType);
      }
    }

    // Property foreclosure information
    if (declarations.propertyForeclosed) {
      form.getCheckBox('topmostSubform[0].Page6[0]._5bM_type[0].ch11[0]._5bM_ch11[0]').check();
    }

    // Lawsuit information
    if (declarations.partyToLawsuit) {
      form.getCheckBox('topmostSubform[0].Page6[0]._5bM_type[0].ch12[0]._5bM_ch12[0]').check();
    }

    // Property lien information
    if (declarations.propertySubjectToLien) {
      form.getCheckBox('topmostSubform[0].Page6[0]._5bM_type[0].ch13[0]._5bM_ch13[0]').check();
    }
  }



  // --- Demographics (Page 8) ---

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

  // check doesnot apply box in  2b  portion in our form as it is not applicable for us
  form.getCheckBox('topmostSubform[0].Page3[0]._2b_Does_Not_Apply[0]').check();
  form.getCheckBox('topmostSubform[0].Page4[0]._3_Do_Not_Own[0]').check();
  form.getCheckBox('topmostSubform[0].Page4[0]._3b_No_Additional[0]').check();
  form.getCheckBox('topmostSubform[0].Page4[0]._3c_No_Additional[0]').check();
  form.getCheckBox('topmostSubform[0].Page4[0]._3c_No_Additional[0]').check();




  // --- Save the filled PDF ---
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// Debug utility
const debug = (message, data) => {
  console.log(`[LoanDetails] ${message}`, data);
};

const LoanDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loan, setLoan] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard"); // Change this line
  // At the top of your component
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Add debug for id
  useEffect(() => {
    if (id) {
      debug('Loan ID from router query', { id, type: typeof id });
    }
  }, [id]);

  // Tabs where the bar should NOT show
  const NO_SAVE_TABS = ["dashboard", "documents", "milestones"];

  // Call this to cancel changes
  const handleCancel = () => {
    // Reset form fields to their original values
    // You may need to refetch or reset state here
    setHasUnsavedChanges(false);
  };

  // Save all changes to the loan
  const saveLoan = async () => {
    try {
      setSaving(true);
      await lenderService.updateLoan(id, loan);
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
  const [isApplicationExpanded, setIsApplicationExpanded] = useState(true);

  // Modify tabs structure to include Application tab
  const mainTabs = [
    { id: "dashboard", label: "Loan Dashboard", icon: BarChart2 },
    { id: "documents", label: "Documents", icon: Files },
    { id: "milestones", label: "Milestones", icon: Trophy },
    { id: "application", label: "Application", icon: FileSpreadsheet }, // New parent tab
  ];

  // Define sub-tabs under Application
  const applicationSubTabs = [
    { id: "borrower", label: "Borrower Information", icon: User },
    { id: "loan", label: "Loan Details", icon: FileText },
    { id: "property", label: "Property Information", icon: Home },
    { id: "financial", label: "Financial Information", icon: Wallet },
    { id: "additional", label: "Additional Information", icon: ClipboardList },
  ];
  // Create a flat array of all valid tabs for validation
  const allTabs = [
    ...mainTabs.map((tab) => tab.id),
    ...applicationSubTabs.map((tab) => tab.id),
  ];

  // Function to handle tab clicks with accordion logic
  const handleTabClick = (tabId) => {
    if (tabId === "application") {
      // Toggle the accordion state
      const newExpandedState = !isApplicationExpanded;
      setIsApplicationExpanded(newExpandedState);

      // Only handle navigation when opening
      if (newExpandedState) {
        const currentTabIsSubTab = applicationSubTabs.some(
          (tab) => tab.id === activeTab
        );

        if (!currentTabIsSubTab) {
          const firstSubTab = applicationSubTabs[0].id;
          setActiveTab(firstSubTab);
          router.push(`/lender/loans/${id}?tab=${firstSubTab}`, undefined, {
            shallow: true,
          });
        }
      } else {
        // When closing, set the active tab to "application" itself
        setActiveTab("application");
        router.push(`/lender/loans/${id}?tab=application`, undefined, {
          shallow: true,
        });
      }
    } else {
      router.push(`/lender/loans/${id}?tab=${tabId}`, undefined, {
        shallow: true,
      });
      setActiveTab(tabId);
    }
  };

  // Determine if a subtab is currently active
  const isSubTabActive = applicationSubTabs.some((tab) => tab.id === activeTab);

  // If so, make sure the accordion is expanded when page loads
  useEffect(() => {
    if (isSubTabActive && !isApplicationExpanded) {
      setIsApplicationExpanded(true);
    }
  }, [activeTab, isSubTabActive, isApplicationExpanded]);

  // Uncomment and modify this useEffect to handle tab changes from URL
  useEffect(() => {
    if (!router.isReady || !id) return;

    // Check if there's a tab in the URL query
    const tabFromUrl = router.query.tab;

    // Check if this is a valid tab
    const isValidTab = allTabs.includes(tabFromUrl);

    if (isValidTab) {
      // Set active tab based on URL query
      setActiveTab(tabFromUrl);

      // If it's a subtab, ensure the accordion is expanded
      if (applicationSubTabs.some((tab) => tab.id === tabFromUrl)) {
        setIsApplicationExpanded(true);
      }
    } else if (!tabFromUrl) {
      // If no tab is specified, use default tab and update URL
      router.push(`/lender/loans/${id}?tab=dashboard`, undefined, {
        shallow: true,
      });
    }
  }, [router.isReady, router.query, id]);

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

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching loan details for ID:", id);

      const response = await lenderService.getLoan(id);
      
      // Print debug info to terminal
      console.log('\n=== LOAN DETAILS DEBUG INFO ===');
      console.log('Loan ID:', id);
      console.log('Full Response:', JSON.stringify(response, null, 2));
      console.log('Response Data:', JSON.stringify(response?.data, null, 2));
      console.log('Response Data Data:', JSON.stringify(response?.data?.data, null, 2));
      console.log('Loan Data:', JSON.stringify(response?.data?.data?.loan, null, 2));
      console.log('Borrower Details:', JSON.stringify(response?.data?.data?.loan?.borrowerDetails, null, 2));
      console.log('================================\n');

      if (response && (response.data || response.data?.data)) {
        // Extract loan data, handling different response structures
        // Based on the API structure in memory, data is nested under response.data.data
        const loanData =
          response.data?.data?.loan || response.data?.data || response.data;
        console.log("Loan details:", loanData);

        // Ensure all required properties exist with defaults
        const normalizedData = {
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

        // Add console logs to inspect data
        console.log("Normalized data structure:", normalizedData);
        console.log("Borrower details:", normalizedData.borrowerDetails);
        console.log("Loan details:", normalizedData.loanDetails);

        setLoan(normalizedData);

        // Fetch documents separately since they are stored in a different collection
        try {
          const docsResponse = await lenderService.getLoanDocuments(id);
          console.log("Documents response:", docsResponse);

          if (docsResponse && docsResponse.data) {
            // Extract documents, handling nested structure
            const docsData = docsResponse.data?.data || docsResponse.data;
            setDocuments(Array.isArray(docsData) ? docsData : []);
          }
        } catch (docError) {
          console.error("Error fetching loan documents:", docError);
          // Don't fail the whole page load just because documents failed
        }
      } else {
        console.warn("Failed to fetch loan details");
        setError("Failed to load loan details");
        toast.error("Failed to load loan details");
      }
    } catch (error) {
      console.error("Error fetching loan details:", error);
      setError("An error occurred while loading the loan details");
      toast.error("Failed to load loan details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // Don't fetch until id is available
    if (!id) return;

    fetchLoanDetails();
  }, [id]);

  const handleRemoveDocument = async (documentId) => {
    // Document removal is only for borrowers, but we can show a message here
    toast.info("Only borrowers can remove documents");
  };

  const getStatusBadgeColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";

    status = status.toLowerCase();
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle form field changes with better null checks
  const handleFieldChange = (section, field, value) => {
    console.log(`Updating ${section}.${field} with:`, value);
    setHasUnsavedChanges(true);
    setLoan((prev) => {
      // Make sure the section exists
      const sectionData = prev[section] || {};

      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: value,
        },
      };
    });
  };

  // Handle nested field changes
  const handleNestedFieldChange = (section, nestedSection, field, value) => {
    console.log(`Updating ${section}.${nestedSection}.${field} with:`, value);

    setLoan((prev) => {
      // Make sure the section and nested section exist
      const sectionData = prev[section] || {};
      const nestedSectionData = sectionData[nestedSection] || {};

      return {
        ...prev,
        [section]: {
          ...sectionData,
          [nestedSection]: {
            ...nestedSectionData,
            [field]: value,
          },
        },
      };
    });
  };


  const handleDownloadURLA = async () => {
    const pdfBytes = await generateURLAPdf(loan.borrowerDetails, loan.assets, loan.income, loan.debts, loan.propertiesOwned, loan.loanDetails, loan.property, loan.declarations, loan.demographics);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `URLA_${loan.loanNumber || loan._id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleNoteButtonClick = () => {
    debug('Opening note modal', { loanId: id });
    setIsNoteModalOpen(true);
  };

  return (
    <ProtectedRoute allowedRoles={["lender"]}>
      <MainLayout>
        <div className="">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="animate-pulse">
                {/* Header skeleton */}
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center gap-3 mb-3 min-h-[2.5rem]">
                    {/* Back button skeleton */}
                    <div className="flex items-center px-2 py-1 rounded">
                      <div className="h-5 w-5 bg-gray-200 rounded"></div>
                      <div className="ml-1 h-4 w-16 bg-gray-200 rounded"></div>
                    </div>
                    <div className="block w-px h-5 bg-gray-200"></div>
                    {/* Title skeleton */}
                    <div className="h-7 w-48 bg-gray-200 rounded"></div>
                  </div>

                  {/* Loan info header skeleton */}
                  <div className="bg-white shadow-sm rounded-lg mb-6 px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Loan icon skeleton */}
                      <div className="flex-shrink-0 bg-gray-200 rounded-md p-2 h-10 w-10"></div>
                      <div className="ml-2 min-w-0">
                        {/* Loan number skeleton */}
                        <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
                        {/* Loan type skeleton */}
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                    {/* Action buttons skeleton */}
                    <div className="flex items-center gap-1">
                      {/* Circular button skeletons */}
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-9 w-9 bg-gray-200 rounded-full"
                        ></div>
                      ))}
                      {/* Main action button skeleton */}
                      <div className="ml-2 h-9 w-40 bg-gray-200 rounded-md"></div>
                    </div>
                  </div>
                </div>

                <div className="flex">
                  {/* Tabs skeleton */}
                  <div className="w-60 flex-shrink-0 mr-6">
                    <div className="rounded-xl bg-white p-2 shadow-md border border-gray-100">
                      <div className="flex flex-col space-y-2">
                        {[1, 2, 3, 4].map((tab) => (
                          <div key={tab} className="py-3 px-4 rounded-lg">
                            <div className="flex items-center">
                              <div className="h-5 w-5 bg-gray-200 rounded mr-3"></div>
                              <div className="h-5 bg-gray-200 rounded w-24"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Content area skeleton */}
                  <div className="flex-1">
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                      <div className="flex justify-between mb-4">
                        <div className="h-7 bg-gray-200 rounded w-48"></div>
                        <div className="h-7 bg-gray-200 rounded w-24"></div>
                      </div>

                      {/* Dashboard-like content skeleton */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-4">
                          {/* Card 1 */}
                          <div className="bg-gray-100 p-4 rounded-lg">
                            <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              </div>
                            </div>
                          </div>

                          {/* Card 2 */}
                          <div className="bg-gray-100 p-4 rounded-lg">
                            <div className="h-5 bg-gray-200 rounded w-40 mb-3"></div>
                            <div className="flex items-center mb-3">
                              <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                              <div>
                                <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                              </div>
                            </div>
                            <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                              <div className="h-4 bg-gray-200 rounded w-36 mb-2"></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                                <div className="space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* Card 3 */}
                          <div className="bg-gray-100 p-4 rounded-lg">
                            <div className="h-5 bg-gray-200 rounded w-48 mb-3"></div>
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center">
                                <div className="h-6 w-10 bg-gray-200 rounded mr-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                              </div>
                              <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-4"></div>
                            <div className="flex gap-3">
                              <div className="flex-1 p-3 bg-gray-200 rounded"></div>
                              <div className="flex-1 p-3 bg-gray-200 rounded"></div>
                            </div>
                          </div>

                          {/* Card 4 */}
                          <div className="bg-gray-100 p-4 rounded-lg">
                            <div className="h-5 bg-gray-200 rounded w-36 mb-3"></div>
                            <div className="flex items-center mb-3">
                              <div className="h-16 w-16 rounded-full bg-gray-200 mr-3"></div>
                              <div className="grid grid-cols-2 gap-2 flex-1">
                                <div className="h-10 bg-gray-200 rounded"></div>
                                <div className="h-10 bg-gray-200 rounded"></div>
                                <div className="h-10 bg-gray-200 rounded"></div>
                                <div className="h-10 bg-gray-200 rounded"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center gap-3 mb-3 min-h-[2.5rem]">
                    <Link
                      href="/lender/loans"
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
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                      Loan Application Details
                    </h1>
                  </div>

                  <div className="bg-white shadow-sm rounded-lg mb-6 px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-md p-2">
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
                        <h2 className="text-lg font-semibold truncate text-gray-900">
                          Loan {loan?.loanNumber || ""}
                        </h2>
                        <p className="text-xs text-gray-500 truncate">
                          {loan?.loanDetails?.loanType || "Loan"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        title="Add Note"
                        onClick={handleNoteButtonClick}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                      >
                        <StickyNote className="h-5 w-5" />
                      </button>
                      <button
                        title="Send Message"
                        onClick={() => {
                          router.push("/lender/messages");
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </button>
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
                        onClick={() =>
                          toast.success("Pre-approval letter sent to borrower")
                        }
                        className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow transition-all duration-200"
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
                <div className="flex">
                  {/* Vertical Tabs Navigation */}
                  {/* Vertical Tabs Navigation */}
                  <div className="w-60 flex-shrink-0 mr-6">
                    <div className="rounded-xl bg-white p-3 shadow-lg border border-gray-100 sticky top-4">
                      <nav
                        className="flex flex-col space-y-2"
                        aria-label="Tabs"
                      >
                        {mainTabs.map((tab) => {
                          const isActive = tab.id === activeTab;
                          const isExpanded =
                            tab.id === "application" && isApplicationExpanded;
                          return (
                            <div key={tab.id} className="group">
                              <button
                                onClick={() => handleTabClick(tab.id)}
                                className={`
                                relative w-full flex items-center justify-between py-3 px-4 rounded-lg text-sm font-medium
                                transform transition-all duration-300 ease-in-out
                                ${
                                  isActive
                                    ? "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-xs hover:scale-[1.015]"
                                }
                              `}
                              >
                                <div className="flex items-center">
                                  <span
                                    className={`mr-3 transition-all duration-300 ${
                                      isActive
                                        ? "text-blue-700 opacity-100 scale-110"
                                        : "opacity-70 group-hover:opacity-90"
                                    }`}
                                  >
                                    <tab.icon
                                      className={`h-5 w-5 ${
                                        isActive ? "drop-shadow-sm" : ""
                                      }`}
                                    />
                                  </span>
                                  <span
                                    className={isActive ? "font-semibold" : ""}
                                  >
                                    {tab.label}
                                  </span>
                                </div>

                                {/* Show chevron only for Application tab */}
                                {tab.id === "application" && (
                                  <span className="text-gray-500 transition-transform duration-200">
                                    {isApplicationExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </span>
                                )}

                                {/* Active indicator with enhanced styling */}
                                {isActive && (
                                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full shadow-sm"></span>
                                )}
                              </button>

                              {/* Display sub-tabs when Application is expanded */}
                              {tab.id === "application" && (
                                <div
                                  className={`
                                  pl-4 mt-2 space-y-1.5 overflow-hidden
                                  transition-[max-height,opacity,transform] duration-300 ease-in-out
                                  ${
                                    isApplicationExpanded
                                      ? "max-h-96 opacity-100"
                                      : "max-h-0 opacity-0"
                                  }
                                `}
                                >
                                  {applicationSubTabs.map((subTab) => {
                                    const isSubActive = activeTab === subTab.id;
                                    return (
                                      <button
                                        key={subTab.id}
                                        onClick={() => {
                                          router.push(
                                            `/lender/loans/${id}?tab=${subTab.id}`,
                                            undefined,
                                            { shallow: true }
                                          );
                                          setActiveTab(subTab.id);
                                        }}
                                        className={`
                                          relative w-full flex items-center py-2.5 px-4 rounded-lg text-sm font-medium
                                          transform transition-all duration-300 ease-in-out
                                          ${
                                            isSubActive
                                              ? "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 shadow-sm"
                                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:shadow-xs hover:scale-[1.015]"
                                          }
                                        `}
                                      >
                                        <span
                                          className={`
                                            mr-3 transition-all duration-300 ease-in-out
                                            ${
                                              isSubActive
                                                ? "text-blue-700 opacity-100 scale-110"
                                                : "opacity-70"
                                            }
                                          `}
                                        >
                                          <subTab.icon className="h-4 w-4" />
                                        </span>
                                        <span
                                          className={`text-xs transition-colors duration-300 ${
                                            isSubActive
                                              ? "font-medium text-gray-900 "
                                              : ""
                                          }`}
                                        >
                                          {subTab.label}
                                        </span>
                                        {isSubActive && (
                                          <span className="absolute right-2 w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full shadow-sm"></span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </nav>
                    </div>
                  </div>

                  <div className="flex-1 space-y-6 overflow-hidden">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveLoan();
                      }}
                    >
                      {/* Dashboard Tab */}
                      {/* Dashboard Tab Content */}
                      {activeTab === "dashboard" && (
                        <LoanDashboard
                          loan={loan}
                          setLoan={setLoan}
                          fetchLoanDetails={fetchLoanDetails}
                          id={id}
                          documents={documents}
                        />
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
                            />
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
                                propertyOwned={loan.propertiesOwned || {}}
                                onChange={(updatedPropertyOwned) => {
                                  console.log("Updated property owned data:", updatedPropertyOwned);
                                  setLoan((prev) => ({
                                    ...prev,
                                    propertiesOwned: updatedPropertyOwned
                                  }));
                                  setHasUnsavedChanges(true);
                                }}
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
                                  } else {
                                    handleFieldChange("income", field, value);
                                  }
                                }}
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
                                }}
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
                                  } else if (field === "expenses") {
                                    setLoan((prev) => ({
                                      ...prev,
                                      expenses: Array.isArray(value)
                                        ? value
                                        : [],
                                    }));
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Additional Information Tab */}
                      {activeTab === "additional" && (
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
                                  } else {
                                    handleFieldChange(
                                      "militaryService",
                                      field,
                                      value
                                    );
                                  }
                                }}
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
                                  } else {
                                    handleFieldChange(
                                      "declarations",
                                      field,
                                      value
                                    );
                                  }
                                }}
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
                                  } else {
                                    handleFieldChange(
                                      "demographics",
                                      field,
                                      value
                                    );
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Documents Tab */}
                      {activeTab === "documents" && (
                        <>
                          {/* Document Requirements Section */}
                          <LenderDocumentRequirements
                            loanId={id}
                            documents={documents}
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

                      {/* Milestones Tab */}
                      {activeTab === "milestones" && (
                        <>
                          <LoanMilestones loanId={id} />
                        </>
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
                    href="/lender/loans"
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
        
        {/* Existing unsaved changes bar */}
        {hasUnsavedChanges && !NO_SAVE_TABS.includes(activeTab) && (
          <div className="fixed bottom-0 left-0 right-0 z-50 w-full bg-gray-100 border-t border-gray-200 shadow-lg flex justify-end px-6 py-3 space-x-3 animate-fade-in">
            <button
              type="button"
              className="gap-1 px-3 py-1.5 rounded-md border border-gray-300 bg-white text-smtext-gray-700 font-medium shadow-sm hover:bg-gray-100 transition"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="gap-1 px-3 py-1.5 rounded-md border border-transparent bg-gradient-to-r from-blue-600 to-blue-800 text-sm text-white font-medium shadow-sm hover:from-blue-700 hover:to-blue-900 transition"
              onClick={saveLoan}
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "Save All Changes"}
            </button>
          </div>
        )}
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LoanDetails;
