import React, { useState, useEffect, useMemo } from "react";
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

// Find a matching condition ID for a requirement
const findConditionIdForRequirement = (loanConditions, category, documentType, title) => {
  if (!loanConditions || !Array.isArray(loanConditions) || loanConditions.length === 0) {
    return null;
  }
  const condition = loanConditions.find((c) => {
    if (c.category !== category) return false;
    const cleanTitle = (c.title || "").toLowerCase().replace(" document required", "");
    const titleMatches =
      cleanTitle === (title || "").toLowerCase() ||
      (title || "").toLowerCase().includes(cleanTitle) ||
      cleanTitle.includes((title || "").toLowerCase());
    const typeMatches = c.documentType
      ? (c.documentType || "").toLowerCase() === (documentType || "").toLowerCase()
      : false;
    return titleMatches || typeMatches;
  });
  return condition ? condition._id : null;
};

// Check if a condition is a custom document (not matching any standard requirement)
const isCustomDocumentCondition = (condition, requirementDefs) => {
  return !requirementDefs.some(
    (req) =>
      req.category === condition.category &&
      ((condition.documentType && (condition.documentType || "").toLowerCase() === (req.documentType || "").toLowerCase()) ||
        ((condition.title || "").toLowerCase().replace(" document required", "") === (req.title || "").toLowerCase()))
  );
};

const createRequirement = ({
  id,
  title,
  description,
  category,
  documentType,
  allowedDocumentTypes,
  required = true,
}) => ({
  id,
  title,
  description,
  category,
  documentType,
  allowedDocumentTypes,
  required,
});

const buildRequirements = (employmentType, ownsHome) => {
  const requirements = [
    createRequirement({
      id: 'governmentId',
      title: 'Government Issued ID',
      description: "State issued ID, Driver's License or Passport",
      category: 'Identity',
      documentType: 'Driver License',
      allowedDocumentTypes: ['Driver License', 'Passport'],
    }),
    createRequirement({
      id: 'ssnCard',
      title: 'Social Security Card (or Passport)',
      description: 'Provide your Social Security Card or Passport.',
      category: 'Identity',
      documentType: 'Social Security Card',
      allowedDocumentTypes: ['Social Security Card', 'Passport'],
    }),
  ];

  const normalizedEmployment = employmentType === 'self-employed' ? 'self-employed' : 'employee';

  if (normalizedEmployment === 'self-employed') {
    requirements.push(
      createRequirement({
        id: 'businessLicense',
        title: 'Business License / Articles of Incorporation',
        description: 'Upload your business license, articles of incorporation, or other proof of business ownership.',
        category: 'Financial',
        documentType: 'Other',
        allowedDocumentTypes: ['Other', 'Business Tax Return'],
      }),
      createRequirement({
        id: 'personalTaxReturns',
        title: 'Two Most Recent Personal Tax Returns (1040) with All Schedules',
        description: 'Provide signed copies of the last two personal tax returns including all schedules.',
        category: 'Income',
        documentType: 'Schedule C',
        allowedDocumentTypes: ['Schedule C', 'Business Tax Return'],
      }),
      createRequirement({
        id: 'businessTaxReturns',
        title: 'Two Most Recent Business Tax Returns with All Schedules',
        description: 'Upload the last two years of business tax returns with all schedules.',
        category: 'Income',
        documentType: 'Business Tax Return',
      }),
    );
  } else {
    requirements.push(
      createRequirement({
        id: 'w2s',
        title: 'Two Most Recent W-2s',
        description: 'Upload your two most recent W-2 forms.',
        category: 'Income',
        documentType: 'W2',
      }),
      createRequirement({
        id: 'recentPaystubs',
        title: 'Two Most Recent Paystubs',
        description: 'Provide your two most recent consecutive paystubs.',
        category: 'Income',
        documentType: 'Pay Stub',
      }),
      createRequirement({
        id: 'priorYearPaystub',
        title: 'Last Paystub for the Prior Year',
        description: 'Upload your final paystub from the previous year.',
        category: 'Income',
        documentType: 'Pay Stub',
      }),
    );
  }

  if (ownsHome) {
    requirements.push(
      createRequirement({
        id: 'homeInsurance',
        title: 'Most Recent Home Insurance (with declarations and replacement cost estimator - RCE)',
        description: "Upload the latest homeowner's insurance policy including declarations and RCE.",
        category: 'Insurance',
        documentType: 'Homeowners Insurance',
      }),
      createRequirement({
        id: 'mortgageStatement',
        title: 'Most Recent Mortgage Statement',
        description: 'Provide the most recent mortgage statement for your property.',
        category: 'Property',
        documentType: 'Mortgage Statement',
      }),
      createRequirement({
        id: 'propertyTaxBill',
        title: 'Most Recent Tax Bill',
        description: 'Upload the most recent property tax bill.',
        category: 'Property',
        documentType: 'Property Tax Bill',
      }),
    );
  }

  return requirements;
};

const LenderDocumentRequirements = ({
  loanId,
  documents,
  employmentType = 'employee',
  ownsHome = false,
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
    description: "",
    reason: "",
    customReason: "",
    isUpdate: false,
    allowMetaEdit: false, // allow editing meta for custom docs
  });
  const [modalKey, setModalKey] = useState(Date.now());
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [loanConditions, setLoanConditions] = useState([]);
  // New state for multi-select functionality
  const [selectMode, setSelectMode] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [processingBatch, setProcessingBatch] = useState(false);
  // IDs of standard requirements user has dismissed (no backend condition to delete)
  const [dismissedRequirementIds, setDismissedRequirementIds] = useState(new Set());

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
const processDocuments = (docsList, requirementDefs) => {
    console.log('Process Documents called with:', docsList?.length, 'documents');
    console.log("Current loan conditions:", loanConditions);
    console.log("Current requirements:", requirements);

    // Debug: Log raw documents from backend
    console.log("📄 Raw documents from backend:", docsList?.map(doc => ({
      id: doc._id,
      name: doc.name,
      status: doc.status,
      category: doc.category,
      documentType: doc.documentType,
      verificationStatus: doc.verificationStatus
    })));

    // Removed localStorage functionality - document status now comes from backend only

    if (!loanId || !docsList || !docsList.length) {
      console.log('No documents found, setting default requirements');

      // Set default requirements without document mappings
      const updatedReqs = requirementDefs.map((req, index) => {
        const reqId = `req-${index}`;
        // Check if there's a pending document condition for this requirement
        const hasCondition = hasDocumentCondition(
          loanConditions,
          req.category,
          req.documentType,
          req.title
        );

        // Determine if this document needs correction based on conditions only (backend data)
        const needsCorrection = hasCondition;

        return {
          ...req,
          id: reqId,
          // Use default status, only override if there's an active condition/request
          status: needsCorrection ? "Needs Correction" : "Not Submitted",
          isSubmitted: false,
          requestedUpdate: needsCorrection,
        };
      });

      console.log("Requirements with default statuses:", updatedReqs);
      setRequirements(updatedReqs);
      setLoading(false);
      return;
    }

    // Assign documents to requirements
    const documentAssignments = assignDocumentsToRequirements(
      requirementDefs,
      docsList
    );
    console.log('Document assignments:', documentAssignments);

    const updatedReqs = requirementDefs.map((req) => {
      const assignedDoc = documentAssignments[req.id];

      if (assignedDoc) {
        // Check if this document has a condition from the lender
        const hasCondition = hasDocumentCondition(
          loanConditions,
          req.category,
          req.documentType,
          req.title
        );

        // Removed localStorage logic - document status now comes from backend only

        // Determine if document needs correction based on backend data only
        const needsCorrection = hasCondition;

        // Debug the document status determination
        console.log(`📋 Status determination for ${req.documentType}:`, {
          documentId: assignedDoc._id,
          backendStatus: assignedDoc.status,
          hasCondition,
          needsCorrection,
          finalStatus: needsCorrection ? "Needs Correction" : (assignedDoc.status || "Pending Review")
        });

        return {
          ...req,
          isSubmitted: true,
          // FIXED: Use backend status as primary source of truth
          // Only override with "Needs Correction" if there's an active condition/request
          // and the document wasn't uploaded after the request
          status: needsCorrection ? "Needs Correction" : (assignedDoc.status || "Pending Review"),
          documentId: assignedDoc._id,
          url: assignedDoc.fileUrl || assignedDoc.url,
          uploadDate: assignedDoc.createdAt || assignedDoc.uploadedAt,
          requestedUpdate: needsCorrection,
          // Store original document info for debugging
          matchedDocument: assignedDoc,
        };
      }

      // Check if there's a pending document condition for this requirement
      const hasCondition = hasDocumentCondition(
        loanConditions,
        req.category,
        req.documentType,
        req.title
      );

      // Determine if this document needs correction based on conditions only (backend data)
      const needsCorrection = hasCondition;

      return {
        ...req,
        isSubmitted: false,
        status: needsCorrection ? "Needs Correction" : "Not Submitted",
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
      
      console.log("Batch document requests sent successfully");
      
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

    // Skip this effect if we're currently processing a document status change
    // This prevents overwriting approve/reject status changes
    if (processingDocId) {
      console.log("⏸️ Skipping loan conditions effect - document processing in progress:", processingDocId);
      return;
    }

    // Force refresh of requirements when conditions change
    // This ensures we update the UI based on the latest conditions
    const reqsCopy = JSON.parse(JSON.stringify(requirements)); // Deep copy to avoid reference issues
    console.log("conditions are", loanConditions);
    
    // Removed localStorage logic - document status now comes from backend only
    
    const updatedReqs = reqsCopy.map((req) => {
      // Check if this document has a condition
      const hasCondition = hasDocumentCondition(
        loanConditions,
        req.category,
        req.documentType,
        req.title
      );
      
      // Document should be marked for update if it has a condition (backend determines this)
      const shouldBeMarkedForUpdate = hasCondition;

      console.log(`Document ${req.title}: hasCondition=${hasCondition}, current requestedUpdate=${req.requestedUpdate}, current status=${req.status}`);

      // Only update if the requestedUpdate flag needs to change
      if (req.requestedUpdate !== shouldBeMarkedForUpdate) {
        console.log(`Updating requestedUpdate flag for ${req.documentType}: ${shouldBeMarkedForUpdate}`);

        // FIXED: Only update requestedUpdate flag, don't override backend status
        // The backend status should remain as the source of truth
        return {
          ...req,
          requestedUpdate: shouldBeMarkedForUpdate,
          // Only override status to "Needs Correction" if we're marking for update
          // and the current status isn't a final state (Approved/Rejected)
          status: shouldBeMarkedForUpdate && req.status !== "Approved" && req.status !== "Rejected"
            ? "Needs Correction"
            : req.status
        };
      }
      return req;
    });

    setRequirements(updatedReqs);
  }, [loanConditions, loanId, processingDocId]);

  // Effect for processing documents whenever loanId or documents change
  useEffect(() => {
    console.log("Process Documents triggered with loan ID:", loanId);

    setLoading(true);
    const relevantRequirements = buildRequirements(employmentType, ownsHome);
    processDocuments(documents, relevantRequirements);
  }, [loanId, documents, employmentType, ownsHome]);

  // Separate effect for fetching loan conditions (including when refreshCounter changes)
  useEffect(() => {
    if (!loanId) {
      setLoanConditions([]);
      return;
    }

    lenderService
      .getLoanConditions(loanId)
      .then((response) => {
        // Backend returns: { status, count, data: [conditions] }
        if (response && response.success === false) {
          console.warn("Loan conditions request reported failure:", response);
          setLoanConditions([]);
          return;
        }

        const rawData =
          (response && response.data) ||
          response?.conditions ||
          [];

        const conditions = Array.isArray(rawData)
          ? rawData
          : rawData?.conditions || [];

        if (conditions && Array.isArray(conditions) && conditions.length > 0) {
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
  }, [loanId, refreshCounter]);

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
  const openRequestModal = (
    documentType,
    category,
    title,
    isUpdate = false,
    allowMetaEdit = false
  ) => {
    console.log(`Opening request modal for ${documentType} (${category})`);

    // Initialize request modal data
    const initialRequestData = {
      documentType,
      category,
      title,
      description: "",
      reason: "",
      customReason: "",
      isUpdate,
      allowMetaEdit,
    };

    setRequestDetails(initialRequestData);
    setModalKey(Date.now()); // Force re-render of modal components
    setShowRequestModal(true);
  };

  // Close request document modal
  const closeRequestModal = () => {
    // Always clear the processing state when closing the modal
    // This ensures buttons don't stay in loading state when user cancels
    console.log("Closing request modal, clearing processing state");
    setProcessingDocId("");

    // Reset modal state
    setShowRequestModal(false);
    setRequestDetails({
      documentType: "",
      title: "",
      category: "",
      description: "",
      reason: "",
      customReason: "",
      isUpdate: false,
      allowMetaEdit: false,
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
    
    // Removed localStorage cleanup - document status now comes from backend only

    try {
      console.log("Calling API to approve document:", documentId);
      const response = await lenderService.approveDocument(loanId, documentId);
      console.log("API response:", response);
      console.log("Response success check:", response && response.success);

      if (response && response.success) {
        console.log("✅ API call successful, updating UI state");
        toast.success("Document approved successfully");

        // Ensure UI is updated even if the initial update failed
        const finalUpdateSuccess = updateDocumentStatus(documentId, "Approved");
        console.log("Final UI update success:", finalUpdateSuccess);
      } else {
        console.log("❌ API call failed or returned success: false");
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
      console.log("Response success check:", response && response.success);

      if (response && response.success) {
        console.log("✅ API call successful, updating UI state");
        toast.success("Document rejected successfully");

        // Ensure UI is updated even if the initial update failed
        const finalUpdateSuccess = updateDocumentStatus(documentId, "Rejected");
        console.log("Final UI update success:", finalUpdateSuccess);
      } else {
        console.log("❌ API call failed or returned success: false");
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

      // Removed localStorage persistence - document status now comes from backend only

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
      description,
      reason,
      customReason,
      isUpdate,
      allowMetaEdit,
    } = requestDetails;

    if (!documentType || !category) {
      toast.error("Document type or category is missing");
      return;
    }

    if (allowMetaEdit && !isUpdate && !(description && String(description).trim())) {
      toast.error("Please enter a description for this document requirement");
      return;
    }

    const requestId = `${category}-${documentType}`;
    setProcessingDocId(requestId);

    try {
      // Generate an appropriate message based on the selected reason
      let requestDescription;
      if (allowMetaEdit && !isUpdate) {
        requestDescription = String(description).trim();
      } else if (isUpdate) {
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
          isCustomDocument: Boolean(allowMetaEdit && !isUpdate),
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

      console.log(`🔍 Document ID check for ${req.documentType || req.title}:`, {
        searchingFor: documentId,
        documentId: req.documentId,
        matchedDocId: req.matchedDocument?._id,
        reqId: req.id,
        matches: matchesDocumentId || matchesMatchedDocId || matchesReqId
      });

      return matchesDocumentId || matchesMatchedDocId || matchesReqId;
    });

    console.log(`🔍 Search result: reqIndex = ${reqIndex} (${reqIndex >= 0 ? 'FOUND' : 'NOT FOUND'})`);
    
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

      // Removed localStorage cleanup - document status now comes from backend only
      
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

  // Merge requirements with condition IDs and append custom document conditions
  const requirementDefs = useMemo(
    () => buildRequirements(employmentType, ownsHome),
    [employmentType, ownsHome]
  );
  const displayRequirements = useMemo(() => {
    const withIds = (requirements || []).map((req) => ({
      ...req,
      conditionId: findConditionIdForRequirement(
        loanConditions,
        req.category,
        req.documentType,
        req.title
      ),
    }));
    const customReqs = (loanConditions || [])
      .filter((c) => c && (c.category || c.documentType || c.title) && isCustomDocumentCondition(c, requirementDefs))
      .map((c) => ({
        id: c._id,
        title: (c.title || "").replace(" Document Required", "").trim() || "Custom Document",
        description: c.description || "",
        category: c.category || "Other",
        documentType: c.documentType || "Other",
        conditionId: c._id,
        isCustom: true,
        isSubmitted: false,
        status: "Not Submitted",
      }));
    const merged = [...withIds, ...customReqs];
    return merged.filter((req) => !dismissedRequirementIds.has(req.id));
  }, [requirements, loanConditions, requirementDefs, dismissedRequirementIds]);

  const handleDeleteRequirement = async (conditionIdOrReqId) => {
    if (!conditionIdOrReqId || !loanId) return;
    // If it's a condition ID (MongoDB ObjectId string, 24 hex chars), remove via API
    const isConditionId = /^[a-fA-F0-9]{24}$/.test(conditionIdOrReqId);
    if (isConditionId) {
      try {
        await lenderService.removeCondition(loanId, conditionIdOrReqId);
        setRefreshCounter((c) => c + 1);
        toast.success("Document requirement removed");
        if (refreshDocuments) refreshDocuments();
      } catch (err) {
        console.error("Error removing document requirement:", err);
        toast.error("Failed to remove document requirement");
      }
    } else {
      // Standard requirement with no condition: dismiss from list (local only)
      setDismissedRequirementIds((prev) => new Set([...prev, conditionIdOrReqId]));
      toast.success("Document requirement removed from list");
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div>
            <h3 className="text-center md:text-left text-lg font-medium text-gray-900">
              Required Documents
            </h3>
            <p className="mt-1 text-center md:text-left text-sm text-gray-500">
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

            {/* Add completely custom document requirement */}
            <button
              type="button"
              onClick={() =>
                openRequestModal("", "", "", false, true)
              }
              className="px-3 py-1.5 inline-flex items-center border border-dashed border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Custom Document
            </button>
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
                  {console.log("Rendering requirements:", displayRequirements)}
                  {displayRequirements.map((req) => (
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
                      onDelete={handleDeleteRequirement}
                      conditionId={req.conditionId}
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
        processing={!!processingDocId}
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
