import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  User,
  Home,
  DollarSign,
  FileSpreadsheet,
  Users,
  CreditCard
} from 'lucide-react';

const XMLLoanUpload = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState(null);
  const [isCreatingLoan, setIsCreatingLoan] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.xml')) {
      toast.error('Please select an XML file');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    parseXMLFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const parseXMLFile = async (xmlFile) => {
    try {
      setIsUploading(true);
      setUploadProgress(20);

      const fileContent = await xmlFile.text();
      setUploadProgress(50);

      // Parse XML content
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(fileContent, 'text/xml');
      setUploadProgress(80);

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Invalid XML format');
      }

      // Extract data from XML - simplified version for preview
      const extractedData = extractDataFromXML(xmlDoc);
      
      setParsedData({
        ...extractedData,
        metadata: {
          fileName: xmlFile.name,
          fileSize: xmlFile.size,
          uploadDate: new Date().toISOString()
        }
      });

      setUploadProgress(100);
      toast.success('XML file parsed successfully!');

    } catch (error) {
      console.error('Error parsing XML:', error);
      toast.error('Failed to parse XML file: ' + error.message);
      setFile(null);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const extractDataFromXML = (xmlDoc) => {
    // Helper function to safely get text content
    const getTextContent = (xpath, defaultValue = '') => {
      const elements = xmlDoc.querySelectorAll(xpath);
      return elements.length > 0 ? elements[0].textContent?.trim() || defaultValue : defaultValue;
    };

    // Helper function to safely get numeric values
    const getNumber = (xpath, defaultValue = 0) => {
      const text = getTextContent(xpath);
      const num = parseFloat(text);
      return isNaN(num) ? defaultValue : num;
    };

    // Helper function to safely get boolean values
    const getBoolean = (xpath, defaultValue = false) => {
      const text = getTextContent(xpath);
      return text?.toLowerCase() === 'true' || text === '1' || text === 'yes' || defaultValue;
    };

    // Enhanced XML path extraction with multiple possible paths
    const getMultiPathContent = (xpaths, defaultValue = '') => {
      for (const xpath of xpaths) {
        try {
          const value = getTextContent(xpath);
          if (value) return value;
        } catch (e) {
          console.log(`Path ${xpath} not found, trying next...`);
        }
      }
      return defaultValue;
    };

    // Enhanced function to get boolean values from multiple paths
    const getMultiPathBoolean = (xpaths, defaultValue = false) => {
      for (const xpath of xpaths) {
        try {
          const value = getTextContent(xpath);
          if (value) {
            return value.toLowerCase() === 'true' || value === '1' || value === 'yes';
          }
        } catch (e) {
          console.log(`Path ${xpath} not found, trying next...`);
        }
      }
      return defaultValue;
    };

    // Extract borrower information with enhanced paths
    const borrowerData = {
      firstName: getMultiPathContent(['FirstName', 'name firstname', 'individual name firstname']),
      lastName: getMultiPathContent(['LastName', 'name lastname', 'individual name lastname']),
      fullName: getMultiPathContent(['FullName', 'name fullname', 'individual name fullname']),
      email: getMultiPathContent([
        'ContactPointEmailValue', 
        'contact_point_email ContactPointEmailValue',
        'contact_points contact_point contact_point_email contactpointemailvalue'
      ]),
      phone: getMultiPathContent([
        'ContactPointTelephoneValue',
        'contact_point_telephone ContactPointTelephoneValue',
        'contact_points contact_point contact_point_telephone contactpointtelephonevalue'
      ]),
      dateOfBirth: getMultiPathContent(['BorrowerBirthDate', 'borrower_detail borrowerbirthdate']),
      ssn: getMultiPathContent(['TaxpayerIdentifierValue', 'taxpayer_identifiers taxpayer_identifier taxpayeridentifiervalue']),
      maritalStatus: getMultiPathContent(['MaritalStatusType', 'borrower_detail maritalstatustype']),
      dependentCount: getNumber('DependentCount') || getNumber('borrower_detail dependentcount'),
      citizenship: getMultiPathContent(['CitizenshipResidencyType', 'declaration_detail citizenshipresidencytype']),
      
      // Address information
      address: {
        streetAddress: getMultiPathContent(['AddressLineText', 'address addresslinetext']),
        city: getMultiPathContent(['CityName', 'address cityname']),
        state: getMultiPathContent(['StateCode', 'address statecode']),
        zipCode: getMultiPathContent(['PostalCode', 'address postalcode']),
      },

      // Employment information (enhanced)
      employment: {
        employerName: getMultiPathContent(['FullName', 'employer legal_entity legal_entity_detail fullname']),
        position: getMultiPathContent(['EmploymentPositionDescription', 'employer employment employmentpositiondescription']),
        monthlyIncome: getNumber('EmploymentMonthlyIncomeAmount') || getNumber('employer employment employmentmonthlyincomeamount'),
        startDate: getMultiPathContent(['EmploymentStartDate', 'employer employment employmentstartdate']),
        isSelfEmployed: getMultiPathBoolean(['EmploymentBorrowerSelfEmployedIndicator', 'employer employment employmentborrowerselfemployedindicator']),
        workPhone: getMultiPathContent(['employer legal_entity contacts contact contact_points contact_point contact_point_telephone contactpointtelephonevalue']),
      }
    };

    // If no first/last name but we have fullName, try to parse it
    if (!borrowerData.firstName && !borrowerData.lastName && borrowerData.fullName) {
      const nameParts = borrowerData.fullName.split(' ');
      if (nameParts.length >= 2) {
        borrowerData.firstName = nameParts[0];
        borrowerData.lastName = nameParts.slice(1).join(' ');
      } else {
        borrowerData.firstName = borrowerData.fullName;
      }
    }

    // Extract loan information - enhanced with multiple paths
    const loanData = {
      loanType: getMultiPathContent(['LoanPurposeType', 'loan_detail loanpurposetype', 'terms_of_loan loanpurposetype']) || 'Purchase',
      loanAmount: getNumber('LoanAmount') || getNumber('amount loanamount') || getNumber('terms_of_loan baseloanamount'),
      loanTerm: getNumber('LoanTermMonths') / 12 || getNumber('terms loantermmonths') / 12 || getNumber('amortization amortization_rule loanamortizationperiodcount') / 12 || 30, // Convert months to years
      interestRate: getNumber('NoteRatePercent') || getNumber('terms_of_loan noteratepercent') || 0,
      purchasePrice: getNumber('SalesContractAmount') || getNumber('sales_contracts sales_contract sales_contract_detail salescontractamount')
    };

    // Extract property information - enhanced with multiple paths
    const propertyData = {
      streetAddress: getMultiPathContent([
        'SUBJECT_PROPERTY AddressLineText', 
        'collateral subject_property address addresslinetext'
      ]),
      city: getMultiPathContent([
        'SUBJECT_PROPERTY CityName', 
        'collateral subject_property address cityname'
      ]),
      state: getMultiPathContent([
        'SUBJECT_PROPERTY StateCode', 
        'collateral subject_property address statecode'
      ]),
      zipCode: getMultiPathContent([
        'SUBJECT_PROPERTY PostalCode', 
        'collateral subject_property address postalcode'
      ]),
      purchasePrice: getNumber('SalesContractAmount') || getNumber('collateral subject_property sales_contracts sales_contract sales_contract_detail salescontractamount'),
      estimatedValue: getNumber('PropertyEstimatedValueAmount') || getNumber('collateral subject_property property_detail propertyestimatedvalueamount') || getNumber('SalesContractAmount'),
      propertyType: getMultiPathContent([
        'PropertyUsageType', 
        'PropertyCurrentUsageType', 
        'collateral subject_property property_detail propertyusagetype',
        'collateral subject_property property_detail propertycurrentusagetype'
      ]) || 'Primary Residence',
      occupancyType: getMultiPathContent(['IntentToOccupyType', 'declaration_detail intenttooccupytype']) === 'Yes' ? 'Primary Residence' : 'Investment'
    };

    // Extract asset information - enhanced
    const assetData = {
      checkingAccounts: [],
      savingsAccounts: [],
      investments: [],
      retirementAccounts: [],
    };

    // Try to find assets by type - more comprehensive approach
    const assetElements = xmlDoc.querySelectorAll('asset, ASSET');
    assetElements.forEach((assetElement, index) => {
      const assetType = getMultiPathContent([
        `asset:nth-of-type(${index + 1}) asset_detail assettype`,
        `ASSET:nth-of-type(${index + 1}) ASSET_DETAIL AssetType`,
        'asset_detail assettype',
        'ASSET_DETAIL AssetType'
      ], '', assetElement);
      
      const value = getNumber(
        `asset:nth-of-type(${index + 1}) asset_detail assetcashormarketvalueamount`,
        getNumber(`ASSET:nth-of-type(${index + 1}) ASSET_DETAIL AssetCashOrMarketValueAmount`, 0, assetElement),
        assetElement
      );
      
      const bankName = getMultiPathContent([
        `asset:nth-of-type(${index + 1}) asset_holder name fullname`,
        `ASSET:nth-of-type(${index + 1}) ASSET_HOLDER NAME FullName`,
        `asset_holder name fullname`,
        `ASSET_HOLDER NAME FullName`
      ], '', assetElement);

      if (assetType.toLowerCase().includes('checking')) {
        assetData.checkingAccounts.push({
          bankName: bankName || 'Bank Account',
          value: value,
          accountType: 'Checking',
          isVerified: false,
          isLiquid: true
        });
      } else if (assetType.toLowerCase().includes('savings')) {
        assetData.savingsAccounts.push({
          bankName: bankName || 'Bank Account',
          value: value,
          accountType: 'Savings',
          isVerified: false,
          isLiquid: true
        });
      } else if (assetType.toLowerCase().includes('stock') || assetType.toLowerCase().includes('bond') || 
               assetType.toLowerCase().includes('mutual') || assetType.toLowerCase().includes('investment')) {
        assetData.investments.push({
          description: bankName || assetType || 'Investment',
          value: value,
          isVerified: false,
          isLiquid: true
        });
      } else if (assetType.toLowerCase().includes('retirement') || assetType.toLowerCase().includes('401k') || 
               assetType.toLowerCase().includes('ira')) {
        assetData.retirementAccounts.push({
          description: bankName || assetType || 'Retirement Account',
          value: value,
          isVerified: false,
          isLiquid: false
        });
      }
    });

    // Extract debts/liabilities - enhanced approach
    const debts = [];
    
    const liabilityElements = xmlDoc.querySelectorAll('liability, LIABILITY');
    liabilityElements.forEach((liabilityElement, index) => {
      const liabilityType = getMultiPathContent([
        `liability:nth-of-type(${index + 1}) liability_detail liabilitytype`,
        `LIABILITY:nth-of-type(${index + 1}) LIABILITY_DETAIL LiabilityType`,
        'liability_detail liabilitytype',
        'LIABILITY_DETAIL LiabilityType'
      ], '', liabilityElement);
      
      const monthlyPayment = getNumber(
        `liability:nth-of-type(${index + 1}) liability_detail liabilitymonthlyPaymentamount`,
        getNumber(`LIABILITY:nth-of-type(${index + 1}) LIABILITY_DETAIL LiabilityMonthlyPaymentAmount`, 0, liabilityElement),
        liabilityElement
      );
      
      const balance = getNumber(
        `liability:nth-of-type(${index + 1}) liability_detail liabilityunpaidbalanceamount`,
        getNumber(`LIABILITY:nth-of-type(${index + 1}) LIABILITY_DETAIL LiabilityUnpaidBalanceAmount`, 0, liabilityElement),
        liabilityElement
      );
      
      const creditorName = getMultiPathContent([
        `liability:nth-of-type(${index + 1}) liability_holder name fullname`,
        `LIABILITY:nth-of-type(${index + 1}) LIABILITY_HOLDER NAME FullName`,
        `liability_holder name fullname`,
        `LIABILITY_HOLDER NAME FullName`
      ], '', liabilityElement);
      
      const payoffStatus = getMultiPathBoolean([
        `liability:nth-of-type(${index + 1}) liability_detail liabilitypayoffstatusindicator`,
        `LIABILITY:nth-of-type(${index + 1}) LIABILITY_DETAIL LiabilityPayoffStatusIndicator`
      ], false, liabilityElement);

      if (monthlyPayment > 0 || balance > 0) {
        debts.push({
          creditorName: creditorName || 'Creditor',
          accountNumber: '',
          debtType: mapLiabilityType(liabilityType) || 'Other',
          monthlyPayment: monthlyPayment,
          balance: balance,
          willBePaidOff: payoffStatus
        });
      }
    });

    // Map liability type to more user-friendly format
    function mapLiabilityType(type) {
      if (!type) return 'Other';
      
      const typeStr = type.toLowerCase();
      if (typeStr.includes('mortgage')) return 'Mortgage';
      if (typeStr.includes('heloc')) return 'HELOC';
      if (typeStr.includes('auto')) return 'Auto Loan';
      if (typeStr.includes('student')) return 'Student Loan';
      if (typeStr.includes('credit')) return 'Credit Card';
      if (typeStr.includes('install')) return 'Installment';
      if (typeStr.includes('revolving')) return 'Revolving';
      return 'Other';
    }

    // Extract other income - enhanced approach
    const otherIncomeItems = [];
    
    const incomeElements = xmlDoc.querySelectorAll('current_income_item, CURRENT_INCOME_ITEM');
    incomeElements.forEach((incomeElement, index) => {
      const incomeType = getMultiPathContent([
        `current_income_item:nth-of-type(${index + 1}) current_income_item_detail incometype`,
        `CURRENT_INCOME_ITEM:nth-of-type(${index + 1}) CURRENT_INCOME_ITEM_DETAIL IncomeType`,
        'current_income_item_detail incometype',
        'CURRENT_INCOME_ITEM_DETAIL IncomeType'
      ], '', incomeElement);
      
      const otherIncomeType = getMultiPathContent([
        `current_income_item:nth-of-type(${index + 1}) current_income_item_detail otherincometype`,
        `CURRENT_INCOME_ITEM:nth-of-type(${index + 1}) CURRENT_INCOME_ITEM_DETAIL OtherIncomeType`,
        'current_income_item_detail otherincometype',
        'CURRENT_INCOME_ITEM_DETAIL OtherIncomeType'
      ], '', incomeElement);
      
      const monthlyAmount = getNumber(
        `current_income_item:nth-of-type(${index + 1}) current_income_item_detail currentincomemonthlytotalamount`,
        getNumber(`CURRENT_INCOME_ITEM:nth-of-type(${index + 1}) CURRENT_INCOME_ITEM_DETAIL CurrentIncomeMonthlyTotalAmount`, 0, incomeElement),
        incomeElement
      );

      // Skip base income, overtime, etc. as they're handled separately
      const standardTypes = ['base', 'overtime', 'commission', 'bonus'];
      if (!standardTypes.some(type => incomeType.toLowerCase().includes(type)) && monthlyAmount > 0) {
        otherIncomeItems.push({
          incomeType: otherIncomeType || incomeType || 'Other Income',
          amount: monthlyAmount
        });
      }
    });

    // Enhanced demographics extraction
    const demographicsData = {
      ethnicity: getMultiPathContent([
        'hmda_ethnicity_origins hmda_ethnicity_origin hmdaethnicityorigintype',
        'hmda_ethnicity hmdaethnicitytype',
        'HMDA_ETHNICITY_ORIGINS HMDA_ETHNICITY_ORIGIN HMDAEthnicityOriginType',
        'HMDA_ETHNICITIES HMDA_ETHNICITY HMDAEthnicityType',
        'government_monitoring extension other ulad:government_monitoring_extension ulad:hmda_ethnicities ulad:hmda_ethnicity ulad:hmdaethnicitytype'
      ]) || 'Not Provided',
      
      race: getMultiPathContent([
        'hmda_races hmda_race hmda_race_detail hmdaracetype',
        'hmda_race hmda_race_detail hmdaracetype',
        'HMDA_RACES HMDA_RACE HMDA_RACE_DETAIL HMDARaceType'
      ]) || 'Not Provided',
      
      sex: getMultiPathContent([
        'government_monitoring_detail hmdagendertype',
        'government_monitoring_detail extension other government_monitoring_detail_extension hmdagendertype',
        'GOVERNMENT_MONITORING_DETAIL EXTENSION OTHER ULAD:GOVERNMENT_MONITORING_DETAIL_EXTENSION ULAD:HMDAGenderType'
      ]) || 'Not Provided',
    };

    // Map ethnicity to user-friendly format
    demographicsData.ethnicity = mapEthnicity(demographicsData.ethnicity);
    demographicsData.race = mapRace(demographicsData.race);
    demographicsData.sex = mapGender(demographicsData.sex);

    // Helper functions to map demographic values to user-friendly formats
    function mapEthnicity(value) {
      if (!value) return 'Not Provided';
      
      const valueStr = value.toLowerCase();
      if (valueStr.includes('hispanic') || valueStr.includes('latino')) return 'Hispanic or Latino';
      if (valueStr.includes('not hispanic') || valueStr.includes('not latino')) return 'Not Hispanic or Latino';
      if (valueStr.includes('not provided') || valueStr.includes('information')) return 'I do not wish to provide this information';
      return value;
    }

    function mapRace(value) {
      if (!value) return 'Not Provided';
      
      const valueStr = value.toLowerCase();
      if (valueStr.includes('american indian') || valueStr.includes('alaska')) return 'American Indian or Alaska Native';
      if (valueStr.includes('asian')) return 'Asian';
      if (valueStr.includes('black') || valueStr.includes('african')) return 'Black or African American';
      if (valueStr.includes('hawaiian') || valueStr.includes('pacific')) return 'Native Hawaiian or Other Pacific Islander';
      if (valueStr.includes('white')) return 'White';
      if (valueStr.includes('not provided') || valueStr.includes('information')) return 'I do not wish to provide this information';
      return value;
    }

    function mapGender(value) {
      if (!value) return 'Not Provided';
      
      const valueStr = value.toLowerCase();
      if (valueStr.includes('male')) return 'Male';
      if (valueStr.includes('female')) return 'Female';
      if (valueStr.includes('not provided') || valueStr.includes('information')) return 'I do not wish to provide this information';
      return value;
    }

    // Extract declarations information - enhanced with multiple paths
    const declarationsData = {
      bankruptcyHistory: getMultiPathBoolean(['BankruptcyIndicator', 'declaration_detail bankruptcyindicator']),
      foreclosureHistory: getMultiPathBoolean(['PriorPropertyForeclosureCompletedIndicator', 'declaration_detail priorpropertyforeclosurecompletedIndicator']),
      legalProblems: getMultiPathBoolean(['PartyToLawsuitIndicator', 'declaration_detail partytolawsuitindicator']),
      delinquent: getMultiPathBoolean(['PresentlyDelinquentIndicator', 'declaration_detail presentlydelinquentindicator']),
      judgments: getMultiPathBoolean(['OutstandingJudgmentsIndicator', 'declaration_detail outstandingjudgmentsindicator']),
      borrowingMoney: getMultiPathBoolean(['UndisclosedBorrowedFundsIndicator', 'declaration_detail undisclosedborrowedfundsindicator']),
      coSigner: getMultiPathBoolean(['UndisclosedComakerOfNoteIndicator', 'declaration_detail undisclosedcomakerofnoteindicator']),
      hadOwnershipInterest: getMultiPathContent(['HomeownerPastThreeYearsType', 'declaration_detail homeownerpastthreeyearstype']) === 'Yes',
      occupyAsPrimary: getMultiPathContent(['IntentToOccupyType', 'declaration_detail intenttooccupytype']) === 'Yes',
      applyingForMortgage: getMultiPathBoolean(['UndisclosedMortgageApplicationIndicator', 'declaration_detail undisclosedmortgageapplicationindicator']),
    };

    // Return structured data with enhanced fields
    return {
      borrowerDetails: borrowerData,
      loanDetails: loanData,
      property: propertyData,
      income: {
        baseIncome: borrowerData.employment.monthlyIncome * 12,
        overtime: getNumber('current_income_items current_income_item overtime') * 12,
        commissions: getNumber('current_income_items current_income_item commissions') * 12,
        bonuses: getNumber('current_income_items current_income_item bonus') * 12,
        militaryEntitlements: getNumber('current_income_items current_income_item militaryentitlement') * 12,
        otherIncome: otherIncomeItems
      },
      assets: {
        checkingAccounts: assetData.checkingAccounts,
        savingsAccounts: assetData.savingsAccounts,
        investments: assetData.investments,
        retirementAccounts: assetData.retirementAccounts,
      },
      debts: debts,
      militaryService: {
        isVeteran: getMultiPathBoolean(['selfdeclaredmilitaryserviceindicator', 'borrower_detail selfdeclaredmilitaryserviceindicator']),
        isActive: getMultiPathContent(['militarystatustype', 'military_service_detail militarystatustype'])?.includes('Active') || false,
        isSurvivingSpouse: getMultiPathBoolean(['SpousalVABenefitsEligibilityIndicator', 'borrower_detail spousalvabenefitseligibilityindicator']),
        currentlyServing: getMultiPathContent(['militarystatustype', 'military_service_detail militarystatustype']) === 'ActiveDuty',
        isRetired: getMultiPathContent(['militarystatustype', 'military_service_detail militarystatustype']) === 'Retired',
      },
      declarations: declarationsData,
      demographics: demographicsData,
      residenceHistory: [
        {
          address: {
            streetAddress: getMultiPathContent(['residence address addresslinetext']),
            city: getMultiPathContent(['residence address cityname']),
            state: getMultiPathContent(['residence address statecode']),
            zipCode: getMultiPathContent(['residence address postalcode']),
          },
          residencyType: getMultiPathContent(['residence residence_detail borrowerresidencytype']),
          monthlyRent: getNumber('residence landlord landlord_detail monthlyrentamount'),
          ownOrRent: getMultiPathContent(['residence residence_detail borrowerresidencybasistype']) === 'Own' ? 'Own' : 'Rent',
          yearsAtAddress: Math.floor(getNumber('residence residence_detail borrowerresidencydurationmonthscount') / 12),
          monthsAtAddress: getNumber('residence residence_detail borrowerresidencydurationmonthscount') % 12
        }
      ]
    };
  };

  const createLoanFromXML = async () => {
    if (!file) {
      toast.error('No XML file selected');
      return;
    }

    try {
      setIsCreatingLoan(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('xmlFile', file);

      // Upload XML file to backend for processing
      const response = await fetch('/api/v1/loans/import-xml', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Loan imported successfully from XML!');
        onSuccess && onSuccess(result.data);
        onClose();
      } else {
        throw new Error(result.message || 'Failed to import loan from XML');
      }

    } catch (error) {
      console.error('Error importing XML loan:', error);
      toast.error('Failed to import loan: ' + error.message);
    } finally {
      setIsCreatingLoan(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setParsedData(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Import Loan from XML
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {!file ? (
            /* File Upload Area */
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload XML File
              </h3>
              <p className="text-gray-500 mb-4">
                Drop your MISMO XML file here, or click to browse
              </p>
              <p className="text-sm text-gray-400">
                Supported format: .xml (Max size: 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>
          ) : (
            /* File Preview and Data */
            <div className="space-y-6">
              {/* File Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{file.name}</h3>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={resetUpload}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Progress Bar */}
                {isUploading && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Parsing XML...</span>
                      <span className="text-sm text-gray-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Parsed Data Preview */}
              {parsedData && !isUploading && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Data Preview
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Borrower Info */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <User className="h-5 w-5 text-blue-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Borrower Information</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {parsedData.borrowerDetails.firstName} {parsedData.borrowerDetails.lastName}</div>
                        <div><span className="font-medium">Email:</span> {parsedData.borrowerDetails.email || 'Not provided'}</div>
                        <div><span className="font-medium">Phone:</span> {parsedData.borrowerDetails.phone || 'Not provided'}</div>
                        <div><span className="font-medium">SSN:</span> {parsedData.borrowerDetails.ssn ? '***-**-' + parsedData.borrowerDetails.ssn.slice(-4) : 'Not provided'}</div>
                        <div><span className="font-medium">Date of Birth:</span> {parsedData.borrowerDetails.dateOfBirth || 'Not provided'}</div>
                        <div><span className="font-medium">Marital Status:</span> {parsedData.borrowerDetails.maritalStatus || 'Not provided'}</div>
                        <div><span className="font-medium">Dependents:</span> {parsedData.borrowerDetails.dependentCount || '0'}</div>
                        <div><span className="font-medium">Citizenship:</span> {parsedData.borrowerDetails.citizenship || 'Not provided'}</div>
                      </div>
                    </div>

                    {/* Loan Info */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Loan Information</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Type:</span> {parsedData.loanDetails.loanType}</div>
                        <div><span className="font-medium">Amount:</span> ${parsedData.loanDetails.loanAmount?.toLocaleString() || 'Not specified'}</div>
                        <div><span className="font-medium">Term:</span> {parsedData.loanDetails.loanTerm} years</div>
                        <div><span className="font-medium">Interest Rate:</span> {parsedData.loanDetails.interestRate}%</div>
                        <div><span className="font-medium">Purchase Price:</span> ${parsedData.loanDetails.purchasePrice?.toLocaleString() || 'Not specified'}</div>
                      </div>
                    </div>

                    {/* Property Info */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Home className="h-5 w-5 text-purple-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Property Information</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Address:</span> {parsedData.property.streetAddress || 'Not provided'}</div>
                        <div><span className="font-medium">City:</span> {parsedData.property.city || 'Not provided'}</div>
                        <div><span className="font-medium">State:</span> {parsedData.property.state || 'Not provided'}</div>
                        <div><span className="font-medium">Zip Code:</span> {parsedData.property.zipCode || 'Not provided'}</div>
                        <div><span className="font-medium">Purchase Price:</span> ${parsedData.property.purchasePrice?.toLocaleString() || 'Not specified'}</div>
                        <div><span className="font-medium">Property Type:</span> {parsedData.property.propertyType || 'Not specified'}</div>
                        <div><span className="font-medium">Occupancy Type:</span> {parsedData.property.occupancyType || 'Not specified'}</div>
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <FileSpreadsheet className="h-5 w-5 text-orange-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Financial Information</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Annual Income:</span> ${parsedData.income.baseIncome?.toLocaleString() || 'Not specified'}</div>
                        <div><span className="font-medium">Employer:</span> {parsedData.borrowerDetails.employment.employerName || 'Not provided'}</div>
                        <div><span className="font-medium">Position:</span> {parsedData.borrowerDetails.employment.position || 'Not provided'}</div>
                        
                        {/* Bank Accounts */}
                        {parsedData.assets.checkingAccounts.length > 0 && (
                          <div>
                            <span className="font-medium">Checking Accounts:</span> 
                            {parsedData.assets.checkingAccounts.map((acct, i) => (
                              <div key={i} className="ml-3 text-xs">
                                {acct.bankName}: ${acct.value?.toLocaleString() || '0'}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {parsedData.assets.savingsAccounts.length > 0 && (
                          <div>
                            <span className="font-medium">Savings Accounts:</span> 
                            {parsedData.assets.savingsAccounts.map((acct, i) => (
                              <div key={i} className="ml-3 text-xs">
                                {acct.bankName}: ${acct.value?.toLocaleString() || '0'}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Other Income */}
                        {parsedData.income.otherIncome && parsedData.income.otherIncome.length > 0 && (
                          <div>
                            <span className="font-medium">Other Income:</span> 
                            {parsedData.income.otherIncome.map((income, i) => (
                              <div key={i} className="ml-3 text-xs">
                                {income.incomeType}: ${income.amount?.toLocaleString() || '0'}/month
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Declarations Info */}
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Declarations</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Bankruptcy:</span> {parsedData.declarations.bankruptcyHistory ? 'Yes' : 'No'}</div>
                        <div><span className="font-medium">Foreclosure:</span> {parsedData.declarations.foreclosureHistory ? 'Yes' : 'No'}</div>
                        <div><span className="font-medium">Legal Problems:</span> {parsedData.declarations.legalProblems ? 'Yes' : 'No'}</div>
                        <div><span className="font-medium">Outstanding Judgments:</span> {parsedData.declarations.judgments ? 'Yes' : 'No'}</div>
                        <div><span className="font-medium">Delinquent on Debt:</span> {parsedData.declarations.delinquent ? 'Yes' : 'No'}</div>
                        <div><span className="font-medium">Intend to Occupy:</span> {parsedData.declarations.occupyAsPrimary ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                    
                    {/* Military Service */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <User className="h-5 w-5 text-blue-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Military Service</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Military Service:</span> {parsedData.militaryService.isVeteran ? 'Yes' : 'No'}</div>
                        <div><span className="font-medium">Currently Serving:</span> {parsedData.militaryService.currentlyServing ? 'Yes' : 'No'}</div>
                        <div><span className="font-medium">Retired:</span> {parsedData.militaryService.isRetired ? 'Yes' : 'No'}</div>
                        <div><span className="font-medium">Surviving Spouse:</span> {parsedData.militaryService.isSurvivingSpouse ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                    
                    {/* Demographics */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Users className="h-5 w-5 text-green-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Demographics</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Ethnicity:</span> {parsedData.demographics.ethnicity}</div>
                        <div><span className="font-medium">Race:</span> {parsedData.demographics.race}</div>
                        <div><span className="font-medium">Sex:</span> {parsedData.demographics.sex}</div>
                      </div>
                    </div>
                    
                    {/* Debts & Liabilities */}
                    {parsedData.debts && parsedData.debts.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <CreditCard className="h-5 w-5 text-yellow-600 mr-2" />
                          <h4 className="font-medium text-gray-900">Debts & Liabilities</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          {parsedData.debts.map((debt, i) => (
                            <div key={i} className="border-b border-yellow-100 pb-1 mb-1">
                              <div><span className="font-medium">{debt.debtType}:</span> {debt.creditorName}</div>
                              <div className="text-xs">Balance: ${debt.balance?.toLocaleString() || '0'}</div>
                              <div className="text-xs">Monthly Payment: ${debt.monthlyPayment?.toLocaleString() || '0'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          
          {file && parsedData && !isUploading && (
            <button
              onClick={createLoanFromXML}
              disabled={isCreatingLoan}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingLoan ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Loan...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Loan
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default XMLLoanUpload;
