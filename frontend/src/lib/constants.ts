export const PAYMENT_METHODS = {
  TELEBIRR: { label: "Telebirr", icon: "📱" },
  CBE_BIRR: { label: "CBE Birr", icon: "🏦" },
  MPESA: { label: "M-Pesa", icon: "💚" },
} as const;

export const EVENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "text-gray-500" },
  ACTIVE: { label: "Active", color: "text-green-600" },
  SOLD_OUT: { label: "Sold Out", color: "text-orange-500" },
  CLOSED: { label: "Closed", color: "text-red-500" },
  CANCELLED: { label: "Cancelled", color: "text-red-700" },
};

export const TICKET_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "text-yellow-600" },
  PAID: { label: "Paid", color: "text-blue-600" },
  ISSUED: { label: "Issued", color: "text-green-600" },
  SCANNED: { label: "Scanned", color: "text-purple-600" },
  EXPIRED: { label: "Expired", color: "text-red-500" },
  REFUNDED: { label: "Refunded", color: "text-orange-500" },
};

export const SCAN_RESULT_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  VALID: { label: "Valid Entry", color: "text-white", bgColor: "bg-green-500" },
  ALREADY_USED: { label: "Already Used", color: "text-white", bgColor: "bg-red-500" },
  INVALID: { label: "Invalid Ticket", color: "text-white", bgColor: "bg-red-500" },
  WRONG_EVENT: { label: "Wrong Event", color: "text-white", bgColor: "bg-red-500" },
  RETRYING: { label: "Retrying...", color: "text-white", bgColor: "bg-yellow-500" },
};

export const TRANSACTION_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  FAILED: "FAILED",
} as const;
