

export type VerificationStatus = "PENDING_EXTRACTION" | "EXTRACTED_HIGH_CONFIDENCE" | "EXTRACTED_LOW_CONFIDENCE" | "MANUAL_REVIEW_REQUIRED" | "VERIFIED" | "REJECTED" | "AI_FLAGGED" | "PENDING";

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
  note?: string | null;
  event: {
    expectedAmount: number | null;
    ticketPrice: number;
    currency: string;
    title: string;
  };
  aiRawText?: string | null;
}

export interface AdminStats {
  totalEvents: number;
  totalTicketsSold: number;
  totalSalesValue: number;
  totalInfluencers: number;
}

export interface GlobalApprovalStats {
  needsReview: number;
  avgApprovalMinutes: number;
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
  staff?: { id: string; name: string }[];
}

export interface ScanLogEntry {
  id: string;
  ticketId?: string;
  staffName: string;
  buyerPhone: string;
  result: string;
  scannedAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  assignments: { eventId: string; event: { id: string; title: string; status: string } }[];
}

export type UserRole = "ORGANIZER" | "STAFF" | "SUPER_ADMIN";

export interface Influencer {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  profilePhoto?: string | null;
  teamSupported?: string | null;
  teamColor?: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  phone: string;
  tiktokUrl?: string | null;
  instagramUrl?: string | null;
  telegramUrl?: string | null;
  totalTicketsSold: number;
  events?: InfluencerEvent[];
  _count?: {
    events: number;
  };
}

export interface InfluencerEvent {
  id: string;
  title: string;
  slug: string;
  dateTime: string;
  status: string;
  competition?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  ticketPrice: number;
  currency: string;
  ticketsSold: number;
  maxCapacity: number;
  expectedAmount?: number | null;
  venue?: string | null;
  venueMapUrl?: string | null;
  city?: string | null;
  description?: string | null;
  coverImage?: string | null;
  matchKickoff?: string | null;
  paymentInstructions?: string | null;
  paymentAccounts?: { type: string; number: string; name?: string }[] | null;
}

export interface EventWithStats extends InfluencerEvent {
  stats: EventStats;
  influencer: {
    id: string;
    name: string;
    slug: string;
    profilePhoto: string | null;
    teamColor: string | null;
    isVerified: boolean;
    teamSupported: string | null;
  };
}

export interface EventWithInfluencer extends InfluencerEvent {
  influencer?: Influencer;
}

export interface SessionUser {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  organizerId?: string;
}
