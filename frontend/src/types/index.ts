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
  paymentMethods: string[];
  slug: string;
  createdAt: string;
  organizerId: string;
}

export interface TicketDisplay {
  id: string;
  eventId: string;
  buyerPhone: string;
  buyerName: string | null;
  qrToken: string | null;
  status: string;
  issuedAt: string;
  scannedAt: string | null;
  event: {
    title: string;
    venue: string;
    dateTime: string;
    currency: string;
    ticketPrice: number;
  };
}

export interface ScanResult {
  result: "VALID" | "ALREADY_USED" | "INVALID" | "WRONG_EVENT" | "RETRYING";
  buyerName?: string | null;
  buyerPhone?: string;
  ticketId?: string;
}

export interface EventStats {
  ticketsSold: number;
  maxCapacity: number;
  totalRevenue: number;
  attendeesEntered: number;
  recentScans: ScanLogEntry[];
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

export interface SessionUser {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  organizerId?: string;
}
