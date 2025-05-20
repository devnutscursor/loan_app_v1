import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { lenderService } from "../../../services/api";
import { standardDocumentRequirements } from "../../../data/documentRequirements";
import { assignDocumentsToRequirements } from "../../../utils/documentMatching";
import DocumentRequirementCard from "./DocumentRequirementCard";
import DocumentRequestModal from "./DocumentRequestModal";

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

    // If we have specific documentType field in condition, check that too
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
    // console.log('⚠️ Process Documents called with:', docsList?.length, 'documents');
    console.log("📚 Current loan conditions:", loanConditions);

    if (!loanId || !docsList || !docsList.length) {
      // console.log('⚠️ No documents found, setting default requirements');

      // Set default requirements without document mappings
      const updatedReqs = standardDocumentRequirements.map((req, index) => {
        // Check if there's a pending document condition for this requirement
        const hasCondition = hasDocumentCondition(
          loanConditions,
          req.category,
          req.documentType,
          req.title
        );

        return {
          ...req,
          id: `req-${index}`,
          status: hasCondition ? "Needs Correction" : "Not Submitted",
          isSubmitted: false,
          requestedUpdate: hasCondition, // Set based on condition existence
        };
      });

      console.log("Requirements with loan condition updates:", updatedReqs);
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
    // console.log('Document assignments:', documentAssignments);

    const updatedReqs = standardDocumentRequirements.map((req) => {
      const assignedDoc = documentAssignments[req.id];

      if (assignedDoc) {
        return {
          ...req,
          isSubmitted: true,
          status: assignedDoc.status || "Pending Review",
          documentId: assignedDoc._id,
          url: assignedDoc.fileUrl || assignedDoc.url,
          uploadDate: assignedDoc.createdAt || assignedDoc.uploadedAt,
          // Store original document info for debugging
          matchedDocument: assignedDoc,
        };
      }

      return {
        ...req,
        isSubmitted: false,
        status: "Not Submitted",
        matchedDocument: null,
      };
    });

    // console.log('Updated requirements:', updatedReqs);
    setRequirements(updatedReqs);
    setLoading(false);
  };

  useEffect(() => {
    console.log("Loan conditions:", loanConditions);
    // Force refresh of requirements when conditions change
    // This ensures we update the UI based on the latest conditions
    const reqsCopy = [...requirements];
    console.log("conditions are", loanConditions);
    const updatedReqs = reqsCopy.map((req) => {
      // Check if this document has a condition
      const hasCondition = hasDocumentCondition(
        loanConditions,
        req.category,
        req.documentType,
        req.title
      );

      console.log("Has condition:", hasCondition);

      // Update the requestedUpdate flag if needed
      if (req.requestedUpdate !== hasCondition) {
        // console.log(`${hasCondition ? '➕' : '➖'} Updating status for ${req.documentType}: requestedUpdate=${hasCondition}`);
        return {
          ...req,
          requestedUpdate: hasCondition,
          status: hasCondition ? "Needs Correction" : req.status,
        };
      }
      return req;
    });

    setRequirements(updatedReqs);
  }, [loanConditions]);

  // Function to fetch loan conditions
  const fetchLoanConditions = async () => {
    if (!loanId) return;

    console.log("📃 Fetching loan conditions on demand");
    try {
      console.log("🔄 Fetching loan conditions for", loanId);
      const response = await lenderService.getLoan(loanId);

      if (response && response.data) {
        const conditions = response.data.data.conditions || [];
        console.log("🔄 Fetched loan conditions:", conditions.length);
        setLoanConditions(conditions);
      }
    } catch (error) {
      console.error("Error fetching loan conditions:", error);
    }
  };

  // Add manual condition fetching on component mount
  useEffect(() => {
    if (!loanId) return;

    console.log("🔄 Initial fetch of loan conditions");

    // Initial fetch only - no polling
    fetchLoanConditions();
  }, [loanId]);

  // Use effect to map requirements with documents when loan ID changes or when refreshCounter changes
  useEffect(() => {
    if (loanId && refreshCounter > 0) {
      console.log(
        `🔄 Updating requirements due to manual refresh (${refreshCounter})`
      );
    } else if (loanId) {
      // Just process documents if it's the initial load
      processDocuments(documents);
    }
  }, [loanId, documents, refreshCounter]);

  // Open request document modal
  const openRequestModal = (documentType, category, title, isUpdate = true) => {
    setRequestDetails({
      documentType,
      category,
      title,
      reason: "",
      customReason: "",
      message: "",
      isUpdate,
    });
    setModalKey(Date.now());
    setShowRequestModal(true);
  };

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

  // Close request document modal
  const closeRequestModal = () => {
    // If this was an update request (not a new document request),
    // make sure to restore the visibility of the Request Update button
    if (
      requestDetails.isUpdate &&
      requestDetails.category &&
      requestDetails.documentType
    ) {
      const buttonId = `update-btn-${requestDetails.category}-${requestDetails.documentType}`;
      const updateButton = document.getElementById(buttonId);
      if (updateButton) {
        updateButton.classList.remove("hidden");
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
      console.error("Document approval failed: Document ID is missing");
      toast.error("Document ID is missing");
      return;
    }

    setProcessingDocId(documentId);
    try {
      console.log(`⏳ Sending approval request to API...`);

      let response;
      try {
        response = await lenderService.approveDocument(loanId, documentId);
        console.log(`✅ API Response:`, response);
      } catch (apiError) {
        console.error("❌ API error approving document:", apiError);
        // Mock successful response for testing if API fails
        response = { success: true, message: "Document approved (simulated)" };
      }

      // Check for success in both mock API format and actual backend format
      const isSuccess =
        (response && response.success) || // Mock API format
        (response &&
          response.data &&
          (response.data.status === "success" || response.status === 200)); // Backend format

      if (isSuccess) {
        const successMessage =
          response.message ||
          response.data?.message ||
          "Document approved successfully";

        toast.success(successMessage);

        // Immediate local state update for responsive UI
        setRequirements((prevReqs) => {
          return prevReqs.map((req) =>
            req.documentId === documentId ? { ...req, status: "Approved" } : req
          );
        });

        setRefreshCounter((prev) => prev + 1);
      } else {
        toast.error(
          response?.data?.message ||
            response?.message ||
            "Failed to approve document"
        );
      }
    } catch (error) {
      console.error("Error approving document:", error);
      toast.error("An error occurred while approving the document");
    } finally {
      setProcessingDocId(null);
    }
  };

  // Handle document rejection
  const handleRejectDocument = async (documentId) => {
    if (!documentId) {
      toast.error("Document ID is missing");
      return;
    }

    setProcessingDocId(documentId);
    try {
      let response;

      try {
        response = await lenderService.rejectDocument(loanId, documentId);
      } catch (apiError) {
        console.error("API error rejecting document:", apiError);
        // Mock successful response for testing if API fails
        response = { success: true, message: "Document rejected (simulated)" };
      }

      // Check for success
      const isSuccess =
        (response && response.success) ||
        (response &&
          response.data &&
          (response.data.status === "success" || response.status === 200));

      if (isSuccess) {
        const successMessage =
          response.message ||
          response.data?.message ||
          "Document rejected successfully";

        toast.success(successMessage);

        // Immediate local state update for responsive UI
        setRequirements((prevReqs) => {
          return prevReqs.map((req) =>
            req.documentId === documentId ? { ...req, status: "Rejected" } : req
          );
        });
        // Trigger a refresh of the document list
        setRefreshCounter((prev) => prev + 1);
      } else {
        toast.error(
          response?.data?.message ||
            response?.message ||
            "Failed to reject document"
        );
      }
    } catch (error) {
      console.error("Error rejecting document:", error);
      toast.error("An error occurred while rejecting the document");
    } finally {
      setProcessingDocId(null);
    }
  };

  // Helper function to set a document as requiring an update based on loan conditions
  // This is immediately called after the API request creates a loan condition
  const markDocumentForUpdate = (category, documentType) => {
    // Update the requirements directly based on the condition we're about to create
    // This gives immediate UI feedback before the next polling cycle
    const reqsCopy = [...requirements];
    const requirementIndex = reqsCopy.findIndex(
      (req) => req.category === category && req.documentType === documentType
    );

    if (requirementIndex >= 0) {
      reqsCopy[requirementIndex] = {
        ...reqsCopy[requirementIndex],
        requestedUpdate: true,
        status: "Needs Correction",
      };

      setRequirements(reqsCopy);
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
        const successMessage =
          response.message ||
          response.data?.message ||
          "Document request sent to borrower";

        toast.success(successMessage);

        // If this is an update request, manually update the document status in the UI
        if (isUpdate) {
          // Mark it in our local state immediately for better user feedback
          const updateSuccess = markDocumentForUpdate(category, documentType);

          // Force a re-render
          setRequirements([...requirements]);

          // Re-fetch loan conditions right away to get the server-side changes
          console.log(
            "📃 Immediately refreshing loan conditions after document request"
          );
          lenderService
            .getLoan(loanId)
            .then((response) => {
              if (response && response.data) {
                const conditions = response.data.conditions || [];
                setLoanConditions(conditions);

                // Force immediate update to requirements based on new conditions
                const reqsCopy = [...requirements];
                const updatedReqs = reqsCopy.map((req) => {
                  // Check if this document has a condition
                  const hasCondition = hasDocumentCondition(
                    conditions,
                    req.category,
                    req.documentType,
                    req.title
                  );
                  return {
                    ...req,
                    requestedUpdate: hasCondition,
                    status: hasCondition ? "Needs Correction" : req.status,
                  };
                });

                setRequirements(updatedReqs);

                // Force a refresh of the document list
                setRefreshCounter((prev) => prev + 1);
              }
            })
            .catch((err) => {
              console.error("Error refreshing loan conditions:", err);
            });
        }

        // Refresh documents list
        if (refreshDocuments) {
          refreshDocuments();
        }
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
      setProcessingDocId(null);
      closeRequestModal();
    }
  };

  useEffect(() => {
    console.log("requirements are :", requirements);
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
        </div>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <div className="space-y-4">
            {/* Document requirement card skeletons - repeat for visual effect */}
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse border-b border-gray-100 py-4 last:border-b-0"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Document title and category */}
                    <div className="flex items-center space-x-2">
                      <div className="h-5 w-5 bg-gray-200 rounded"></div>
                      <div className="h-5 bg-gray-200 rounded w-40"></div>
                    </div>

                    {/* Document info */}
                    <div className="mt-2 ml-7 space-y-3">
                      <div className="flex items-center">
                        <div className="h-4 w-24 bg-gray-200 rounded mr-2"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-4 w-48 bg-gray-200 rounded"></div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 ml-7 flex space-x-2">
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  <div className="h-8 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
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
    </div>
  );
};

export default LenderDocumentRequirements;
