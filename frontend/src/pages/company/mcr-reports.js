/**
 * Company MCR Reports Page
 *
 * Mirrors the admin MCR reports page UI but uses CompanyLayout.
 * Company admins can generate and view MCR reports for all company lenders,
 * manage Financial Condition data, and export reports.
 */
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import CompanyLayout from "../../components/layout/CompanyLayout";
import { useAuth } from "../../contexts/AuthContext";
import { mcrService as MCRService } from "../../services/mcr.service";
import MCRValidationPanel from "../../components/mcr/MCRValidationPanel";
import MCRStateConfigModal from "../../components/mcr/MCRStateConfigModal";
import {
  FileBarChart,
  Download,
  Trash2,
  RefreshCw,
  Play,
  Eye,
  FileText,
  BarChart3,
  CheckCircle2,
  Send,
  X,
  ChevronLeft,
  ClipboardCheck,
  Calculator,
  Settings,
} from "lucide-react";

/* ── Constants ──────────────────────────────────────── */
const currentYear = new Date().getFullYear();

const PERIODS = [
  { value: "Q1", label: "Q1 (Jan–Mar)" },
  { value: "Q2", label: "Q2 (Apr–Jun)" },
  { value: "Q3", label: "Q3 (Jul–Sep)" },
  { value: "Q4", label: "Q4 (Oct–Dec)" },
  { value: "Annual", label: "Annual (Full Year)" },
];

const REPORT_TABS = [
  { id: "application", label: "Application Data" },
  { id: "closedLoan", label: "Closed Loan Data" },
  { id: "revenue", label: "Revenue Data" },
  { id: "mlo", label: "MLO Data" },
  { id: "rmla", label: "RMLA Section II" },
];

const US_STATES = { AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming" };

const isPeriodFuture = (year, period) => {
  const periodStartMonth = { Q1: 0, Q2: 3, Q3: 6, Q4: 9, Annual: 0 };
  return new Date(year, periodStartMonth[period] ?? 0, 1) > new Date();
};

const statusBadge = (status) => {
  if (status === "final") return "bg-green-100 text-green-700";
  if (status === "submitted") return "bg-blue-100 text-blue-700";
  return "bg-yellow-100 text-yellow-700";
};

/* ── Format helpers ─────────────────────────────────── */
const fc = (n) => {
  if (!n && n !== 0) return "$0";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
const avg = (amount, count) => {
  if (!count || count === 0) return "—";
  return fc(Math.round(amount / count));
};
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";


/* ══════════════════════════════════════════════════════
   MCR TABLE COMPONENTS
══════════════════════════════════════════════════════ */
const MCRTableHeader = () => (
  <thead>
    <tr className="bg-blue-700 text-white text-xs">
      <th className="px-3 py-2 text-left font-semibold w-20 align-bottom" rowSpan={2}>DATA<br/>POINTS</th>
      <th className="px-3 py-2 text-left font-semibold align-bottom" rowSpan={2}>PARAMETERS</th>
      <th className="px-3 py-1 text-center font-semibold border-l border-blue-500" colSpan={3}>DIRECTLY RECEIVED FROM BORROWER</th>
      <th className="px-3 py-1 text-center font-semibold border-l border-blue-500 bg-blue-600/80" colSpan={3}>THIRD PARTY</th>
    </tr>
    <tr className="bg-blue-700 text-white text-xs">
      <th className="px-3 py-1 text-right font-medium w-28 border-l border-blue-500">Amount</th>
      <th className="px-3 py-1 text-right font-medium w-20">Count</th>
      <th className="px-3 py-1 text-right font-medium w-24">Average</th>
      <th className="px-3 py-1 text-right font-medium w-24 border-l border-blue-500 bg-blue-600/80">Amount</th>
      <th className="px-3 py-1 text-right font-medium w-20 bg-blue-600/80">Count</th>
      <th className="px-3 py-1 text-right font-medium w-20 bg-blue-600/80">Average</th>
    </tr>
  </thead>
);

/* Simple 5-column header: Data Points | Parameters | Amount | Count | Average */
const MCRSimpleHeader = () => (
  <thead>
    <tr className="bg-blue-700 text-white text-xs">
      <th className="px-3 py-2 text-left font-semibold w-24 align-bottom" rowSpan={2}>DATA<br/>POINTS</th>
      <th className="px-3 py-2 text-left font-semibold align-bottom" rowSpan={2}>PARAMETERS</th>
      <th className="px-3 py-1 text-center border-l border-blue-500" colSpan={3}>&nbsp;</th>
    </tr>
    <tr className="bg-blue-700 text-white text-xs">
      <th className="px-3 py-1 text-right font-medium w-32 border-l border-blue-500">Amount</th>
      <th className="px-3 py-1 text-right font-medium w-20">Count</th>
      <th className="px-3 py-1 text-right font-medium w-24">Average</th>
    </tr>
  </thead>
);

const MCRClosedLoanHeader = () => (
  <thead>
    <tr className="bg-blue-700 text-white text-xs">
      <th className="px-3 py-2 text-left font-semibold w-24 align-bottom" rowSpan={2}>Code</th>
      <th className="px-3 py-2 text-left font-semibold align-bottom" rowSpan={2}>Description</th>
      <th className="px-3 py-1 text-center font-semibold border-l border-blue-500" colSpan={3}>Brokered</th>
      <th className="px-3 py-1 text-center font-semibold border-l border-blue-500 bg-blue-800" colSpan={3}>Non Delegated Correspondent</th>
    </tr>
    <tr className="bg-blue-700 text-white text-xs">
      <th className="px-3 py-1 text-right font-medium w-28 border-l border-blue-500">Amount</th>
      <th className="px-3 py-1 text-right font-medium w-20">Count</th>
      <th className="px-3 py-1 text-right font-medium w-24">Average</th>
      <th className="px-3 py-1 text-right font-medium w-28 border-l border-blue-500 bg-blue-800">Amount</th>
      <th className="px-3 py-1 text-right font-medium w-20 bg-blue-800">Count</th>
      <th className="px-3 py-1 text-right font-medium w-24 bg-blue-800">Average</th>
    </tr>
  </thead>
);

const MCRClosedLoanRow = ({ code, label, val, isTotal, required }) => {
  const coalesceCh = (ch) =>
    ch && typeof ch === "object"
      ? { amount: Number(ch.amount) || 0, count: Number(ch.count) || 0 }
      : null;
  const br = coalesceCh(val?.brokered);
  const ndRaw = coalesceCh(val?.nonDelegated);
  let b = { amount: 0, count: 0 };
  let nd = { amount: 0, count: 0 };
  if (br !== null || ndRaw !== null) {
    b = br ?? { amount: 0, count: 0 };
    nd = ndRaw ?? { amount: 0, count: 0 };
  } else if (val?.amount !== undefined) {
    b = { amount: val.amount, count: val.count || 0 };
  }
  return (
    <tr className={`border-b border-gray-100 ${isTotal ? "bg-gray-50 font-semibold" : "hover:bg-blue-50/30"}`}>
      <td className={`px-3 py-2 text-xs font-mono ${isTotal ? "text-gray-900 font-bold" : "text-blue-600 font-semibold"}`}>
        {code}{required && <span className="text-red-500 ml-0.5">*</span>}
      </td>
      <td className={`px-3 py-2 text-sm ${isTotal ? "text-gray-900 font-bold" : "text-gray-700"}`}>{label}</td>
      <td className="px-3 py-2 text-sm text-right text-gray-900">{fc(b.amount)}</td>
      <td className="px-3 py-2 text-sm text-right text-gray-900">{b.count || 0}</td>
      <td className="px-3 py-2 text-sm text-right text-gray-500">{avg(b.amount, b.count)}</td>
      <td className="px-3 py-2 text-sm text-right text-gray-600 bg-gray-50/50">{fc(nd.amount)}</td>
      <td className="px-3 py-2 text-sm text-right text-gray-600 bg-gray-50/50">{nd.count || 0}</td>
      <td className="px-3 py-2 text-sm text-right text-gray-500 bg-gray-50/50">{avg(nd.amount, nd.count)}</td>
    </tr>
  );
};

const MCRClosedLoanFeeRow = ({ code, label, amount }) => (
  <tr className="border-b border-gray-100 hover:bg-blue-50/30">
    <td className="px-3 py-2 text-xs font-mono text-blue-600 font-semibold">{code}</td>
    <td className="px-3 py-2 text-sm text-gray-700">{label}</td>
    <td className="px-3 py-2 text-sm text-right text-gray-900">{fc(amount)}</td>
    <td colSpan={5} className="bg-gray-50/30"></td>
  </tr>
);

const MCRSectionRow = ({ label, colSpan = 8 }) => (
  <tr className="bg-gray-100">
    <td colSpan={colSpan} className="px-3 py-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</td>
  </tr>
);

const MCRDataRow = ({ code, label, val, isBold, isSubtotal }) => (
  <tr className={`border-b border-gray-100 ${isSubtotal ? "bg-gray-50 font-semibold" : "hover:bg-blue-50/30"}`}>
    <td className={`px-3 py-2 text-xs font-mono ${isBold || isSubtotal ? "text-gray-900 font-bold" : "text-blue-600 font-semibold"}`}>{code}</td>
    <td className={`px-3 py-2 text-sm ${isBold || isSubtotal ? "text-gray-900 font-bold" : "text-gray-700"}`}>{label}</td>
    <td className="px-3 py-2 text-sm text-right text-gray-900">{fc(val?.amount)}</td>
    <td className="px-3 py-2 text-sm text-right text-gray-900">{val?.count || 0}</td>
    <td className="px-3 py-2 text-sm text-right text-gray-500">{avg(val?.amount, val?.count)}</td>
    <td className="px-3 py-2 text-sm text-right text-gray-400 bg-gray-50/50">$0</td>
    <td className="px-3 py-2 text-sm text-right text-gray-400 bg-gray-50/50">0</td>
    <td className="px-3 py-2 text-sm text-right text-gray-400 bg-gray-50/50">—</td>
  </tr>
);

const MCRAmountRow = ({ code, label, amount, isBold }) => (
  <tr className={`border-b border-gray-100 ${isBold ? "bg-gray-50" : "hover:bg-blue-50/30"}`}>
    <td className={`px-3 py-2 text-xs font-mono ${isBold ? "text-gray-900 font-bold" : "text-blue-600 font-semibold"}`}>{code}</td>
    <td className={`px-3 py-2 text-sm ${isBold ? "text-gray-900 font-bold" : "text-gray-700"}`}>{label}</td>
    <td className="px-3 py-2 text-sm text-right text-gray-900">{fc(amount)}</td>
    <td colSpan={5} className="px-3 py-2 bg-gray-50/50"></td>
  </tr>
);

const EmptyState = ({ message = "No data available for this section" }) => (
  <div className="py-12 text-center text-sm text-gray-400 italic">{message}</div>
);


/* ══════════════════════════════════════════════════════
   TAB CONTENT VIEWS
══════════════════════════════════════════════════════ */
const ApplicationDataView = ({ data }) => {
  if (!data) return <EmptyState />;
  const ac010 = data.AC010 || {}; const ac020 = data.AC020 || {};
  const ac030 = data.AC030 || {}; const ac040 = data.AC040 || {};
  const ac050 = data.AC050 || {}; const ac060 = data.AC060 || {};
  const ac070 = data.AC070 || {}; const ac080 = data.AC080 || {};
  const ac065 = data.AC065 || {};
  const ac063 = data.AC063 || {};
  const ac066 = data.AC066 || { amount: 0, count: 0 };
  const ac090Total = {
    amount: (ac030.amount||0)+(ac040.amount||0)+(ac050.amount||0)+(ac060.amount||0)+(ac070.amount||0)+(ac080.amount||0),
    count:  (ac030.count||0)+(ac040.count||0)+(ac050.count||0)+(ac060.count||0)+(ac070.count||0)+(ac080.count||0),
  };
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <MCRTableHeader />
        <tbody>
          <MCRSectionRow label="APPLICATION PIPELINE" />
          <MCRDataRow code="AC010" label="Applications in Process at the Beginning of the Period" val={ac010} />
          <MCRDataRow code="AC020" label="Applications Received" val={ac020} />
          <MCRDataRow code="AC030" label="Applications Approved but not Accepted" val={ac030} />
          <MCRDataRow code="AC040" label="Applications Denied" val={ac040} />
          <MCRDataRow code="AC050" label="Applications Withdrawn" val={ac050} />
          <MCRDataRow code="AC060" label="File Closed for Incompleteness" val={ac060} />
          <MCRAmountRow code="AC065" label="Net Changes in Application Amount" amount={ac065.amount || 0} />
          <MCRDataRow code="AC063" label="Net Application Changes" val={ac063} />
          <MCRDataRow code="AC066" label="Total Application Pipeline" val={ac066} isBold isSubtotal />
          <MCRSectionRow label="APPLICATION PIPELINE RESULTS" />
          <MCRDataRow code="AC070" label="Loans Closed and Funded" val={ac070} />
          <MCRDataRow code="AC080" label="Applications in Process at the End of the Period" val={ac080} />
          <MCRDataRow code="AC090" label="Total Application Pipeline Results" val={ac090Total} isBold isSubtotal />
        </tbody>
      </table>
    </div>
  );
};

const ClosedLoanDataView = ({ data }) => {
  if (!data) return <EmptyState />;
  const Row = ({ code, label, isTotal, required }) => (
    <MCRClosedLoanRow code={code} label={data[code]?.label || label} val={data[code]} isTotal={isTotal} required={required} />
  );
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <MCRClosedLoanHeader />
        <tbody>
          <MCRSectionRow label="FORWARD MORTGAGES – LOAN TYPE" />
          <Row code="AC100" label="Conventional" />
          <Row code="AC110" label="FHA-Insured" />
          <Row code="AC120" label="VA-Guaranteed" />
          <Row code="AC130" label="FSA/RHS-Guaranteed" />
          <Row code="AC190" label="Total Loan Type – Forward Mortgages" isTotal />

          <MCRSectionRow label="PROPERTY TYPE" />
          <Row code="AC200" label="One to Four Family Dwelling" />
          <Row code="AC210" label="Manufactured Housing" />
          <Row code="AC290" label="Total Property Type" isTotal />

          <MCRSectionRow label="PURPOSE OF LOAN OR APPLICATION" />
          <Row code="AC300" label="Home Purchase" />
          <Row code="AC310" label="Home Improvement" />
          <Row code="AC320" label="Refinancing" />
          <Row code="AC390" label="Total Purpose of Loan or Application" isTotal />

          <MCRSectionRow label="HOEPA" />
          <Row code="AC400" label="HOEPA" required />

          <MCRSectionRow label="LIEN STATUS" />
          <Row code="AC500" label="First Lien" />
          <Row code="AC510" label="Subordinate Lien" />
          <Row code="AC520" label="Not Secured by a Lien" required />
          <Row code="AC590" label="Total Lien Status" isTotal />

          <MCRSectionRow label="FEE INFORMATION" />
          <MCRClosedLoanFeeRow code="AC600" label="Broker Fees Collected-Forward Mortgages" amount={data.AC600?.amount} />
          <MCRClosedLoanFeeRow code="AC610" label="Lender Fees Collected-Forward Mortgages" amount={data.AC610?.amount} />

          <MCRSectionRow label="REVERSE MORTGAGES" />
          <Row code="AC700" label="HECM-Standard" />
          <Row code="AC710" label="HECM-Saver" />
          <Row code="AC720" label="Proprietary/Other" />
          <Row code="AC790" label="Total Loan Type – Reverse Mortgages" isTotal />

          <MCRSectionRow label="QM AND NON-QM" />
          <Row code="AC920" label="Qualified Mortgage (QM)" />
          <Row code="AC930" label="Non-Qualified Mortgage" />
          <Row code="AC940" label="Not Subject to QM" />
          <Row code="AC990" label="Total Closed Loans" isTotal />

          <tr className="border-b border-gray-100 hover:bg-blue-50/30">
            <td className="px-3 py-2 text-xs font-mono text-blue-600 font-semibold">AC1000</td>
            <td className="px-3 py-2 text-sm text-gray-700" colSpan={7}>Loans Made and Assigned but Required to Repurchase in Period</td>
          </tr>

          <MCRSectionRow label="SERVICED LOANS" />
          <Row code="AC1200" label="Closed Loans During the Quarter with Servicing Retained" />
          <Row code="AC1210" label="Closed Loans During the Quarter with Servicing Released" />
          <Row code="AC1290" label="Total Closed Loans" isTotal />
        </tbody>
      </table>
    </div>
  );
};

const RevenueDataView = ({ data }) => {
  if (!data) return <EmptyState />;
  const SRow = ({ code, label, amount, count, isBold }) => (
    <tr className={`border-b border-gray-100 ${isBold ? "bg-gray-50" : "hover:bg-blue-50/30"}`}>
      <td className={`px-3 py-2 text-xs font-mono ${isBold ? "text-gray-900 font-bold" : "text-blue-600 font-semibold"}`}>{code}</td>
      <td className={`px-3 py-2 text-sm ${isBold ? "text-gray-900 font-bold" : "text-gray-700"}`}>{label}</td>
      <td className={`px-3 py-2 text-sm text-right ${isBold ? "font-bold text-gray-900" : "text-gray-900"}`}>{fc(amount)}</td>
      <td className="px-3 py-2 text-sm text-right text-gray-500">{count != null ? count : "—"}</td>
      <td className="px-3 py-2 text-sm text-right text-gray-500">{count != null && count > 0 ? avg(amount, count) : "—"}</td>
    </tr>
  );
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <MCRSimpleHeader />
        <tbody>
          <MCRSectionRow label="GROSS REVENUE" colSpan={5} />
          <SRow code="AC1100" label={data.AC1100?.label || "Gross Revenue from Mortgage Origination Operations"} amount={data.AC1100?.amount} isBold />
          <MCRSectionRow label="SERVICING DISPOSITION" colSpan={5} />
          <SRow code="AC1200" label={data.AC1200?.label || "Servicing Retained"} amount={data.AC1200?.amount} count={data.AC1200?.count} />
          <SRow code="AC1210" label={data.AC1210?.label || "Servicing Released"} amount={data.AC1210?.amount} count={data.AC1210?.count} />
        </tbody>
      </table>
    </div>
  );
};

const MLODataView = ({ data }) => {
  const officers = data?.loanOfficers || (Array.isArray(data) ? data : []);
  if (!officers.length) return <EmptyState message="No MLO data available" />;
  const totalAmt = officers.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalCnt = officers.reduce((s, o) => s + (o.loanCount || 0), 0);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <MCRSimpleHeader />
        <tbody>
          <MCRSectionRow label="LOAN OFFICERS" colSpan={5} />
          {officers.map((o, i) => {
            const name = o.firstName ? `${o.firstName} ${o.lastName || ""}`.trim() : (o.name || "—");
            const nmlsDisplay = o.nmlsId ? ` (NMLS: ${o.nmlsId})` : "";
            return (
              <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/30">
                <td className="px-3 py-2 text-xs font-mono text-blue-600 font-semibold">ACMLO{i + 1}</td>
                <td className="px-3 py-2 text-sm text-gray-900">{name}<span className="text-gray-400 text-xs">{nmlsDisplay}</span></td>
                <td className="px-3 py-2 text-sm text-right text-gray-900">{fc(o.totalAmount)}</td>
                <td className="px-3 py-2 text-sm text-right text-gray-900">{o.loanCount || 0}</td>
                <td className="px-3 py-2 text-sm text-right text-gray-500">{avg(o.totalAmount, o.loanCount)}</td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
            <td className="px-3 py-2 text-xs font-mono text-gray-900 font-bold">TOTAL</td>
            <td className="px-3 py-2 text-sm text-gray-900 font-bold">All Loan Officers</td>
            <td className="px-3 py-2 text-sm text-right text-gray-900">{fc(totalAmt)}</td>
            <td className="px-3 py-2 text-sm text-right text-gray-900">{totalCnt}</td>
            <td className="px-3 py-2 text-sm text-right text-gray-500">{avg(totalAmt, totalCnt)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const RMLADataView = ({ data }) => {
  if (!data) return <EmptyState />;
  const pt = data.productType || {};
  const ch = data.channel || {};
  const rc = data.riskCharacteristics || {};
  const om = data.otherMortgages || {};
  const purpose = data.purpose || {};
  const ltv = data.ltvDistribution || {};
  const wa = data.weightedAverages || {};
  const pull = data.pullThrough || {};
  const i100 = {
    count: ["governmentFixed","governmentARM","conventionalFixed","conventionalARM","jumboFixed","jumboARM","otherFixed","otherARM"].reduce((s,k) => s+(pt[k]?.count||0), 0),
    amount: ["governmentFixed","governmentARM","conventionalFixed","conventionalARM","jumboFixed","jumboARM","otherFixed","otherARM"].reduce((s,k) => s+(pt[k]?.amount||0), 0),
  };
  const i200 = {
    count: ["closedEndSecond","heloc","reverse","construction1to4","construction5plus","constructionCommercial","commercialMortgage","landContract"].reduce((s,k) => s+(om[k]?.count||0), 0),
    amount: ["closedEndSecond","heloc","reverse","construction1to4","construction5plus","constructionCommercial","commercialMortgage","landContract"].reduce((s,k) => s+(om[k]?.amount||0), 0),
  };
  const Row = ({ code, label, val, isBold }) => (
    <tr className={`border-b border-gray-100 ${isBold ? "bg-gray-50" : "hover:bg-blue-50/30"}`}>
      <td className={`px-3 py-2 text-xs font-mono ${isBold ? "text-gray-900 font-bold" : "text-blue-600 font-semibold"}`}>{code}</td>
      <td className={`px-3 py-2 text-sm ${isBold ? "text-gray-900 font-bold" : "text-gray-700"}`}>{label}</td>
      <td className={`px-3 py-2 text-sm text-right ${isBold ? "font-bold text-gray-900" : "text-gray-900"}`}>{fc(val?.amount)}</td>
      <td className={`px-3 py-2 text-sm text-right ${isBold ? "font-bold text-gray-900" : "text-gray-900"}`}>{val?.count || 0}</td>
      <td className="px-3 py-2 text-sm text-right text-gray-500">{avg(val?.amount, val?.count)}</td>
    </tr>
  );
  const WRow = ({ label, value }) => (
    <tr className="border-b border-gray-100 hover:bg-blue-50/30">
      <td className="px-3 py-2 text-xs font-mono text-gray-400">—</td>
      <td className="px-3 py-2 text-sm text-gray-700">{label}</td>
      <td className="px-3 py-2 text-sm text-right text-gray-900" colSpan={3}>{value}</td>
    </tr>
  );
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <MCRSimpleHeader />
        <tbody>
          <MCRSectionRow label="RESIDENTIAL FIRST MORTGAGES (1-4 UNIT RESIDENTIAL ONLY)" colSpan={5} />
          <Row code="I010" label="Government (FHA/VA/RHS) Fixed" val={pt.governmentFixed} />
          <Row code="I020" label="Government (FHA/VA/RHS) ARM" val={pt.governmentARM} />
          <Row code="I030" label="Conventional Conforming Fixed" val={pt.conventionalFixed} />
          <Row code="I040" label="Conventional Conforming ARM" val={pt.conventionalARM} />
          <Row code="I050" label="Conventional Non-Conforming (Jumbo) Fixed" val={pt.jumboFixed} />
          <Row code="I060" label="Conventional Non-Conforming (Jumbo) ARM" val={pt.jumboARM} />
          <Row code="I070" label="Other Fixed" val={pt.otherFixed} />
          <Row code="I080" label="Other ARM" val={pt.otherARM} />
          <Row code="I100" label="Total Residential First Mortgages" val={i100} isBold />
          <MCRSectionRow label="OTHER MORTGAGES" colSpan={5} />
          <Row code="I110" label="Closed-End Second Mortgages" val={om.closedEndSecond} />
          <Row code="I120" label="HELOCs (include the credit line amount)" val={om.heloc} />
          <Row code="I130" label="Reverse Mortgages" val={om.reverse} />
          <Row code="I140" label="Construction, 1-4 Unit Residential" val={om.construction1to4} />
          <Row code="I150" label="Construction, 5+ Unit Residential" val={om.construction5plus} />
          <Row code="I160" label="Construction, Commercial" val={om.constructionCommercial} />
          <Row code="I170" label="Commercial Mortgage" val={om.commercialMortgage} />
          <Row code="I180" label="Land Contract" val={om.landContract} />
          <Row code="I200" label="Total Other Mortgages" val={i200} isBold />
          <MCRSectionRow label="ORIGINATION CHANNEL" colSpan={5} />
          <Row code="I210" label="Brokered" val={ch.brokered} />
          <Row code="I220" label="Closed – Retail" val={ch.closedRetail} />
          <Row code="I230" label="Closed – Correspondent (Non-Delegated Underwriting)" val={ch.closedCorrespondent} />
          <Row code="I240" label="Table Funded" val={ch.tableFunded} />
          <MCRSectionRow label="RISK CHARACTERISTICS" colSpan={5} />
          <Row code="I270" label="Alt / Reduced Documentation" val={rc.altDoc} />
          <Row code="I280" label="Interest Only" val={rc.interestOnly} />
          <Row code="I290" label="Option ARM" val={rc.optionARM} />
          <Row code="I300" label="Prepayment Penalty" val={rc.prepaymentPenalty} />
          <Row code="I330" label="Mortgage Insurance" val={rc.mortgageInsurance} />
          <Row code="I340" label="Piggyback Seconds" val={rc.piggybackSecond} />
          <MCRSectionRow label="LOAN PURPOSE" colSpan={5} />
          <Row code="I350" label="Purchase" val={purpose.purchase} />
          <Row code="I360" label="Refinance" val={purpose.refinance} />
          <MCRSectionRow label="LTV DISTRIBUTION" colSpan={5} />
          <Row code="I370" label="≤ 60%" val={ltv.lt60} />
          <Row code="I380" label="60.01% – 70%" val={ltv.lt70} />
          <Row code="I390" label="70.01% – 80%" val={ltv.lt80} />
          <Row code="I400" label="80.01% – 90%" val={ltv.lt90} />
          <Row code="I410" label="90.01% – 95%" val={ltv.lt95} />
          <Row code="I420" label="95.01% – 100%" val={ltv.lt100} />
          <Row code="I430" label="&gt; 100%" val={ltv.gt100} />
          <MCRSectionRow label="WEIGHTED AVERAGES &amp; PULL-THROUGH" colSpan={5} />
          <WRow label="Weighted Average LTV" value={`${wa.ltv || 0}%`} />
          <WRow label="Weighted Average Coupon Rate" value={`${wa.couponRate || 0}%`} />
          <WRow label="Weighted Average Warehouse Period (days)" value={`${wa.warehousePeriod || 0} days`} />
          <WRow label="Applications Received" value={pull.appsReceived || 0} />
          <WRow label="Loans Funded" value={pull.loansFunded || 0} />
          <WRow label="Pull-Through Ratio" value={`${pull.ratio || 0}%`} />
        </tbody>
      </table>
    </div>
  );
};


/* ══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
══════════════════════════════════════════════════════ */
const CompanyMCRReports = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPeriod, setSelectedPeriod] = useState("Q1");
  const [selectedStates, setSelectedStates] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("application");
  const [stateFilter, setStateFilter] = useState("All");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showStateConfig, setShowStateConfig] = useState(false);
  const [stateConfigs, setStateConfigs] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReports();
    loadStateConfigs();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await MCRService.getReports();
      setReports(res.data || []);
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStateConfigs = async () => {
    try {
      const res = await MCRService.getStateConfigs();
      setStateConfigs(res.data || []);
    } catch (err) {
      console.error("Error loading state configs:", err);
    }
  };

  const handleSaveStateConfig = async (stateCode, data) => {
    await MCRService.updateStateConfig(stateCode, data);
  };

  const handleGenerate = async () => {
    if (isPeriodFuture(selectedYear, selectedPeriod)) {
      toast.error(`Cannot generate report — ${selectedPeriod} ${selectedYear} has not ended yet`);
      return;
    }
    setGenerating(true);
    try {
      const res = await MCRService.generateReport(
        selectedYear,
        selectedPeriod,
        selectedStates.length > 0 ? selectedStates : undefined,
        "standard"
      );
      toast.success("Report generated successfully");
      setActiveReport(res.data);
      setActiveTab("application");
      setStateFilter("All");
      loadReports();
    } catch (err) {
      console.error("Error generating report:", err);
      toast.error(err.response?.data?.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleViewReport = async (id) => {
    setLoading(true);
    try {
      const res = await MCRService.getReport(id);
      setActiveReport(res.data);
      setActiveTab("application");
      setStateFilter("All");
    } catch (err) {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async () => {
    const reportId = showDeleteConfirm;
    if (!reportId || deleting) return;
    setDeleting(true);
    try {
      await MCRService.deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r._id !== reportId));
      if (activeReport?._id === reportId) setActiveReport(null);
      toast.success("Report deleted");
      setShowDeleteConfirm(null);
    } catch (err) {
      toast.error("Failed to delete report");
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async (format) => {
    if (!activeReport?._id) return;
    setExporting(true);
    try {
      await MCRService.exportReport(activeReport._id, format, stateFilter !== "All" ? stateFilter : "all");
      toast.success(`Exported as ${format.toUpperCase()}`);
      setShowExportModal(false);
    } catch (err) {
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!activeReport || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await MCRService.updateReportStatus(activeReport._id, newStatus);
      setActiveReport((prev) => ({ ...prev, status: newStatus }));
      setReports((prev) => prev.map((r) => r._id === activeReport._id ? { ...r, status: newStatus } : r));
      toast.success(`Report marked as ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update report status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const availableStates = activeReport?.states || [];

  const getFilteredData = () => {
    if (!activeReport) return null;
    const tabKey = { application: "applicationData", closedLoan: "closedLoanData", revenue: "revenueData", mlo: "mloData", rmla: "rmlaData" }[activeTab];
    if (stateFilter === "All" || !activeReport.perStateData) return activeReport[tabKey] || null;
    const stateData = activeReport.perStateData instanceof Map
      ? activeReport.perStateData.get(stateFilter)
      : activeReport.perStateData?.[stateFilter];
    return stateData?.[tabKey] || null;
  };

  /* ══ RENDER ══════════════════════════════════════════ */
  return (
    <CompanyLayout>
      <Head>
        <title>MCR Reports | Company Dashboard</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shadow">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">MCR Reports</h1>
              <p className="text-xs sm:text-sm text-gray-500">Company-level NMLS Mortgage Call Reports</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {activeReport && (
              <button
                onClick={() => { setActiveReport(null); }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition"
              >
                <ChevronLeft className="h-4 w-4" /> Back to Reports
              </button>
            )}
          </div>
        </div>

        {/* ── Generate + Reports List ── */}
        {!activeReport && (
          <>
            {/* Generate Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-900">Generate Report</h2>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Year</label>
                    <input
                      type="number"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      min={2000}
                      max={currentYear + 1}
                      placeholder="e.g. 2026"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Period</label>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {PERIODS.map((p) => {
                        const future = isPeriodFuture(selectedYear, p.value);
                        return (
                          <option key={p.value} value={p.value} disabled={future}>
                            {p.label}{future ? " (not yet)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      States <span className="text-gray-400 font-normal normal-case">(blank = all)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CA, TX, FL"
                      value={selectedStates.join(", ")}
                      onChange={(e) =>
                        setSelectedStates(e.target.value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                >
                  {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {generating ? "Generating…" : "Generate Report"}
                </button>
              </div>
            </div>

            {/* Reports List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Reports</h2>
                <button onClick={loadReports} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {loading ? (
                <div className="px-6 py-8 flex items-center gap-2 text-sm text-gray-400">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Loading reports…
                </div>
              ) : reports.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <FileBarChart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No reports yet. Generate one above.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {reports.map((r) => (
                    <div key={r._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-xl flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{r.year} {r.period}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(r.status)}`}>
                            {r.status || "draft"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {r.totalLoansIncluded || 0} loans · {formatDate(r.createdAt)}
                          {r.states?.length > 0 && ` · ${r.states.join(", ")}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewReport(r._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(r._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Full Report Viewer ── */}
        {activeReport && (
          <div className="space-y-4">
            {/* Report Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {activeReport.year} {activeReport.period} MCR Report
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge(activeReport.status)}`}>
                      {activeReport.status || "draft"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {activeReport.totalLoansIncluded || 0} loans included
                    {activeReport.totalLoansExcluded > 0 && ` · ${activeReport.totalLoansExcluded} excluded`}
                  </p>
                  {activeReport.states?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activeReport.states.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {activeReport.status === "draft" && (
                    <button
                      onClick={() => handleStatusUpdate("final")}
                      disabled={updatingStatus}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition shadow-sm whitespace-nowrap"
                    >
                      {updatingStatus ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Mark as Final
                    </button>
                  )}
                  {activeReport.status === "final" && (
                    <button
                      onClick={() => handleStatusUpdate("submitted")}
                      disabled={updatingStatus}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm whitespace-nowrap"
                    >
                      {updatingStatus ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Mark as Submitted
                    </button>
                  )}
                  {activeReport.status === "submitted" && (
                    <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-xl border border-indigo-200">
                      <Send className="h-4 w-4" /> Filed with NMLS
                    </span>
                  )}
                  <button
                    onClick={() => setShowValidation((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                  >
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    {showValidation ? "Hide" : "Validate"}
                  </button>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
                  >
                    <Download className="h-4 w-4" /> Export
                  </button>
                </div>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
                {[
                  ["Beginning Pipeline", activeReport.applicationData?.AC010?.count || 0, "bg-gray-50"],
                  ["Apps Received",      activeReport.applicationData?.AC020?.count || 0, "bg-blue-50"],
                  ["Denied",             activeReport.applicationData?.AC030?.count || 0, "bg-red-50"],
                  ["Withdrawn",          activeReport.applicationData?.AC040?.count || 0, "bg-orange-50"],
                  ["Funded",             activeReport.applicationData?.AC070?.count || 0, "bg-green-50"],
                ].map(([label, val, bg]) => (
                  <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                    <p className="text-2xl font-bold text-gray-900">{val}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation Panel */}
            <MCRValidationPanel report={activeReport} fcData={null} show={showValidation} />

            {/* Sidebar + Tabs + Content */}
            <div className="flex flex-col sm:flex-row sm:gap-4 gap-4">
              {/* State Sidebar */}
              {availableStates.length >= 1 && (
                <div className="w-full sm:w-44 flex-shrink-0">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">States</p>
                    <button
                      onClick={() => setStateFilter("All")}
                      className={`w-full text-left px-3 py-2 text-sm mb-0.5 rounded-lg transition ${
                        stateFilter === "All" ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >All States</button>
                    {availableStates.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStateFilter(s)}
                        className={`w-full text-left px-3 py-2 text-sm mb-0.5 rounded-lg transition ${
                          stateFilter === s ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {US_STATES[s] || s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Bar + Content */}
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-3 overflow-hidden">
                  <div className="flex border-b border-gray-200 overflow-x-auto">
                    {REPORT_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                          activeTab === tab.id
                            ? "border-blue-600 text-blue-600 bg-blue-50/50"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">
                      {stateFilter === "All" ? "All States" : (US_STATES[stateFilter] || stateFilter)} — {REPORT_TABS.find(t => t.id === activeTab)?.label}
                    </h3>
                  </div>
                  <div>
                    {activeTab === "application" && <ApplicationDataView data={getFilteredData()} />}
                    {activeTab === "closedLoan"  && <ClosedLoanDataView  data={getFilteredData()} />}
                    {activeTab === "revenue"     && <RevenueDataView     data={getFilteredData()} />}
                    {activeTab === "mlo"         && <MLODataView         data={getFilteredData()} />}
                    {activeTab === "rmla"        && <RMLADataView        data={getFilteredData()} />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Export Modal ── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Export Report</h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleExport("excel")}
                disabled={exporting}
                className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Excel (.xlsx)</p>
                  <p className="text-xs text-gray-500">NMLS-formatted spreadsheet</p>
                </div>
              </button>
              <button
                onClick={() => handleExport("xml")}
                disabled={exporting}
                className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileBarChart className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">NMLS XML</p>
                  <p className="text-xs text-gray-500">Direct NMLS upload format</p>
                </div>
              </button>
            </div>
            {exporting && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" /> Preparing download…
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete this report?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReport}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State Config Modal */}
      <MCRStateConfigModal
        show={showStateConfig}
        onClose={() => setShowStateConfig(false)}
        configs={stateConfigs}
        onSave={handleSaveStateConfig}
        onRefresh={loadStateConfigs}
      />
    </CompanyLayout>
  );
};

export default CompanyMCRReports;

