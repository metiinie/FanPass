export interface EventWithStats {
  id: string;
  title: string;
  description: string | null;
  venue: string;
  venueMapUrl: string | null;
  dateTime: string;
  ticketPrice: number;
  currency: string;
  maxCapacity: number;
  ticketsSold: number;
  status: string;
  paymentInstructions?: string | null;
  paymentAccounts?: Record<string, unknown>[] | null;
  expectedAmount?: number | null;
  slug: string;
  createdAt: string;
  organizerId: string;
}

export type VerificationStatus = "PENDING_EXTRACTION" | "EXTRACTED_HIGH_CONFIDENCE" | "EXTRACTED_LOW_CONFIDENCE" | "MANUAL_REVIEW_REQUIRED" | "VERIFIED" | "REJECTED";

export interface ReceiptExtraction {
  amount: number | null;
  currency: string | null;
  senderName: string | null;
  date: string | null;
  transactionRef: string | null;
  confidence: number;
  flags: string[];
  amountMatch?: boolean;
}

export interface SubmissionListItem {
  id: string;
  buyerName: string | null;
  buyerPhone: string;
  ticketCount: number;
  issuedAt: string;
  screenshotUrl: string | null;
  extractedAmount: number | null;
  extractedSenderName: string | null;
  extractedDate: string | null;
  extractedRef: string | null;
  aiConfidenceScore: number | null;
  verificationStatus: VerificationStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  imageHash: string | null;
  smsStatus?: "PENDING" | "SENT" | "FAILED" | null;
  smsRetryCount?: number;
  lastSmsAttempt?: string | null;
  smsError?: string | null;
  event: {
    expectedAmount: number | null;
    ticketPrice: number;
    currency: string;
    title: string;
  };
}

export interface TicketDisplay {
  id: string;
  eventId: string;
  buyerPhone: string;
  buyerName: string | null;
  qrToken: string | null;
  status: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
  issuedAt: string;
  scannedAt: string | null;
  event: {
    title: string;
    venue: string;
    venueMapUrl?: string | null;
    dateTime: string;
    currency: string;
    ticketPrice: number;
    status: string;
    refundPolicy?: string | null;
    organizerContact?: string | null;
  };
}

export interface ScanResult {
  result: "VALID" | "ALREADY_USED" | "INVALID" | "WRONG_EVENT" | "RETRYING" | "EVENT_CANCELLED";
  buyerName?: string | null;
  buyerPhone?: string;
  ticketId?: string;
}

export interface EventStats {
  ticketsSold: number;
  maxCapacity: number;
  totalSalesValue: number;
  attendeesEntered: number;
  recentScans: ScanLogEntry[];
  submissions?: {
    pending: number;
    flagged: number;
    approved: number;
    rejected: number;
    needsReview: number;
  };
}

export interface ScanLogEntry {
  id: string;
  ticketId: string;
  staffName: string;
  buyerPhone: string;
  result: string;
  scannedAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  assignments: { eventId: string; eventTitle: string }[];
}

export type UserRole = "ORGANIZER" | "STAFF" | "SUPER_ADMIN";

export interface Influencer {
  id: string;
  name: string;
  slug: string;
  profilePhoto?: string | null;
  teamSupported?: string | null;
  teamColor?: string | null;
  isVerified: boolean;
  totalTicketsSold: number;
}

export interface SessionUser {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  organizerId?: string;
}
