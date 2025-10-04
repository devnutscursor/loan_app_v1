import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { LoanService, DocumentService } from '../services';
import { borrowerService } from '../services/api';

export const useDocuments = () => {
  const router = useRouter();
  const { loanId: urlLoanId } = router.query;
  
  // State for selected loan to associate documents with
  const [loans, setLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [selectedDocumentRequest, setSelectedDocumentRequest] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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

    let borrowerId = null;
    try {
      const borrowerProfile = await borrowerService.getProfile();
      console.log('Borrower profile:', borrowerProfile.data.data);
      if (borrowerProfile.data && borrowerProfile.data.data._id) {
        borrowerId = borrowerProfile.data.data._id;
        console.log('Got borrowerId from profile:', borrowerId);
      }
    } catch (error) {
      console.warn('Could not get borrower profile:', error);
    }

    // Get correct category and documentType
    let category = documentRequest.category;
    console.log("Category:", category);
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
      borrowerId: borrowerId,
    };

    console.log("Using validated document data:", documentData);
    console.log("Uploading requested document:", documentData);

    // Upload the document
    const response = await DocumentService.uploadDocument(
      documentData,
      documentRequest.loanId || selectedLoanId,
      file,
      borrowerId
    );

    if (response.success) {
      toast.success("Document uploaded successfully");

      console.log(
        "Document uploaded successfully - any update requests will be automatically cleared"
      );

      // Document successfully uploaded, now remove the condition from the loan
      try {
        console.log("Removing loan condition with ID:", documentRequest._id);
        const loanId = selectedLoanId || documentRequest.loanId;
        const conditionId = documentRequest._id;

        console.log("Calling removeCondition with:", { loanId, conditionId });

        const removeResponse = await borrowerService.removeCondition(
          loanId,
          conditionId
        );

        console.log("Remove condition response:", removeResponse);

        if (removeResponse.data && removeResponse.data.status === "success") {
          console.log("✅ Successfully removed condition from loan model");

          // Also remove from the UI state immediately
          setDocumentRequests((prevRequests) => {
            const filtered = prevRequests.filter(
              (req) => req._id !== documentRequest._id
            );
            console.log(`Removed condition from UI state. Remaining requests: ${filtered.length}`);
            return filtered;
          });

          // Set the selected document request for the RequiredDocumentsList component
          // This will trigger the component to update and move the document to completed section
          setSelectedDocumentRequest({
            ...documentRequest,
            uploadedDocumentId: response.data._id, // Pass the uploaded document ID
            status: "Pending Review",
            isCompleted: true,
          });
        }
      } catch (updateError) {
        console.error("❌ Error removing condition from loan model:", updateError);
        toast.error("Document uploaded but failed to remove request. Please refresh the page.");
      }

      // Refresh the documents list and document requests
      setRefreshTrigger((prev) => prev + 1);
      
      // Also refresh document requests after a short delay to ensure backend has processed
      setTimeout(() => {
        console.log("🔄 Refreshing document requests after upload...");
        // This will trigger the useEffect that fetches document requests
        setRefreshTrigger((prev) => prev + 1);
      }, 2000);
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

  return {
    // State
    loans,
    selectedLoanId,
    isLoadingLoans,
    refreshTrigger,
    documentRequests,
    isLoadingRequests,
    selectedDocumentRequest,
    isUploading,
    
    // Handlers
    handleFileUpload,
    handleLoanSelection,
    
    // Utility functions
    setRefreshTrigger,
    setSelectedDocumentRequest,
    
    // Computed values
    hasLoans: loans.length > 0,
    selectedLoanRequests: documentRequests.filter(request => request.loanId === selectedLoanId),
    hasSelectedLoanRequests: documentRequests.filter(request => request.loanId === selectedLoanId).length > 0
  };
};
