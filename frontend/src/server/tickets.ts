import jwt from "jsonwebtoken";
import QRCode from "qrcode";

const TICKET_JWT_SECRET = process.env.TICKET_JWT_SECRET || "dev-secret-change-me-32-chars-min";

interface TicketJWTPayload {
  ticketId: string;
  eventId: string;
  iat: number;
}

/**
 * Sign a JWT for a ticket QR code.
 * Payload: { ticketId, eventId, iat }
 * No expiry — tickets are invalidated by scan status, not time.
 */
export function signTicketToken(ticketId: string, eventId: string): string {
  const payload: TicketJWTPayload = {
    ticketId,
    eventId,
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(payload, TICKET_JWT_SECRET, { algorithm: "HS256" });
}

/**
 * Verify and decode a ticket JWT.
 * Returns null if signature is invalid.
 */
export function verifyTicketToken(token: string): TicketJWTPayload | null {
  try {
    const decoded = jwt.verify(token, TICKET_JWT_SECRET, {
      algorithms: ["HS256"],
    }) as TicketJWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Generate a QR code as a data URL (base64 PNG).
 */
export async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 512,
    margin: 2,
    color: {
      dark: "#111827",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generate a QR code as an SVG string.
 */
export async function generateQRCodeSVG(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: "svg",
    width: 512,
    margin: 2,
    color: {
      dark: "#111827",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}
