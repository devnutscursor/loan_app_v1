import React, { useState, useRef, useEffect } from 'react';
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
  Copy,
  CheckCircle2
} from 'lucide-react';
import BorrowerSelectionModal from './BorrowerSelectionModal';
import { useRouter } from 'next/router';
import axios from 'axios';

// Referral Link Modal Component
const ReferralLinkModal = ({ isOpen, onClose, lenderId }) => {
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}/register/borrower?lenderId=${lenderId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            New Borrower Registration Link
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Share this link to invite a new borrower to register:
          </p>
          
          <div className="flex rounded-md shadow-sm">
            <input
              type="text"
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={referralLink}
              readOnly
            />
            <button
              onClick={copyToClipboard}
              className={`inline-flex items-center px-4 py-2 border border-l-0 rounded-r-md text-sm font-medium ${
                copied
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2 text-gray-500" />
                  Copy
                </>
              )}
            </button>
          </div>
          
          <div className="mt-6 bg-blue-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 text-sm text-blue-700">
                <p>
                  The borrower will be automatically linked to your account when they register using this link.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const XMLLoanUpload = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState(null);
  const [isCreatingLoan, setIsCreatingLoan] = useState(false);
  const [showBorrowerSelection, setShowBorrowerSelection] = useState(false);
  const [showReferralLink, setShowReferralLink] = useState(false);
  const [matchingBorrowers, setMatchingBorrowers] = useState([]);
  const [lenderId, setLenderId] = useState('');
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Get lender ID when component loads
  useEffect(() => {
    if (isOpen) {
      fetchLenderProfile();
    }
  }, [isOpen]);

  // Fetch lender profile to get lender ID for referral links
  const fetchLenderProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const response = await axios.get(
        `${API_URL}/api/v1/lenders/profile`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setLenderId(response.data.data?._id || '');
        console.log('Fetched lender ID:', response.data.data?._id);
      } else {
        console.error('Failed to fetch lender profile:', response.data);
      }
    } catch (error) {
      console.error('Error fetching lender profile:', error);
    }
  };

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
      
      // Log the extracted borrower details
      console.log('Extracted borrower details:', extractedData.borrowerDetails);
      
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
      try {
      const elements = xmlDoc.querySelectorAll(xpath);
      return elements.length > 0 ? elements[0].textContent?.trim() || defaultValue : defaultValue;
      } catch (error) {
        console.error(`Error extracting ${xpath}:`, error);
        return defaultValue;
      }
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

    // Helper to get text content from an element, supporting multiple selectors
    const queryText = (element, selectors) => {
      for (const selector of selectors) {
        const el = element.querySelector(selector);
        if (el) return el.textContent?.trim() || '';
      }
      return '';
    };

    // Helper to extract multiple elements
    const getElements = (context, selector) => {
        return Array.from(context.querySelectorAll(selector));
    }

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
      purchasePrice: getNumber('SalesContractAmount') || getNumber('collateral subject_property sales_contracts sales_contract sales_contract_detail salescontractamount'),
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

    // Extract asset information
    const assetsData = {
      checkingAndSavings: [],
      stocksAndBonds: [],
      otherAssets: [],
      giftsAndGrants: [],
      miscellaneous: {}
    };

    getElements(xmlDoc, 'ASSET').forEach(assetNode => {
      const assetType = queryText(assetNode, ['AssetType']);
      const value = parseFloat(queryText(assetNode, ['AssetCashOrMarketValueAmount']) || '0');
      const bankName = queryText(assetNode, ['ASSET_HOLDER NAME FullName']);

      switch (assetType) {
        case 'CheckingAccount':
        case 'SavingsAccount':
        case 'MoneyMarketAccount':
        case 'CertificateOfDeposit':
          assetsData.checkingAndSavings.push({ bankName, value, accountType: assetType.replace('Account', '') });
          break;
        case 'Stock':
        case 'Bond':
          assetsData.stocksAndBonds.push({ description: bankName || 'Stocks/Bonds', value });
          break;
        case 'GiftOfCash':
          const source = queryText(assetNode, ['FundsSourceType']);
          assetsData.giftsAndGrants.push({ source, value, deposited: true });
          break;
        case 'LifeInsurance':
           assetsData.miscellaneous.lifeInsurance = value;
           break;
        case 'RetirementFund':
            assetsData.miscellaneous.vestedInterestInRetirement = value;
            break;
        case 'Other':
            const otherType = queryText(assetNode, ['AssetTypeOtherDescription']);
            if (otherType === 'EarnestMoney') {
                assetsData.miscellaneous.earnestMoney = value;
            } else {
                assetsData.otherAssets.push({ description: otherType, value });
            }
            break;
        default:
          assetsData.otherAssets.push({ description: assetType, value });
          break;
      }
    });

    // Extract liabilities
    const debtsData = [];
    getElements(xmlDoc, 'LIABILITY').forEach(liabilityNode => {
      const debt = {
        creditorName: queryText(liabilityNode, ['LIABILITY_HOLDER NAME FullName']),
        monthlyPayment: parseFloat(queryText(liabilityNode, ['LiabilityMonthlyPaymentAmount']) || '0'),
        balance: parseFloat(queryText(liabilityNode, ['LiabilityUnpaidBalanceAmount']) || '0'),
        paidAtClosing: queryText(liabilityNode, ['LiabilityPayoffStatusIndicator']) === 'true',
        debtType: queryText(liabilityNode, ['LiabilityTypeOtherDescription']) || queryText(liabilityNode, ['LiabilityType'])
      };
      debtsData.push(debt);
    });

    // Extract declarations information - enhanced with multiple paths
    const declarationsData = {
      declaredBankruptcy: getMultiPathBoolean(['BankruptcyIndicator', 'declaration_detail bankruptcyindicator']),
      bankruptcyType: getMultiPathContent(['BankruptcyChapterType', 'bankruptcy_detail bankruptcychaptertype']),
      hadOwnershipInterest: getMultiPathContent(['HomeownerPastThreeYearsType', 'declaration_detail homeownerpastthreeyearstype']) === 'Yes',
      propertyForeclosed: getMultiPathBoolean(['PriorPropertyForeclosureCompletedIndicator', 'declaration_detail priorpropertyforeclosurecompletedIndicator']),
      partyToLawsuit: getMultiPathBoolean(['PartyToLawsuitIndicator', 'declaration_detail partytolawsuitindicator']),
      outstandingJudgements: getMultiPathBoolean(['OutstandingJudgmentsIndicator', 'declaration_detail outstandingjudgmentsindicator']),
      delinquent: getMultiPathBoolean(['PresentlyDelinquentIndicator', 'declaration_detail presentlydelinquentindicator']),
      alimonyChildSupport: getMultiPathBoolean(['AlimonyChildSupportObligationIndicator', 'declaration_detail alimonychildsupportobligationindicator']),
      borrowingMoney: getMultiPathBoolean(['UndisclosedBorrowedFundsIndicator', 'declaration_detail undisclosedborrowedfundsindicator']),
      borrowingMoneyAmount: getNumber('UndisclosedBorrowedFundsAmount', 'declaration_detail undisclosedborrowedfundsamount'),
      coSigner: getMultiPathBoolean(['UndisclosedComakerOfNoteIndicator', 'declaration_detail undisclosedcomakerofnoteindicator']),
      occupyAsPrimary: getMultiPathContent(['IntentToOccupyType', 'declaration_detail intenttooccupytype']) === 'Yes',
      applyingForMortgage: getMultiPathBoolean(['UndisclosedMortgageApplicationIndicator', 'declaration_detail undisclosedmortgageapplicationindicator']),
    };

    const incomeData = {
        baseIncome: 0,
        overtime: 0,
        bonuses: 0,
        commissions: 0,
        militaryEntitlements: 0,
        otherIncome: [],
    };

    getElements(xmlDoc, 'CURRENT_INCOME_ITEM').forEach(item => {
        const incomeType = queryText(item, ['IncomeType']);
        const amount = parseFloat(queryText(item, ['CurrentIncomeMonthlyTotalAmount']) || '0');
        const otherTypeDesc = queryText(item, ['OtherIncomeTypeDescription']);

        switch (incomeType) {
            case 'Base':
                incomeData.baseIncome = amount;
                break;
            case 'Overtime':
                incomeData.overtime = amount;
                break;
            case 'Bonus':
                incomeData.bonuses = amount;
                break;
            case 'Commission':
                incomeData.commissions = amount;
                break;
            case 'MilitaryEntitlements':
                incomeData.militaryEntitlements = amount;
                break;
            default:
                incomeData.otherIncome.push({
                    incomeType: otherTypeDesc || incomeType,
                    amount: amount
                });
                break;
        }
    });

    // Return structured data with enhanced fields
    return {
      borrowerDetails: borrowerData,
      loanDetails: loanData,
      property: propertyData,
      income: incomeData,
      assets: assetsData,
      debts: debtsData,
      militaryService: {
        isVeteran: getMultiPathBoolean(['selfdeclaredmilitaryserviceindicator', 'borrower_detail selfdeclaredmilitaryserviceindicator']),
        isActive: getMultiPathContent(['militarystatustype', 'military_service_detail militarystatustype'])?.includes('Active') || false,
        isSurvivingSpouse: getMultiPathBoolean(['SpousalVABenefitsEligibilityIndicator', 'borrower_detail spousalvabenefitseligibilityindicator']),
        currentlyServing: getMultiPathContent(['militarystatustype', 'military_service_detail militarystatustype']) === 'ActiveDuty',
        isRetired: getMultiPathContent(['militarystatustype', 'military_service_detail militarystatustype']) === 'Retired',
      },
      declarations: declarationsData,
      demographics: {
        ethnicity: getElements(xmlDoc, 'HMDA_ETHNICITY, HMDAEthnicity').map(el => ({type: queryText(el, ['HMDAEthnicityType'])})),
        race: getElements(xmlDoc, 'HMDA_RACE').map(el => ({
            type: queryText(el, ['HMDARaceType']),
            tribe: queryText(el, ['HMDARaceTypeAdditionalDescription'])
        })),
        sex: getMultiPathContent(['HMDAGenderType', '*[local-name()="HMDAGenderType"]']) || 'Not Provided',
        origin: getElements(xmlDoc, "HMDA_ETHNICITY_ORIGIN").map(el => ({type: queryText(el, ["HMDAEthnicityOriginType"])}))
      },
      residenceHistory: getElements(xmlDoc, 'RESIDENCE').map(residenceNode => ({
        address: {
            streetAddress: queryText(residenceNode, ['ADDRESS AddressLineText']),
            city: queryText(residenceNode, ['ADDRESS CityName']),
            state: queryText(residenceNode, ['ADDRESS StateCode']),
            zipCode: queryText(residenceNode, ['ADDRESS PostalCode']),
        },
        residencyType: queryText(residenceNode, ['RESIDENCE_DETAIL BorrowerResidencyType']),
        monthlyRent: parseFloat(queryText(residenceNode, ['LANDLORD LANDLORD_DETAIL MonthlyRentAmount']) || '0'),
        ownOrRent: queryText(residenceNode, ['RESIDENCE_DETAIL BorrowerResidencyBasisType']) === 'Own' ? 'Own' : 'Rent',
        yearsAtAddress: Math.floor(parseFloat(queryText(residenceNode, ['RESIDENCE_DETAIL BorrowerResidencyDurationMonthsCount']) || '0') / 12),
        monthsAtAddress: parseFloat(queryText(residenceNode, ['RESIDENCE_DETAIL BorrowerResidencyDurationMonthsCount']) || '0') % 12,
    }))
    };
  };
  
  // Check for matching borrowers before showing modal
  const checkForMatchingBorrowers = async () => {
    if (!file || !parsedData || !parsedData.borrowerDetails) {
      toast.error('No valid borrower data found in XML file');
      return;
    }
    
    try {
      const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1`;
      const token = localStorage.getItem('token');
      
      // Get all borrowers for the lender
      console.log('Fetching borrowers from API endpoint...');
      const response = await axios.get(
        `${API_URL}/lenders/borrowers`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('API Response status:', response.status);
      
      if (response.data.status !== 'success') {
        throw new Error('Failed to fetch borrowers');
      }
      
      const allBorrowers = response.data.data || [];
      console.log('Found borrowers:', allBorrowers.length);
      
      if (allBorrowers.length === 0) {
        // No borrowers at all, show referral link
        toast('No borrowers found. You can invite a new borrower.', {
          icon: '📝',
          style: {
            borderRadius: '10px',
            background: '#EFF6FF',
            color: '#1E40AF',
            border: '1px solid #DBEAFE',
          },
        });
        setShowReferralLink(true);
        return;
      }
      
      // Extract borrower details from XML
      const borrowerDetails = parsedData.borrowerDetails;
      
      // Log the borrower details we're searching for
      console.log('Searching for borrower match with:', {
        firstName: borrowerDetails.firstName,
        lastName: borrowerDetails.lastName,
        email: borrowerDetails.email,
        phone: borrowerDetails.phone
      });
      
      // EXACT EMAIL MATCH - Highest priority match
      if (borrowerDetails.email) {
        const emailMatches = allBorrowers.filter(b => 
          (b.user?.email && borrowerDetails.email && 
           b.user.email.toLowerCase() === borrowerDetails.email.toLowerCase()) ||
          (b.email && borrowerDetails.email && 
           b.email.toLowerCase() === borrowerDetails.email.toLowerCase())
        );
        
        if (emailMatches.length > 0) {
          console.log('Found exact email matches:', emailMatches.length);
          console.log('Sample match structure:', JSON.stringify(emailMatches[0], null, 2));
          
          // If we have exactly one match, automatically select it
          if (emailMatches.length === 1) {
            const exactMatch = emailMatches[0];
            
            // Show success message
            toast.success(`Found matching borrower: ${exactMatch.user?.firstName || ''} ${exactMatch.user?.lastName || ''}`, {
              duration: 5000,
            });
            
            // Directly proceed with this borrower
            handleBorrowerSelected({
              action: 'select',
              borrowerId: exactMatch._id,
              borrower: exactMatch
            });
            
            return;
          } else {
            // Multiple matches with same email - let user choose
            setMatchingBorrowers(emailMatches);
            setShowBorrowerSelection(true);
            return;
          }
        }
      }
      
      // No exact email match - show all borrowers
      console.log('No exact email match found, showing all borrowers');
      
      // Show toast notification
      toast('No exact email match found. Please select an existing borrower or create a new one.', {
        icon: 'ℹ️',
        style: {
          borderRadius: '10px',
          background: '#EFF6FF',
          color: '#1E40AF',
          border: '1px solid #DBEAFE',
        },
        duration: 5000,
      });
      
      // Show all borrowers in the selection modal
      setMatchingBorrowers(allBorrowers);
      setShowBorrowerSelection(true);
    } catch (error) {
      console.error('Error checking for matching borrowers:', error);
      toast.error('Failed to check for matching borrowers');
      // Default to showing borrower selection modal with all borrowers
      setMatchingBorrowers([]);
      setShowBorrowerSelection(true);
    }
  };

  const handleContinueClick = () => {
    if (!file) {
      toast.error('No XML file selected');
      return;
    }

    // Additional validation to ensure file is still valid
    try {
      // Check if file is still accessible
      if (!(file instanceof File)) {
        toast.error('Invalid file object. Please select the file again.');
        resetUpload();
        return;
      }
      
      // Check file size to ensure it's still valid
      if (file.size === 0) {
        toast.error('File appears to be empty. Please select again.');
        resetUpload();
        return;
      }
      
      console.log('Proceeding with valid file, checking for matching borrowers');
      
      // Use a try-catch block when checking for matching borrowers
      checkForMatchingBorrowers().catch(error => {
        console.error('Failed to check for matches:', error);
        toast.error('Could not check for matching borrowers. Showing selection screen.');
        setShowBorrowerSelection(true);
      });
      
    } catch (error) {
      console.error('Error validating file:', error);
      toast.error('There was an issue with the selected file. Please try again.');
      resetUpload();
    }
  };

  // Separated the function check from the original createLoanFromXML function
  const createLoanFromXML = () => {
    console.log('Creating loan from XML...');
    handleContinueClick();
  };

  const handleBorrowerSelected = async (borrowerSelection) => {
    try {
      console.log('Borrower selection:', JSON.stringify(borrowerSelection, null, 2));
      setIsCreatingLoan(true);
      setShowBorrowerSelection(false);
      
      // If creating a new borrower, show referral link instead of making API call
      if (borrowerSelection.action === 'create') {
        console.log('Selected to create a new borrower, showing referral link');
        setIsCreatingLoan(false);
        setShowReferralLink(true);
        return;
      }
      
      // Continue with existing borrower
      setShowReferralLink(false);

      // Create FormData for file upload
      const formData = new FormData();
      
      // Make sure we have the file and it's valid
      if (!file) {
        toast.error('XML file not found or invalid');
        setIsCreatingLoan(false);
        return;
      }
      
      // Add the file as the first item in the FormData
      formData.append('xmlFile', file);
      
      // Add borrower selection details
      if (borrowerSelection.action === 'select') {
        formData.append('borrowerId', borrowerSelection.borrowerId);
        formData.append('createNewBorrower', 'false');
        
        // Show success toast with borrower name if available
        if (borrowerSelection.borrower) {
          // Get borrower name from user object or directly from borrower
          const firstName = borrowerSelection.borrower.user?.firstName || borrowerSelection.borrower.firstName || '';
          const lastName = borrowerSelection.borrower.user?.lastName || borrowerSelection.borrower.lastName || '';
          const email = borrowerSelection.borrower.user?.email || borrowerSelection.borrower.email || '';
          
          const borrowerName = `${firstName} ${lastName}`.trim();
          toast.success(`Associating loan with borrower: ${borrowerName || email || 'Selected borrower'}`);
        }
      }

      // Get the API base URL
      const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1`;
      
      console.log('Uploading to:', `${API_URL}/loans/import-xml`);
      console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      console.log('Borrower selection:', borrowerSelection);
      console.log('File being sent:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      });

      // Use improved fetch with better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      // Upload XML file to backend for processing with improved error handling
      const response = await fetch(`${API_URL}/loans/import-xml`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // If response is not JSON, use the status text
          errorData = { message: response.statusText || 'Server error' };
        }
        
        console.error('API Error:', errorData);
        
        // Display specific error messages based on the error
        if (errorData.message && errorData.message.includes('duplicate key')) {
          // Special handling for duplicate email errors
          if (errorData.message.includes('email')) {
            // If this is a "borrower with email already exists" error, show the borrower selection modal again
            if (errorData.message.includes('borrower with email')) {
              toast.error('A borrower with this email already exists. Please select that borrower instead.');
              setShowBorrowerSelection(true);
              setIsCreatingLoan(false);
              return;
            } else {
              toast.error('A user with this email already exists. Please use a different email.');
            }
          } else {
            toast.error(`Database error: ${errorData.message}`);
          }
        } else if (errorData.message && errorData.message.includes('validation failed')) {
          toast.error(`Validation error: ${errorData.message}`);
        } else if (errorData.message && errorData.message.includes('S3')) {
          toast.error(`Storage error: ${errorData.message}`);
        } else if (errorData.message && errorData.message.includes('file')) {
          toast.error(`File error: ${errorData.message}`);
        } else {
          toast.error(`Error importing loan: ${errorData.message || 'Unknown error'}`);
        }
        
        setIsCreatingLoan(false);
        return;
      }

      const data = await response.json();
      
      console.log('Loan created successfully:', data);
      toast.success('Loan imported successfully!');
      
      // If we have a newly created loan, redirect to it
      if (data.data && data.data._id) {
        router.push(`/lender/loans/${data.data._id}`);
      } else {
        // Fallback to the loans list page
        router.push(`/lender/loans`);
      }

    } catch (error) {
      console.error('Error importing loan:', error);
      
      // Provide more descriptive error messages based on the error type
      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
      } else if (error.message && error.message.includes('NetworkError')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error.message && error.message.includes('path')) {
        toast.error('File path error. This may be due to S3 configuration issues.');
      } else {
        toast.error(`Error importing loan: ${error.message || 'Unknown error'}`);
      }
      
      setIsCreatingLoan(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setParsedData(null);
    setUploadProgress(0);
    setShowBorrowerSelection(false);
    setShowReferralLink(false);
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
                        <div><span className="font-medium">Annual Income:</span> ${parsedData.income.baseIncome?.toLocaleString() || '0'}</div>
                        <div><span className="font-medium">Employer:</span> {parsedData.borrowerDetails.employment?.employerName || 'Not provided'}</div>
                        <div><span className="font-medium">Position:</span> {parsedData.borrowerDetails.employment?.position || 'Not provided'}</div>
                        <div><span className="font-medium">Checking Accounts:</span> ${parsedData.assets.checkingAndSavings?.reduce((acc, curr) => acc + curr.value, 0).toLocaleString() || '0'}</div>
                        <div><span className="font-medium">Other Assets:</span> ${parsedData.assets.otherAssets?.reduce((acc, curr) => acc + curr.value, 0).toLocaleString() || '0'}</div>
                        <div>
                            <span className="font-medium">Total Assets:</span>
                            ${(
                                (parsedData.assets.checkingAndSavings?.reduce((acc, curr) => acc + curr.value, 0) || 0) +
                                (parsedData.assets.stocksAndBonds?.reduce((acc, curr) => acc + curr.value, 0) || 0) +
                                (parsedData.assets.otherAssets?.reduce((acc, curr) => acc + curr.value, 0) || 0) +
                                (parsedData.assets.giftsAndGrants?.reduce((acc, curr) => acc + curr.value, 0) || 0) +
                                (parsedData.assets.miscellaneous?.lifeInsurance || 0) +
                                (parsedData.assets.miscellaneous?.vestedInterestInRetirement || 0) +
                                (parsedData.assets.miscellaneous?.earnestMoney || 0)
                            ).toLocaleString() || '0'}
                        </div>
                        <div>
                            <span className="font-medium">Total Liabilities:</span>
                            ${(parsedData.debts?.reduce((acc, curr) => acc + curr.balance, 0) || 0).toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Declarations Info */}
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Declarations</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Bankruptcy:</span> {parsedData.declarations.declaredBankruptcy ? 'Yes' : 'No'}</div>
                        <div><span className="font-medium">Foreclosure:</span> {parsedData.declarations.propertyForeclosed ? 'Yes' : 'No'}</div>
                        <div><span className="font-medium">Legal Problems:</span> {parsedData.declarations.partyToLawsuit ? 'Yes' : 'No'}</div>
                        <div><span className="font-medium">Outstanding Judgments:</span> {parsedData.declarations.outstandingJudgements ? 'Yes' : 'No'}</div>
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
                  Continue
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Borrower Selection Modal */}
      <BorrowerSelectionModal
        isOpen={showBorrowerSelection}
        onClose={() => {
          setShowBorrowerSelection(false);
          resetUpload();
        }}
        onBorrowerSelected={handleBorrowerSelected}
        initialBorrowers={matchingBorrowers}
        borrowerDataFromXml={parsedData?.borrowerDetails}
      />
      
      {/* Referral Link Modal */}
      <ReferralLinkModal
        isOpen={showReferralLink}
        onClose={() => {
          setShowReferralLink(false);
          resetUpload();
        }}
        lenderId={lenderId}
      />
    </div>
  );
};

export default XMLLoanUpload;
