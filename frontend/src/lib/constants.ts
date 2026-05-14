export const VERIFICATION_STATUS_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING_EXTRACTION: { label: "Awaiting AI", color: "text-gray-600", bgColor: "bg-gray-50" },
  EXTRACTED_HIGH_CONFIDENCE: { label: "High Confidence", color: "text-blue-600", bgColor: "bg-blue-50" },
  EXTRACTED_LOW_CONFIDENCE: { label: "Needs Review", color: "text-orange-600", bgColor: "bg-orange-50" },
  MANUAL_REVIEW_REQUIRED: { label: "Manual Review", color: "text-red-600", bgColor: "bg-red-50" },
  VERIFIED: { label: "Verified", color: "text-green-600", bgColor: "bg-green-50" },
  REJECTED: { label: "Rejected", color: "text-red-600", bgColor: "bg-red-50" },
};

export const REJECTION_REASONS = [
  "Wrong amount",
  "Duplicate submission",
  "Fake receipt",
  "Old receipt",
  "Other"
];

export const EVENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "text-gray-500" },
  ACTIVE: { label: "Active", color: "text-green-600" },
  SALES_CLOSED: { label: "Sales Closed", color: "text-orange-500" },
  LIVE: { label: "Live", color: "text-blue-600" },
  COMPLETED: { label: "Completed", color: "text-gray-600" },
  CANCELLED: { label: "Cancelled", color: "text-red-700" },
};

export const TICKET_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "text-yellow-600" },
  ISSUED: { label: "Issued", color: "text-green-600" },
  SCANNED: { label: "Scanned", color: "text-purple-600" },
  EXPIRED: { label: "Expired", color: "text-red-500" },
  CANCELLED_PENDING_REFUND: { label: "Cancelled (Refund Pending)", color: "text-red-600" },
  REFUND_CONFIRMED: { label: "Refund Confirmed", color: "text-green-700" },
};

export const SCAN_RESULT_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  VALID: { label: "Valid Entry", color: "text-white", bgColor: "bg-green-500" },
  ALREADY_USED: { label: "Already Used", color: "text-white", bgColor: "bg-red-500" },
  INVALID: { label: "Invalid Ticket", color: "text-white", bgColor: "bg-red-500" },
  WRONG_EVENT: { label: "Wrong Event", color: "text-white", bgColor: "bg-red-500" },
  RETRYING: { label: "Retrying...", color: "text-white", bgColor: "bg-yellow-500" },
};

