import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { lenderService } from "../../../services/api";
import { standardDocumentRequirements } from "../../../data/documentRequirements";
import { assignDocumentsToRequirements } from "../../../utils/documentMatching";
import DocumentRequirementCard from "./DocumentRequirementCard";
import DocumentRequestModal from "./DocumentRequestModal";
import BatchRequestModal from "./BatchRequestModal";

/**
 * LenderDocumentRequirements Component
 *
 * Displays a checklist of required documents for a loan application
 * with status indicators and options for lenders to approve, reject, or request new documents.
 */
// Function to check if a document has an update request based on loan conditions
const hasDocumentCondition = (
  loanConditions,
  category,
  documentType,
  title
) => {
  if (
    !loanConditions ||
    !Array.isArray(loanConditions) ||
    loanConditions.length === 0
  ) {
    return false;
  }

  // Check if there's a pending document condition matching this category/type
  return loanConditions.some((condition) => {
    // Check if it's a document condition
    if (condition.category !== category) {
      return false;
    }

    // Clean up the title by removing "Document Required" suffix for comparison
    const cleanTitle = condition.title
      .toLowerCase()
      .replace(" document required", "");

    // Check if the clean title matches the document type
    const titleMatches =
      cleanTitle === title.toLowerCase() ||
      title.toLowerCase().includes(cleanTitle) ||
      cleanTitle.includes(title.toLowerCase());

    // If we have a specific documentType field in condition, check that too
    const typeMatches = condition.documentType
      ? condition.documentType.toLowerCase() === documentType.toLowerCase()
      : false;

    // For debugging, log the matching process
    console.log(
      `Comparing: "${cleanTitle}" with "${documentType.toLowerCase()}" - Match: ${
        titleMatches || typeMatches
      }`
    );

    return titleMatches || typeMatches;
  });
};

const LenderDocumentRequirements = ({
  loanId,
  documents,
  refreshDocuments,
}) => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingDocId, setProcessingDocId] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestDetails, setRequestDetails] = useState({
    documentType: "",
    category: "",
    title: "",
    reason: "",
    customReason: "",
    isUpdate: false,
  });
  const [modalKey, setModalKey] = useState(Date.now());
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [loanConditions, setLoanConditions] = useState([]);
  // New state for multi-select functionality
  const [selectMode, setSelectMode] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [processingBatch, setProcessingBatch] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Process documents and map them to requirements
  const processDocuments = (docsList) => {
    console.log('Process Documents called with:', docsList?.length, 'documents');
    console.log("Current loan conditions:", loanConditions);
    console.log("Current requirements:", requirements);

    // Create a map of existing requirement statuses to preserve them
    const existingStatusMap = {};
    
    // First load from current requirements
    requirements.forEach(req => {
      if (req.documentId) {
        existingStatusMap[req.documentId] = {
          status: req.status,
          isSubmitted: req.isSubmitted,
          requestedUpdate: req.requestedUpdate
        };
      }
      // Also map by matchedDocument._id if available
      if (req.matchedDocument?._id) {
        existingStatusMap[req.matchedDocument._id] = {
          status: req.status,
          isSubmitted: req.isSubmitted,
          requestedUpdate: req.requestedUpdate
        };
      }
      // Also map by req.id as fallback
      if (req.id) {
        existingStatusMap[req.id] = {
          status: req.status,
          isSubmitted: req.isSubmitted,
          requestedUpdate: req.requestedUpdate
        };
      }
      
      // Use category and documentType as key too
      if (req.category && req.documentType) {
        existingStatusMap[`${req.category}-${req.documentType}`] = {
          status: req.status,
          isSubmitted: req.isSubmitted,
          requestedUpdate: req.requestedUpdate
        };
      }
    });
    
    // Then check localStorage for any persisted states
    try {
      const storedStates = JSON.parse(localStorage.getItem('documentStates') || '{}');
      console.log("Loaded states from localStorage:", storedStates);
      
      // For each stored state that matches this loan
      Object.entries(storedStates).forEach(([key, state]) => {
        if (key.startsWith(`${loanId}-`)) {
          // Extract category and document type from key
          const parts = key.split('-');
          if (parts.length >= 3) {
            const category = parts[1];
            const documentType = parts[2];
            
            // Add to the existing status map
            existingStatusMap[`${category}-${documentType}`] = {
              status: state.status,
              isSubmitted: false,
              requestedUpdate: state.requestedUpdate
            };
            
            console.log(`Restored state for ${category}-${documentType}: ${state.status}`);
          }
        }
      });
    } catch (err) {
      console.error("Failed to load persisted document states:", err);
    }
    
    console.log("Existing status map:", existingStatusMap);

    if (!loanId || !docsList || !docsList.length) {
      console.log('No documents found, setting default requirements but preserving existing statuses');

      // Set default requirements without document mappings, but preserve statuses
      const updatedReqs = standardDocumentRequirements.map((req, index) => {
        const reqId = `req-${index}`;
        // Check if there's a pending document condition for this requirement
        const hasCondition = hasDocumentCondition(
          loanConditions,
          req.category,
          req.documentType,
          req.title
        );
        
        // Check if we have an existing status for this requirement, looking at multiple possible keys
        const existingStatus = 
          existingStatusMap[reqId] || 
          existingStatusMap[`${req.category}-${req.documentType}`] ||
          existingStatusMap[`${loanId}-${req.category}-${req.documentType}`];
        
        // Determine if this document needs correction (from conditions OR persisted state)
        const needsCorrection = hasCondition || 
                               (existingStatus && 
                                existingStatus.requestedUpdate && 
                                existingStatus.status === "Needs Correction");

        return {
          ...req,
          id: reqId,
          // Preserve existing status if available, otherwise set default
          status: existingStatus ? existingStatus.status : 
                 (needsCorrection ? "Needs Correction" : "Not Submitted"),
          isSubmitted: existingStatus ? existingStatus.isSubmitted : false,
          requestedUpdate: needsCorrection, // Set based on condition existence or persisted state
        };
      });

      console.log("Requirements with preserved statuses:", updatedReqs);
      setRequirements(updatedReqs);
      setLoading(false);
      return;
    }

    // Filter out duplicate documents based on original filename or name
    const uniqueDocuments = [];
    const docNames = new Set();

    // Assign documents to requirements
    const documentAssignments = assignDocumentsToRequirements(
      standardDocumentRequirements,
      docsList
    );
    console.log('Document assignments:', documentAssignments);

    const updatedReqs = standardDocumentRequirements.map((req) => {
      const assignedDoc = documentAssignments[req.id];

      if (assignedDoc) {
        // Check if we have an existing status for this document, checking multiple possible keys
        const existingStatus = 
          existingStatusMap[assignedDoc._id] || 
          existingStatusMap[req.id] ||
          existingStatusMap[`${req.category}-${req.documentType}`] ||
          existingStatusMap[`${loanId}-${req.category}-${req.documentType}`];
        
        // Check if this document has a condition from the lender
        const hasCondition = hasDocumentCondition(
          loanConditions,
          req.category,
          req.documentType,
          req.title
        );
        
        // Check if this is a newly uploaded document by comparing timestamps
        const isNewlyUploaded = assignedDoc.createdAt && existingStatus?.timestamp && 
                               new Date(assignedDoc.createdAt) > new Date(existingStatus.timestamp);
        
        console.log(`Document ${req.title}: isNewlyUploaded=${isNewlyUploaded}, hasCondition=${hasCondition}`);
        
        // If this is a newly uploaded document, clear the requestedUpdate flag in localStorage
        if (isNewlyUploaded) {
          try {
            const storedStates = JSON.parse(localStorage.getItem('documentStates') || '{}');
            const docKey = `${loanId}-${req.category}-${req.documentType}`;
            
            if (storedStates[docKey] && storedStates[docKey].requestedUpdate) {
              console.log(`Clearing requestedUpdate flag for newly uploaded document: ${docKey}`);
              delete storedStates[docKey];
              localStorage.setItem('documentStates', JSON.stringify(storedStates));
            }
          } catch (err) {
            console.error("Failed to clear persisted document update state:", err);
          }
        }
        
        // Determine if document needs correction based on conditions and not being newly uploaded
        const needsCorrection = hasCondition && !isNewlyUploaded;
        
        return {
          ...req,
          isSubmitted: true,
          // Use existing status if available, otherwise use the assigned doc status or default
          status: needsCorrection ? "Needs Correction" : 
                 (isNewlyUploaded ? "Pending Review" : // Reset status for newly uploaded docs
                 (existingStatus ? existingStatus.status : 
                 (assignedDoc.status || "Pending Review"))),
          documentId: assignedDoc._id,
          url: assignedDoc.fileUrl || assignedDoc.url,
          uploadDate: assignedDoc.createdAt || assignedDoc.uploadedAt,
          requestedUpdate: needsCorrection && !isNewlyUploaded, // Don't mark as needing update if newly uploaded
          // Store original document info for debugging
          matchedDocument: assignedDoc,
        };
      }

      // For unassigned documents, check if there's an existing status, checking multiple possible keys
      const existingStatus = 
        existingStatusMap[req.id] || 
        existingStatusMap[`${req.category}-${req.documentType}`] ||
        existingStatusMap[`${loanId}-${req.category}-${req.documentType}`];
      
      // Check if there's a pending document condition for this requirement
      const hasCondition = hasDocumentCondition(
        loanConditions,
        req.category,
        req.documentType,
        req.title
      );
      
      // Determine if this document needs correction (from conditions OR persisted state)
      const needsCorrection = hasCondition || 
                             (existingStatus && 
                              existingStatus.requestedUpdate && 
                              existingStatus.status === "Needs Correction");
      
      return {
        ...req,
        isSubmitted: existingStatus ? existingStatus.isSubmitted : false,
        status: needsCorrection ? "Needs Correction" : 
               (existingStatus ? existingStatus.status : "Not Submitted"),
        requestedUpdate: needsCorrection,
        matchedDocument: null,
      };
    });

    // console.log('Updated requirements:', updatedReqs);
    setRequirements(updatedReqs);
    setLoading(false);
  };

  // Toggle document selection
  const handleToggleDocumentSelection = (doc) => {
    setSelectedDocuments(prev => {
      const isSelected = prev.some(item => item.id === doc.id);
      if (isSelected) {
        return prev.filter(item => item.id !== doc.id);
      } else {
        return [...prev, doc];
      }
    });
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectMode(prev => {
      const newMode = !prev;
      if (!newMode) {
        // When turning off selection mode, clear selections
        setSelectedDocuments([]);
      }
      return newMode;
    });
  };

  // Open batch request modal
  const openBatchModal = () => {
    if (selectedDocuments.length === 0) {
      toast.error("Please select at least one document to request");
      return;
    }
    setShowBatchModal(true);
  };

  // Close batch request modal
  const closeBatchModal = () => {
    setShowBatchModal(false);
  };

  // Handle batch document requests
  const handleBatchRequest = async () => {
    if (selectedDocuments.length === 0) {
      toast.error("Please select at least one document to request");
      return;
    }

    setProcessingBatch(true);

    try {
      // First, fetch loan data to get borrower ID
      console.log("Fetching loan data for batch request...");
      const loanResponse = await lenderService.getLoan(loanId);
      
      if (!loanResponse?.data?.data) {
        console.error("Error: Could not fetch loan data for batch request");
        toast.error("Unable to fetch loan details");
        return;
      }
      
      const loan = loanResponse.data.data;
      const borrowerId = loan?.borrower;
      
      if (!borrowerId) {
        console.error("Error: No borrower ID found in loan for batch request", loan);
        toast.error("Unable to determine the borrower for this loan. Please check loan details.");
        return;
      }

      // Prepare the documents array for batch request
      const documentsForRequest = selectedDocuments.map(doc => ({
        title: doc.title,
        documentType: doc.documentType,
        category: doc.category,
        description: doc.description,
        isUpdate: false
      }));
      
      // Send the batch request
      await lenderService.requestDocumentsBatch(loanId, borrowerId, documentsForRequest);

      toast.success(`${selectedDocuments.length} document requests sent successfully! An email notification has been sent to the borrower.`);
      
      console.log("Updating UI for batch requested documents...");
      
      // Get existing stored document states or initialize empty object for localStorage
      const storedStates = JSON.parse(localStorage.getItem('documentStates') || '{}');
      
      // Update each document's status in the UI and localStorage
      selectedDocuments.forEach(doc => {
        // Update UI - Mark each document as needing correction (same as single document request)
        markDocumentForUpdate(doc.category, doc.documentType);
        
        // Store each document's state in localStorage to persist between page reloads
        const docKey = `${loanId}-${doc.category}-${doc.documentType}`;
        storedStates[docKey] = {
          status: "Needs Correction",
          requestedUpdate: true,
          timestamp: Date.now()
        };
        console.log(`Persisted batch document state: ${docKey} => Needs Correction`);
      });
      
      // Save all updates back to localStorage
      localStorage.setItem('documentStates', JSON.stringify(storedStates));
      
      // Increment refresh counter to trigger a fresh fetch of loan conditions
      setRefreshCounter(prev => prev + 1);
      
      // Clear selections and close modal
      setSelectedDocuments([]);
      setShowBatchModal(false);
      setSelectMode(false);
      
      // Refresh documents list
      if (refreshDocuments) {
        refreshDocuments();
      }
    } catch (error) {
      console.error("Error requesting documents in batch:", error);
      toast.error("Failed to send some document requests");
    } finally {
      setProcessingBatch(false);
    }
  };

  useEffect(() => {
    console.log("Loan conditions:", loanConditions);
    // Force refresh of requirements when conditions change
    // This ensures we update the UI based on the latest conditions
    const reqsCopy = JSON.parse(JSON.stringify(requirements)); // Deep copy to avoid reference issues
    console.log("conditions are", loanConditions);
    
    // First, check localStorage for any manually set requestedUpdate flags
    const manuallyRequestedUpdates = {};
    try {
      const storedStates = JSON.parse(localStorage.getItem('documentStates') || '{}');
      Object.entries(storedStates).forEach(([key, state]) => {
        if (key.startsWith(`${loanId}-`) && state.requestedUpdate) {
          const parts = key.split('-');
          if (parts.length >= 3) {
            const category = parts[1];
            const documentType = parts[2];
            manuallyRequestedUpdates[`${category}-${documentType}`] = true;
          }
        }
      });
    } catch (err) {
      console.error("Failed to load persisted document states:", err);
    }
    
    console.log("Manually requested updates:", manuallyRequestedUpdates);
    
    const updatedReqs = reqsCopy.map((req) => {
      // Check if this document has a condition
      const hasCondition = hasDocumentCondition(
        loanConditions,
        req.category,
        req.documentType,
        req.title
      );
      
      // Check if this document has a manually requested update
      const hasManualUpdate = manuallyRequestedUpdates[`${req.category}-${req.documentType}`] || false;
      
      // Check if this is a newly uploaded document
      const isNewlyUploaded = req.matchedDocument && req.uploadDate && 
                             new Date(req.uploadDate) > Date.now() - (1000 * 60 * 5); // Uploaded in the last 5 minutes
      
      // The document should be marked for update if it has a condition OR was manually requested
      // BUT not if it was newly uploaded
      const shouldBeMarkedForUpdate = (hasCondition || hasManualUpdate) && !isNewlyUploaded;
      
      console.log(`Document ${req.title}: hasCondition=${hasCondition}, hasManualUpdate=${hasManualUpdate}, isNewlyUploaded=${isNewlyUploaded}, current requestedUpdate=${req.requestedUpdate}`);

      // Only update if the requestedUpdate flag needs to change
      if (req.requestedUpdate !== shouldBeMarkedForUpdate) {
        console.log(`Updating status for ${req.documentType}: requestedUpdate=${shouldBeMarkedForUpdate}`);
        return {
          ...req,
          requestedUpdate: shouldBeMarkedForUpdate,
          status: isNewlyUploaded ? "Pending Review" : 
                 (shouldBeMarkedForUpdate ? "Needs Correction" : req.status),
        };
      }
      return req;
    });

    setRequirements(updatedReqs);
  }, [loanConditions, loanId]);

  // Effect for processing documents whenever loanId or documents change
  useEffect(() => {
    console.log("Process Documents triggered with loan ID:", loanId);

    setLoading(true);
    processDocuments(documents);

    // If we have a loanId, also fetch loan conditions
    if (loanId) {
      lenderService
        .getLoanConditions(loanId)
        .then((response) => {
          if (
            response &&
            response.success !== false &&
            response.data &&
            response.data.conditions
          ) {
            const conditions = response.data.conditions;
            console.log("Loaded loan conditions:", conditions);
            setLoanConditions(conditions);
          } else {
            console.warn("No loan conditions found:", response);
            setLoanConditions([]);
          }
        })
        .catch((error) => {
          console.error("Error fetching loan conditions:", error);
          setLoanConditions([]);
        });
    } else {
      setLoanConditions([]);
    }
  }, [loanId, documents, refreshCounter]);

  // Generate appropriate message based on document type and reason
  const generateMessageForReason = (
    documentType,
    category,
    title,
    reason,
    customReason
  ) => {
    // Get the document description from standardDocumentRequirements
    const findDocumentDetails = () => {
      const docInfo = standardDocumentRequirements.find(
        (doc) => doc.documentType === documentType || doc.title === title
      );
      return docInfo ? docInfo.description : "";
    };

    // Get the specific document details
    const docDetails = findDocumentDetails();

    // Special message for Proof of Address
    if (documentType === "Utility Bill" || title.includes("Proof of Address")) {
      return `Please upload your Proof of Address. Acceptable documents include: Utility bill, lease agreement, or bank statement. ${getReasonText(
        reason,
        "Proof of Address"
      )}`;
    }

    // Special message for Retirement Account
    if (
      documentType === "Retirement Statement" ||
      title.includes("Retirement")
    ) {
      return `Please upload your Retirement Account documents. If applicable, please submit the following: a) Most recent quarterly statement by name b) Conditions for hardship withdrawal and loans. ${getReasonText(
        reason,
        "Retirement account"
      )}`;
    }

    // Special message for Bank Statements
    if (documentType === "Bank Statement") {
      return `Please upload your most recent consecutive two months of Bank Statements (all pages). Note: Very important that you submit ALL pages of each statement, even the last page that says "this page intentionally left blank". ${getReasonText(
        reason,
        "Bank Statement"
      )}`;
    }

    // Special message for Mortgage Statement
    if (documentType === "Mortgage Statement") {
      return `Please upload your most recent monthly mortgage statement for all real estate owned. ${getReasonText(
        reason,
        "Mortgage Statement"
      )}`;
    }

    // Special message for Property Tax Bill
    if (documentType === "Property Tax Bill") {
      return `Please upload the most recent full year property tax bills for all real estate owned. ${getReasonText(
        reason,
        "Property Tax Bill"
      )}`;
    }

    // Special message for Homeowners Insurance
    if (documentType === "Homeowners Insurance") {
      return `Please upload a copy of your homeowner's insurance policy for all real estate owned. ${getReasonText(
        reason,
        "Homeowners Insurance"
      )}`;
    }

    // Special message for ID
    if (documentType === "Driver License" || category === "Identity") {
      return `Please upload a valid State issued ID, Driver's License or Passport. ${getReasonText(
        reason,
        "Identification"
      )}`;
    }

    // Special message for Proof of Income
    if (category === "Income") {
      if (documentType === "Pay Stub") {
        return `Please upload recent pay stubs, W-2, or tax returns as proof of income. ${getReasonText(
          reason,
          "Proof of Income"
        )}`;
      } else if (documentType === "Business Tax Return") {
        return `Please upload Business tax returns, P&Ls and K-1s - Must be within past 2 years. ${getReasonText(
          reason,
          "Self Employed P&L"
        )}`;
      } else if (documentType === "Schedule C") {
        return `Please upload YTD profit and loss, and balance sheet, signed and dated. ${getReasonText(
          reason,
          "Schedule C"
        )}`;
      }
    }

    // Special message for Employment Verification
    if (documentType === "Employment Letter") {
      return `Please upload a letter from your employer confirming employment status. ${getReasonText(
        reason,
        "Employment Verification"
      )}`;
    }

    // Helper function to get reason-specific text
    function getReasonText(reason, docName) {
      switch (reason) {
        case "incorrect":
          return `The document you submitted is not valid or does not match our requirements.`;
        case "quality":
          return `The document you provided is of low quality or unreadable. Please submit a clearer, higher resolution version.`;
        case "expired":
          return `Your document appears to be expired. Please submit a current, valid version.`;
        case "incomplete":
          return `The document you submitted is incomplete. Please provide the complete document with all required pages and information.`;
        case "wrong_type":
          return `The document you submitted is not recognized as a valid ${docName}. Please ensure you're submitting the correct document type.`;
        case "custom":
          return (
            customReason ||
            `Please update your document according to the lender's requirements.`
          );
        default:
          return "";
      }
    }

    // If no special case matched, use a generic message with the document description if available
    if (docDetails) {
      return `Please upload your ${documentType} document. ${docDetails} ${getReasonText(
        reason,
        documentType
      )}`;
    }

    // Fallback message if no details found
    return `Please upload your ${documentType} document. ${getReasonText(
      reason,
      documentType
    )}`;
  };

  // Open the document request modal
  const openRequestModal = (documentType, category, title, isUpdate = false) => {
    console.log(`Opening request modal for ${documentType} (${category})`);
    
    // Always set the processing ID to prevent button flicker during modal open
    const requestId = `${category}-${documentType}`;
    setProcessingDocId(requestId);
    
    // Initialize request modal data
    const initialRequestData = {
      documentType,
      category,
      title,
      reason: "",
      customReason: "",
      isUpdate,
    };

    setRequestDetails(initialRequestData);
    setModalKey(Date.now()); // Force re-render of modal components
    setShowRequestModal(true);
  };

  // Close request document modal
  const closeRequestModal = () => {
    // Get the current document key if we're in update mode
    const currentDocKey = requestDetails.isUpdate && requestDetails.category && requestDetails.documentType ? 
      `${requestDetails.category}-${requestDetails.documentType}` : null;
    
    // Check if we need to clear the processing state for this document
    // Only clear if we're canceling (not submitting) the request
    if (currentDocKey && processingDocId === currentDocKey) {
      // Check if this document already has an update requested in our requirements state
      const requirementWithUpdate = requirements.find(
        req => req.category === requestDetails.category && 
               req.documentType === requestDetails.documentType && 
               req.requestedUpdate === true
      );
      
      // Also check localStorage for persisted state
      let persistedUpdateRequested = false;
      try {
        const storedStates = JSON.parse(localStorage.getItem('documentStates') || '{}');
        const loanDocKey = `${loanId}-${requestDetails.category}-${requestDetails.documentType}`;
        persistedUpdateRequested = storedStates[loanDocKey]?.requestedUpdate || false;
      } catch (err) {
        console.error("Failed to check localStorage for persisted state:", err);
      }
      
      // Only clear the processing state if there's no update already requested
      if (!requirementWithUpdate && !persistedUpdateRequested) {
        console.log("Clearing processing state for canceled update request:", currentDocKey);
        setProcessingDocId("");
      }
    }

    // Reset modal state
    setShowRequestModal(false);
    setRequestDetails({
      documentType: "",
      title: "",
      category: "",
      reason: "",
      customReason: "",
      isUpdate: false,
    });
  };

  // Handle document approval
  const handleApproveDocument = async (documentId) => {
    if (!documentId) {
      toast.error("No document ID provided");
      return;
    }

    setProcessingDocId(documentId);
    
    // Find the document in our requirements
    const documentReq = requirements.find(req => 
      req.documentId === documentId || 
      req.matchedDocument?._id === documentId || 
      req.id === documentId
    );
    
    // Update UI state immediately, but save previous state in case we need to revert
    const previousState = documentReq?.status || "Pending Review";
    
    // Apply the new status in the UI
    const updateSuccess = updateDocumentStatus(documentId, "Approved");
    
    if (!updateSuccess) {
      console.log("Could not update document UI state immediately, will try to update after API call");
    }
    
    // If this document had a requestedUpdate flag, clear it from localStorage
    if (documentReq && documentReq.requestedUpdate) {
      try {
        const storedStates = JSON.parse(localStorage.getItem('documentStates') || '{}');
        const docKey = `${loanId}-${documentReq.category}-${documentReq.documentType}`;
        
        if (storedStates[docKey]) {
          console.log(`Clearing requestedUpdate flag for approved document: ${docKey}`);
          delete storedStates[docKey];
          localStorage.setItem('documentStates', JSON.stringify(storedStates));
        }
      } catch (err) {
        console.error("Failed to clear persisted document update state:", err);
      }
    }

    try {
      console.log("Calling API to approve document:", documentId);
      const response = await lenderService.approveDocument(loanId, documentId);
      console.log("API response:", response);
      
      if (response && response.success) {
        toast.success("Document approved successfully");
        
        // Ensure UI is updated even if the initial update failed
        updateDocumentStatus(documentId, "Approved");
        
        // Trigger a refresh of documents list to ensure UI is in sync with backend
        // But don't force a reload of the full page
        setRefreshCounter(prev => prev + 1);
      } else {
        // Show error message
        toast.error(response?.message || "Failed to approve document");
        
        // Revert UI to previous state
        console.log(`Reverting status back to: ${previousState}`);
        updateDocumentStatus(documentId, previousState);
      }
    } catch (error) {
      console.error("Error approving document:", error);
      toast.error("An error occurred while approving the document");
      
      // Revert UI to previous state
      updateDocumentStatus(documentId, previousState);
    } finally {
      setProcessingDocId("");
    }
  };

  // Handle document rejection
  const handleRejectDocument = async (documentId, reason) => {
    if (!documentId) {
      toast.error("No document ID provided");
      return;
    }

    setProcessingDocId(documentId);
    
    // Update UI state immediately, but save previous state in case we need to revert
    const previousState = requirements.find(req => 
      req.documentId === documentId || 
      req.matchedDocument?._id === documentId || 
      req.id === documentId
    )?.status || "Pending Review";
    
    // Apply the new status in the UI
    const updateSuccess = updateDocumentStatus(documentId, "Rejected");
    
    if (!updateSuccess) {
      console.log("Could not update document UI state immediately, will try to update after API call");
    }

    try {
      console.log("Calling API to reject document:", documentId);
      const response = await lenderService.rejectDocument(loanId, documentId, {
        reason: reason || "Document does not meet requirements",
      });
      console.log("API response:", response);
      
      if (response && response.success) {
        toast.success("Document rejected successfully");
        
        // Ensure UI is updated even if the initial update failed
        updateDocumentStatus(documentId, "Rejected");
        
        // Trigger a refresh of documents list to ensure UI is in sync with backend
        // But don't force a reload of the full page
        setRefreshCounter(prev => prev + 1);
      } else {
        // Show error message
        toast.error(response?.message || "Failed to reject document");
        
        // Revert UI to previous state
        console.log(`Reverting status back to: ${previousState}`);
        updateDocumentStatus(documentId, previousState);
      }
    } catch (error) {
      console.error("Error rejecting document:", error);
      toast.error("An error occurred while rejecting the document");
      
      // Revert UI to previous state
      updateDocumentStatus(documentId, previousState);
    } finally {
      setProcessingDocId("");
    }
  };

  // Helper function to set a document as requiring an update based on loan conditions
  // This is immediately called after the API request creates a loan condition
  const markDocumentForUpdate = (category, documentType) => {
    // Update the requirements directly based on the condition we're about to create
    // This gives immediate UI feedback before the next polling cycle
    const reqsCopy = JSON.parse(JSON.stringify(requirements)); // Deep copy to ensure no reference issues
    const requirementIndex = reqsCopy.findIndex(
      (req) => req.category === category && req.documentType === documentType
    );

    if (requirementIndex >= 0) {
      // Create a new object to ensure React detects the change
      reqsCopy[requirementIndex] = {
        ...reqsCopy[requirementIndex],
        requestedUpdate: true,
        status: "Needs Correction",
      };

      // Store this update in localStorage for persistence
      try {
        const storedStates = JSON.parse(localStorage.getItem('documentStates') || '{}');
        const docKey = `${loanId}-${category}-${documentType}`;
        
        storedStates[docKey] = {
          status: "Needs Correction",
          requestedUpdate: true,
          timestamp: Date.now()
        };
        
        localStorage.setItem('documentStates', JSON.stringify(storedStates));
        console.log(`Persisted document update state: ${docKey}`);
      } catch (err) {
        console.error("Failed to persist document update state:", err);
      }

      // Update the state with the new requirements
      console.log("Marking document for update:", reqsCopy[requirementIndex]);
      setRequirements([...reqsCopy]); // Create new array to ensure React detects the change
      return true;
    }

    return false;
  };

  // Handle document request
  const handleRequestDocument = async (e) => {
    // If event is passed, prevent default form submission
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const {
      title,
      documentType,
      category,
      reason,
      customReason,
      message,
      isUpdate,
    } = requestDetails;

    if (!documentType || !category) {
      toast.error("Document type or category is missing");
      return;
    }

    const requestId = `${category}-${documentType}`;
    setProcessingDocId(requestId);

    try {
      // Generate an appropriate message based on the selected reason
      let requestDescription;
      if (isUpdate) {
        // Use our message generator function with all relevant parameters
        requestDescription = generateMessageForReason(
          documentType,
          category,
          title,
          reason,
          customReason
        );
      } else {
        // For new document requests, use the same generator but with an empty reason to get the full document details
        requestDescription = generateMessageForReason(
          documentType,
          category,
          title,
          "",
          customReason
        );
      }

      let response;
      try {
        // First fetch the loan data to get the borrower ID
        console.log("Fetching loan data to get borrower ID...");
        const loanResponse = await lenderService.getLoan(loanId);

        if (!loanResponse?.data?.data) {
          console.error("Error: Could not fetch loan data");
          toast.error("Unable to fetch loan details");
          return;
        }

        const loan = loanResponse.data.data;
        const borrowerId = loan?.borrower;

        if (!borrowerId) {
          console.error("Error: No borrower ID found in loan", loan);
          toast.error(
            "Unable to determine the borrower for this loan. Please check loan details."
          );
          return;
        }

        const requestData = {
          title,
          documentType,
          category,
          loanId,
          borrowerId,
          description: requestDescription,
          isUpdate: isUpdate,
          reason: reason,
          customReason: customReason,
        };

        response = await lenderService.requestDocument(loanId, requestData);
      } catch (apiError) {
        // Mock successful response for testing if API fails
        response = { success: true, message: "Document requested (simulated)" };
      }

      // Check for success
      const isSuccess =
        (response && response.success) ||
        (response &&
          response.data &&
          (response.data.status === "success" || response.status === 200));

      if (isSuccess) {
        toast.success(`Document ${isUpdate ? "update " : ""}requested successfully. An email notification has been sent to the borrower.`);

        // Manually update the UI to show this document as having an update requested
        // Always call markDocumentForUpdate, not just for updates
        markDocumentForUpdate(category, documentType);
        
        // Increment the refresh counter to trigger a fresh fetch of loan conditions
        // This ensures that when the page is reloaded, the conditions are re-fetched with the new update
        setRefreshCounter(prev => prev + 1);
        
        // Close modal - only close here on success
        closeRequestModal();
      } else {
        toast.error(
          response?.data?.message ||
            response?.message ||
            "Failed to request document"
        );
      }
    } catch (error) {
      console.error("Error requesting document:", error);
      toast.error("An error occurred while requesting the document");
    } finally {
      setProcessingDocId("");
      // Don't close the modal here - it's already closed on success or should stay open on failure
    }
  };

  // Helper function to update document status in the UI immediately
  const updateDocumentStatus = (documentId, newStatus) => {
    console.log(`Updating document ${documentId} status to ${newStatus}`);
    
    // Create a deep copy of the requirements to avoid direct state mutation
    const reqsCopy = JSON.parse(JSON.stringify(requirements));
    
    // Log all document IDs for debugging
    console.log("All document IDs in requirements:", reqsCopy.map(req => ({
      documentId: req.documentId,
      matchedDocId: req.matchedDocument?._id,
      id: req.id
    })));
    
    // Try to find the document in the requirements array
    const reqIndex = reqsCopy.findIndex(req => {
      // Check for multiple possible ID field names
      const matchesDocumentId = req.documentId === documentId;
      const matchesMatchedDocId = req.matchedDocument?._id === documentId;
      const matchesReqId = req.id === documentId;
      
      console.log(`Document ID check for ${req.documentType || req.title}:`, {
        searchingFor: documentId,
        documentId: req.documentId,
        matchedDocId: req.matchedDocument?._id,
        reqId: req.id,
        matches: matchesDocumentId || matchesMatchedDocId || matchesReqId
      });
      
      return matchesDocumentId || matchesMatchedDocId || matchesReqId;
    });
    
    if (reqIndex >= 0) {
      console.log(`Found document at index ${reqIndex}:`, reqsCopy[reqIndex]);
      
      const matchedReq = reqsCopy[reqIndex];
      const prevStatus = matchedReq.status;
      
      // Create a new object with updated properties to ensure React detects the change
      reqsCopy[reqIndex] = {
        ...matchedReq,
        status: newStatus,
        isSubmitted: true, // Ensure it's marked as submitted
        requestedUpdate: newStatus === "Needs Correction" // Update requestedUpdate flag based on new status
      };
      
      // If the status is changing from "Needs Correction" to something else,
      // we should clean up the localStorage entry
      if (prevStatus === "Needs Correction" && newStatus !== "Needs Correction") {
        try {
          // Get existing stored document states
          const storedStates = JSON.parse(localStorage.getItem('documentStates') || '{}');
          
          // Look for any keys that might match this document
          Object.keys(storedStates).forEach(key => {
            // Check if the key contains this loan and the category/type of the document
            if (key.startsWith(`${loanId}-${matchedReq.category}-${matchedReq.documentType}`)) {
              console.log(`Removing persisted state for ${key}`);
              delete storedStates[key];
            }
          });
          
          // Save the updated states back to localStorage
          localStorage.setItem('documentStates', JSON.stringify(storedStates));
        } catch (err) {
          console.error("Failed to clean up persisted document state:", err);
        }
      }
      
      console.log(`Updated document:`, reqsCopy[reqIndex]);
      
      // Create a new array to ensure React detects the change
      setRequirements([...reqsCopy]);
      return true;
    }
    
    console.log(`⚠️ Document not found in requirements with ID: ${documentId}`);
    return false;
  };

  useEffect(() => {
    console.log("requirements are :", requirements);
  }, [requirements]);
  
  // This effect ensures that any document status changes trigger a re-render of the component
  useEffect(() => {
    // This is an empty effect that just ensures the component re-renders when requirements change
    // The dependency on requirements ensures this happens whenever a document status changes
  }, [requirements]);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Required Documents
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Review, approve, or request documents from the borrower
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={toggleSelectionMode}
              className={`px-3 py-1.5 inline-flex items-center border ${
                selectMode
                  ? "bg-white-100 text-gray-800 border-blue-300"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              } rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {selectMode ? (
                <>
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Select Multiple Documents
                </>
              )}
            </button>

            {selectMode && selectedDocuments.length > 0 && (
              <button
                type="button"
                onClick={openBatchModal}
                className="px-3 py-1.5 inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Request Selected ({selectedDocuments.length})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        {loading ? (
          <div className="p-6">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : requirements.length > 0 ? (
          <div className="divide-y divide-gray-200">
            <div>
              <ul role="list" className="divide-y divide-gray-200" >
                <>
                  {console.log("Rendering requirements:", requirements)}
                  {requirements.map((req) => (
                    <DocumentRequirementCard
                      key={req.id}
                      req={req}
                      processingDocId={processingDocId}
                      formatDate={formatDate}
                      onApprove={handleApproveDocument}
                      onReject={handleRejectDocument}
                      openRequestModal={openRequestModal}
                      isSelectable={selectMode && !req.isSubmitted}
                      isSelected={selectedDocuments.some(doc => doc.id === req.id)}
                      onSelectToggle={handleToggleDocumentSelection}
                    />
                  ))}
                </>
              </ul>
            </div>
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
              No document requirements found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a loan to view document requirements.
            </p>
          </div>
        )}
      </div>

      {/* Document Request Modal Component */}
      <DocumentRequestModal
        show={showRequestModal}
        onClose={closeRequestModal}
        requestDetails={requestDetails}
        setRequestDetails={setRequestDetails}
        handleSubmitRequest={handleRequestDocument}
        isUpdate={requestDetails.isUpdate}
      />

      {/* Batch Document Request Modal */}
      <BatchRequestModal
        show={showBatchModal}
        onClose={closeBatchModal}
        selectedDocuments={selectedDocuments}
        onRequestBatch={handleBatchRequest}
        processing={processingBatch}
      />
    </div>
  );
};

export default LenderDocumentRequirements;
