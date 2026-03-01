import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { loanCompensationService } from "../../../../services/mcr.service";
import {
  LayoutDashboard,
  CircleDot,
  Calendar,
  FileText,
  MessageCircle,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  StickyNote,
} from "lucide-react";

/**
 * Loan Hub Tab (Loan Center)
 * 
 * Consolidated loan processing hub — a single-pane view of all critical data and actions.
 * Sections: Status Tracker, Quick Facts, Key Dates, Action Buttons, Recent Activity,
 * Condition Summary, Document Checklist
 */
const LoanCenterTab = ({ loan, setLoan, loanId, documents, milestones, fetchLoanDetails }) => {
  const [compensation, setCompensation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompensation();
  }, [loanId]);

  const loadCompensation = async () => {
    try {
      const res = await loanCompensationService.getCompensation(loanId);
      setCompensation(res.data);
    } catch (err) {
      console.error("Error loading compensation:", err);
      toast.error("Failed to load compensation data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    });
  };

  // Status pipeline steps
  const statusPipeline = [
    "Pre-Qualification",
    "Application Started",
    "Application Submitted",
    "Processing",
    "Underwriting",
    "Conditional Approval",
    "Clear to Close",
    "Closed",
    "Funded",
  ];

  const currentStatusIndex = statusPipeline.indexOf(loan?.status);
  const isTerminalStatus = ["Declined", "Withdrawn", "Closed-Incomplete"].includes(loan?.status);

  // Condition summary
  const conditions = loan?.conditions || [];
  const pendingConditions = conditions.filter(c => c.status === "Pending" || c.status === "In Progress").length;
  const completedConditions = conditions.filter(c => c.status === "Completed").length;
  const totalConditions = conditions.length;

  // Document summary
  const uploadedDocs = (documents || []).length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <LayoutDashboard className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Loan Hub</h2>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            isTerminalStatus
              ? "bg-red-100 text-red-800"
              : loan?.status === "Funded"
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          }`}>
            {loan?.status}
          </span>
        </div>

        {/* Status Pipeline Tracker */}
        {!isTerminalStatus && (
          <div className="relative">
            <div className="flex items-center justify-between">
              {statusPipeline.map((status, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                return (
                  <div key={status} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    } ${isCurrent ? "ring-4 ring-blue-100" : ""}`}>
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className={`mt-1 text-[10px] text-center leading-tight ${
                      isCurrent ? "font-bold text-blue-700" : "text-gray-500"
                    }`}>
                      {status.replace("Application ", "App ").replace("Conditional ", "Cond. ")}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Progress bar */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-10">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${Math.max(0, (currentStatusIndex / (statusPipeline.length - 1)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {isTerminalStatus && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <span className="text-sm text-red-700">
              This loan has been <strong>{loan?.status}</strong>.
            </span>
          </div>
        )}
      </div>

      {/* Quick Facts + Key Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Facts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Facts</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Loan Number</span>
              <span className="text-sm font-medium text-gray-900">{loan?.loanNumber || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Loan Amount</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(loan?.loanDetails?.loanAmount || loan?.loanDetails?.requestedLoanAmount || loan?.loanParameters?.loanAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Interest Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {compensation?.finalRate || loan?.loanParameters?.interestRate || "—"}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Loan Purpose</span>
              <span className="text-sm font-medium text-gray-900">{loan?.loanDetails?.loanType || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Property Type</span>
              <span className="text-sm font-medium text-gray-900">{loan?.property?.propertyType || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Occupancy</span>
              <span className="text-sm font-medium text-gray-900">{loan?.property?.occupancyType || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">LTV</span>
              <span className="text-sm font-medium text-gray-900">
                {loan?.financialCalculations?.ltv ? `${loan.financialCalculations.ltv}%` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">DTI</span>
              <span className="text-sm font-medium text-gray-900">
                {loan?.financialCalculations?.dti ? `${loan.financialCalculations.dti}%` : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Key Dates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Key Dates</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Application Date</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(compensation?.applicationDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Approval Date</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(compensation?.approvalDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Rate Lock Date</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(compensation?.rateLockDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Clear to Close</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(compensation?.clearToCloseDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Closing Date</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(compensation?.closingDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Funded Date</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(compensation?.fundedDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Lock Expiry</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(compensation?.rateLockExpiry)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Created</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(loan?.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conditions Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Conditions</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="text-3xl font-bold text-gray-900">{totalConditions}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold text-green-600">{completedConditions}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold text-amber-600">{pendingConditions}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
          </div>
          {totalConditions > 0 && (
            <div className="mt-3 bg-gray-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${(completedConditions / totalConditions) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Documents Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Documents</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="text-3xl font-bold text-gray-900">{uploadedDocs}</div>
              <div className="text-xs text-gray-500">Uploaded</div>
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Revenue</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Broker Comp</span>
              <span className="text-sm font-medium">{formatCurrency(compensation?.brokerCompensation)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Loan Revenue</span>
              <span className="text-sm font-medium">{formatCurrency(compensation?.loanRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Total Fees</span>
              <span className="text-sm font-medium">
                {formatCurrency(
                  (compensation?.originationFee || 0) +
                  (compensation?.processingFee || 0) +
                  (compensation?.brokerFlatFees || 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Notes</h3>
        {loan?.notes && loan.notes.length > 0 ? (
          <div className="space-y-3">
            {loan.notes.slice(-5).reverse().map((note, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <StickyNote className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{note.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(note.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No notes yet</p>
        )}
      </div>
    </div>
  );
};

export default LoanCenterTab;
