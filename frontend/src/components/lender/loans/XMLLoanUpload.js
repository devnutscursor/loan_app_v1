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
  FileSpreadsheet
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

    // Extract borrower information
    const borrowerData = {
      firstName: getTextContent('FirstName'),
      lastName: getTextContent('LastName'),
      fullName: getTextContent('FullName'),
      email: getTextContent('ContactPointEmailValue'),
      phone: getTextContent('ContactPointTelephoneValue'),
      dateOfBirth: getTextContent('BorrowerBirthDate'),
      ssn: getTextContent('TaxpayerIdentifierValue'),
      maritalStatus: getTextContent('MaritalStatusType'),
      dependentCount: getNumber('DependentCount'),
      
      // Address information
      address: {
        streetAddress: getTextContent('AddressLineText'),
        city: getTextContent('CityName'),
        state: getTextContent('StateCode'),
        zipCode: getTextContent('PostalCode'),
      },

      // Employment information (simplified)
      employment: {
        employerName: getTextContent('FullName'),
        position: getTextContent('EmploymentPositionDescription'),
        monthlyIncome: getNumber('EmploymentMonthlyIncomeAmount'),
        startDate: getTextContent('EmploymentStartDate'),
        isSelfEmployed: getTextContent('EmploymentBorrowerSelfEmployedIndicator') === 'true',
      }
    };

    // Extract loan information
    const loanData = {
      loanType: getTextContent('LoanPurposeType') || 'Purchase',
      loanAmount: getNumber('LoanAmount'),
      loanTerm: getNumber('LoanTermMonths') / 12 || 30, // Convert months to years
    };

    // Extract property information
    const propertyData = {
      streetAddress: getTextContent('SUBJECT_PROPERTY AddressLineText'),
      city: getTextContent('SUBJECT_PROPERTY CityName'),
      state: getTextContent('SUBJECT_PROPERTY StateCode'),
      zipCode: getTextContent('SUBJECT_PROPERTY PostalCode'),
      purchasePrice: getNumber('SalesContractAmount'),
      estimatedValue: getNumber('SalesContractAmount'), // Use same value if no separate appraisal
    };

    // Return structured data
    return {
      borrowerDetails: borrowerData,
      loanDetails: loanData,
      property: propertyData,
      income: {
        baseIncome: borrowerData.employment.monthlyIncome * 12,
        overtime: 0,
        commissions: 0,
        bonuses: 0,
        militaryEntitlements: 0,
      },
      assets: {
        checkingAccounts: 0,
        savingsAccounts: 0,
        investments: 0,
        retirementAccounts: 0,
      },
      debts: {
        creditCards: 0,
        autoLoans: 0,
        studentLoans: 0,
        otherDebts: 0,
      },
      militaryService: {
        isVeteran: false,
        isActive: false,
      },
      declarations: {
        bankruptcyHistory: false,
        foreclosureHistory: false,
        legalProblems: false,
      },
      demographics: {
        ethnicity: 'Not Provided',
        race: 'Not Provided',
        sex: 'Not Provided',
      }
    };
  };  const createLoanFromXML = async () => {
    if (!file) {
      toast.error('No XML file selected');
      return;
    }

    try {
      setIsCreatingLoan(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('xmlFile', file);

      // Get the API base URL
      const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1`;
      
      console.log('Uploading to:', `${API_URL}/loans/import-xml`);
      console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');

      // Upload XML file to backend for processing
      const response = await fetch(`${API_URL}/loans/import-xml`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON (like HTML error page), get the text
          const errorText = await response.text();
          console.log('Error response text:', errorText.substring(0, 200));
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Success response:', result);

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
                        <div><span className="font-medium">Purchase Price:</span> ${parsedData.property.purchasePrice?.toLocaleString() || 'Not specified'}</div>
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
                        <div><span className="font-medium">Employment:</span> {parsedData.borrowerDetails.employment.employerName || 'Not provided'}</div>
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
