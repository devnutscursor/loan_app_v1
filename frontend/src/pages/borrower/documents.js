import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import MainLayout from "../../components/layout/MainLayout";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import DocumentManager from "../../components/borrower/documents/DocumentManager";
import RequiredDocumentsList from "../../components/borrower/documents/RequiredDocumentsList";
import { LoanService, DocumentService } from "../../services";
import { borrowerService } from "../../services/api";
import { useRouter } from "next/router"; // Add router import

/**
 * Documents Component
 *
 * Main documents page for borrowers to upload and manage loan documents.
 */
const Documents = () => {
  const router = useRouter(); // Add router
  const { loanId: urlLoanId } = router.query; // Extract loanId from URL
  
  // State for selected loan to associate documents with
  const [loans, setLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [selectedDocumentRequest, setSelectedDocumentRequest] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // No longer need to manually clear document request flags as this is now handled
  // automatically through the loan conditions system

  // Handle file upload for document requests
  const handleFileUpload = async (event, documentRequest) => {
    console.log("Uploading document request:", documentRequest);
    setIsUploading(true);
    const file = event.target.files[0];

    if (!file) {
      toast.error("Please select a file to upload");
      setIsUploading(false);
      return;
    }

    // Get correct category and documentType
    // Handle the case where category might be 'Document' which is not valid
    let category = documentRequest.category;
    console.log("Category:", category);
    // if (category === 'Document') category = 'Identity';
    if (
      ![
        "Identity",
        "Income",
        "Address",
        "Property",
        "Employment",
        "Insurance",
        "Financial",
        "Legal",
        "Other",
      ].includes(category)
    ) {
      category = "Other";
    }

    // Make sure documentType is valid
    let documentType = documentRequest.documentType;
    console.log("Document type:", documentType);
    if (!documentType || documentType === "undefined") {
      // If the request title contains a hint about the document type
      if (
        documentRequest.title.toLowerCase().includes("driver") ||
        documentRequest.title.toLowerCase().includes("license")
      ) {
        documentType = "Driver License";
      } else if (documentRequest.title.toLowerCase().includes("passport")) {
        documentType = "Passport";
      } else {
        documentType = "Other";
      }
    }

    // Create document data
    const documentData = {
      name: documentRequest.title || file.name,
      documentType: documentType,
      category: category,
      description:
        documentRequest.description || "Document requested by lender",
      // Add status to ensure it shows as pending review
      status: "Pending Review",
    };

    console.log("Using validated document data:", documentData);

    console.log("Uploading requested document:", documentData);

    // Before uploading, check if there's an existing document that matches this category/type
    // NOTE: We're just proceeding with upload directly

    // Upload the document
    const response = await DocumentService.uploadDocument(
      documentData,
      documentRequest.loanId || selectedLoanId,
      file
    );

    if (response.success) {
      toast.success("Document uploaded successfully");

      // No longer need to clear localStorage as we're using loan conditions now
      console.log(
        "Document uploaded successfully - any update requests will be automatically cleared"
      );

      // Document successfully uploaded, now remove the condition from the loan
      try {
        console.log("Removing loan condition with ID:", documentRequest._id);
        const loanId = selectedLoanId || documentRequest.loanId;
        const conditionId = documentRequest._id;

        const removeResponse = await borrowerService.removeCondition(
          loanId,
          conditionId
        );

        if (removeResponse.data && removeResponse.data.status === "success") {
          console.log("Successfully removed condition from loan model");

          // Also remove from the UI state immediately
          setDocumentRequests((prevRequests) => {
            return prevRequests.filter(
              (req) => req._id !== documentRequest._id
            );
          });

          // Set the selected document request for the RequiredDocumentsList component
          // This will trigger the component to update and move the document to completed section
          setSelectedDocumentRequest({
            ...documentRequest,
            uploadedDocumentId: response.data._id, // Pass the uploaded document ID
            status: "Pending Review",
            isCompleted: true,
          });
        } else {
          console.warn(
            "Failed to remove condition from loan model:",
            removeResponse
          );
        }
      } catch (updateError) {
        console.error("Error removing condition from loan model:", updateError);
      }

      // Refresh the documents list
      setRefreshTrigger((prev) => prev + 1);
    } else {
      toast.error(response.message || "Failed to upload document");
    }

    setIsUploading(false);
  };

  // Fetch user's loans on component mount
  useEffect(() => {
    const fetchLoans = async () => {
      setIsLoadingLoans(true);
      try {
        // Apply any filters (empty for now)
        const apiFilters = {};

        // Fetch loans using the LoanService
        const response = await LoanService.getLoans(apiFilters);

        if (response.success) {
          // Extract loans from the nested structure in the API response
          const loansData = response.data?.data?.loans || [];
          console.log("Loaded loans:", loansData.length);
          setLoans(loansData);
          // Check if we have a loanId from URL query params
          if (urlLoanId && loansData.some(loan => loan._id === urlLoanId)) {
            console.log(`Setting selected loan from URL: ${urlLoanId}`);
            setSelectedLoanId(urlLoanId);
          }
          // If no valid loanId in URL or it doesn't match any loans, use first loan as default
          else if (loansData.length > 0 && !selectedLoanId) {
            console.log(`Setting first loan as default: ${loansData[0]._id}`);
            setSelectedLoanId(loansData[0]._id);
          }
        } else {
          console.log("Setting empty loans array - API call unsuccessful");
          setLoans([]);
          toast.error(response.message || "Failed to load loans");
        }
      } catch (error) {
        console.error("Error loading loans:", error);
        toast.error(
          "Error loading your loan applications. Using sample data instead."
        );

        // Use sample data for development/testing when API fails
        const sampleLoans = [
          {
            _id: "sample-loan-1",
            purpose: "Purchase",
            status: "In Progress",
            loanNumber: "LN1001",
          },
          {
            _id: "sample-loan-2",
            purpose: "Refinance",
            status: "Approved",
            loanNumber: "LN1002",
          },
        ];
        setLoans(sampleLoans);
      } finally {
        setIsLoadingLoans(false);
      }
    };

    fetchLoans();
  }, [urlLoanId]); // Re-fetch when URL changes

  // Fetch document requests from loan conditions
  useEffect(() => {
    const fetchDocumentRequests = async () => {
      setIsLoadingRequests(true);
      try {
        const response = await borrowerService.getActiveLoanConditions();
        console.log("Document requests response:", response);

        if (response && response.data && Array.isArray(response.data.data)) {
          // Filter for document-related conditions with 'Pending' status
          const requests = response.data.data;
          console.log(`Loaded ${requests.length} document requests`);
          
          // Group requests by title and keep only the latest one
          const latestRequests = {};
          
          requests.forEach(request => {
            const key = `${request.title}-${request.documentType || ''}-${request.loanId}`;
            
            // If we don't have this request type yet, or this one is newer
            if (!latestRequests[key] || 
                // Try to use createdAt if available, otherwise fall back to _id (which contains creation timestamp)
                (request.createdAt && latestRequests[key].createdAt && 
                 new Date(request.createdAt) > new Date(latestRequests[key].createdAt)) ||
                (!request.createdAt && request._id && latestRequests[key]._id &&
                 request._id > latestRequests[key]._id)) {
              latestRequests[key] = request;
            }
          });
          
          // Convert back to array
          const uniqueRequests = Object.values(latestRequests);
          console.log(`Filtered to ${uniqueRequests.length} unique document requests`);
          
          setDocumentRequests(uniqueRequests);
        } else {
          console.log("No document requests found or invalid response format");
          setDocumentRequests([]);
        }
      } catch (error) {
        console.error("Error fetching document requests:", error);
        toast.error("Failed to load document requests");
        setDocumentRequests([]);
      } finally {
        setIsLoadingRequests(false);
      }
    };

    fetchDocumentRequests();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  // Handle loan selection change with URL update
  const handleLoanSelection = (loanId) => {
    setSelectedLoanId(loanId);
    
    // Update the URL to reflect the selected loan (shallow routing)
    router.push(`/borrower/documents?loanId=${loanId}`, undefined, { shallow: true });
  };

  return (
    <ProtectedRoute allowedRoles={["borrower"]}>
      <MainLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-0 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Document Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload, manage, and track documents for your loan applications
            </p>
          </div>

          <div className="max-w-7xl mx-auto px-0 sm:px-6 md:px-8 mt-6">
            {/* Enhanced Loan Selector */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Select Loan Application
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose the loan application you want to upload documents for
                </p>
              </div>

              <div className="px-6 py-4">
                {isLoadingLoans ? (
                  <div className="space-y-3">
                    <div className="animate-pulse h-14 bg-gray-100 rounded-md"></div>
                    <div className="animate-pulse h-14 bg-gray-100 rounded-md"></div>
                  </div>
                ) : loans.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto px-1 py-1 space-y-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {loans.map((loan) => {
                      // Determine status color
                      let statusColor = "bg-gray-100 text-gray-800";
                      if (loan.status) {
                        const status = loan.status.toLowerCase();
                        if (status.includes("approved") || status.includes("conditional approval"))
                          statusColor = "bg-green-100 text-green-800";
                        else if (status.includes("review"))
                          statusColor = "bg-yellow-100 text-yellow-800";
                        else if (status.includes("submit"))
                          statusColor = "bg-blue-100 text-blue-800";
                        else if (status.includes("reject") || status.includes("declined"))
                          statusColor = "bg-red-100 text-red-800";
                      }

                      // If no loan is selected, select the first one by default
                      if (
                        !selectedLoanId &&
                        loans.length > 0 &&
                        !isLoadingLoans
                      ) {
                        setSelectedLoanId(loans[0]._id);
                      }

                      return (
                        <div
                          key={loan._id || `loan-${Math.random()}`}
                          onClick={() => handleLoanSelection(loan._id)}
                          className={`cursor-pointer p-3 rounded-md hover:bg-blue-50 transition-colors duration-150 ${
                            selectedLoanId === loan._id
                              ? "bg-blue-50 ring-2 ring-blue-500 ring-offset-1"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div
                                className={`h-4 w-4 rounded-full ${
                                  selectedLoanId === loan._id
                                    ? "bg-blue-500"
                                    : "border-2 border-gray-300"
                                }`}
                              ></div>
                              <div className="ml-3">
                                <div className="font-medium text-gray-900">
                                  {loan.loanNumber || loan._id}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {loan.loanDetails?.loanType || "Loan"}{" "}
                                  {loan.loanDetails?.loanPurpose
                                    ? `- ${loan.loanDetails.loanPurpose}`
                                    : ""}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
                            >
                              {loan.status?.toLowerCase() === 'conditional approval' ? 'Approved' :
                               loan.status?.toLowerCase() === 'declined' ? 'Rejected' :
                               loan.status || "Processing"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
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
                      No loan applications found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start by creating a new loan application.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Document Requests from Lender */}
            {documentRequests && documentRequests.filter(request => request.loanId === selectedLoanId).length > 0 && (
              <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-4 transition-all duration-300 hover:shadow-xl border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-white">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-primary"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Document Requests for Selected Loan
                  </h3>
                  <p className="mt-0.5 max-w-2xl text-xs text-gray-500">
                    The following documents have been requested for loan {loans.find(loan => loan._id === selectedLoanId)?.loanNumber}.
                  </p>
                </div>
                <div>
                  {isLoadingRequests ? (
                    <div className="flex justify-center items-center h-24 bg-gray-50/50">
                      <div className="flex flex-col items-center">
                        <svg
                          className="animate-spin h-8 w-8 text-primary"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <p className="mt-1 text-xs text-gray-500">
                          Loading requests...
                        </p>
                      </div>
                    </div>
                  ) : documentRequests.filter(request => request.loanId === selectedLoanId).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-sm font-medium text-gray-900">No document requests found</h3>
                      <p className="text-xs text-gray-500 mt-1">There are no pending document requests for this loan.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {documentRequests
                        .filter(request => request.loanId === selectedLoanId)
                        .map((request) => {
                        // Calculate if due date is soon (within 24 hours)
                        const dueDate = new Date(request.dueDate);
                        const today = new Date();
                        const diffTime = dueDate - today;
                        const diffDays = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24)
                        );
                        const isDueSoon = diffDays <= 1 && diffDays >= 0;
                        const isPastDue = diffDays < 0;

                        return (
                          <li
                            key={request._id}
                            className="transition-all duration-200 hover:bg-gray-50"
                          >
                            <div className="py-2.5 px-4">
                              <div className="sm:flex sm:items-start sm:justify-between">
                                <div className="flex-1 min-w-0 pr-4">
                                  <h4 className="text-base font-medium text-gray-900 flex items-center gap-2">
                                    {request.title}
                                    {isDueSoon && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Due Soon
                                      </span>
                                    )}
                                    {isPastDue && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                        Past Due
                                      </span>
                                    )}
                                  </h4>
                                  <p className="mt-1 text-xs text-gray-600">
                                    {request.description}
                                  </p>
                                  <div className="mt-1 flex items-center text-xs text-gray-500 space-x-4">
                                    <span className="flex items-center">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-1 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                      Due:{" "}
                                      {new Date(
                                        request.dueDate
                                      ).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-1 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                      Loan: {request.loanNumber}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-4 sm:mt-0">
                                  <button
                                    onClick={() => {
                                      // Set the selected loan to match this request's loan
                                      if (request.loanId)
                                        setSelectedLoanId(request.loanId);

                                      // Create a dedicated file input for this document request
                                      const fileInput =
                                        document.createElement("input");
                                      fileInput.type = "file";
                                      fileInput.style.display = "none";
                                      document.body.appendChild(fileInput);

                                      // Handle file selection
                                      fileInput.onchange = async (e) => {
                                        handleFileUpload(e, request);
                                      };

                                      // Trigger the file input click
                                      fileInput.click();
                                    }}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white 
bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary transform hover:-translate-y-0.5"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-2"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"
                                      />
                                    </svg>
                                    Upload Document
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Required Documents Checklist */}
            <div className="mb-6 mt-6" id="upload-section">
              <RequiredDocumentsList
                loanId={selectedLoanId}
                onDocumentUploaded={() => {
                  setRefreshTrigger((prev) => prev + 1);
                  setSelectedDocumentRequest(null);
                }}
                selectedRequest={selectedDocumentRequest}
              />
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default Documents;
