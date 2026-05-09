/**
 * Telebirr STB Payment Integration
 * Currently in SIMULATION MODE — real API calls require credentials.
 */

import crypto from "crypto";
import type { PaymentProvider, InitiatePaymentParams, InitiatePaymentResult } from "./index";

const TELEBIRR_APP_ID = process.env.TELEBIRR_APP_ID || "";
const TELEBIRR_APP_KEY = process.env.TELEBIRR_APP_KEY || "";
const TELEBIRR_SECRET = process.env.TELEBIRR_SECRET || "";
const TELEBIRR_SHORT_CODE = process.env.TELEBIRR_SHORT_CODE || "";
const TELEBIRR_BASE_URL = process.env.TELEBIRR_BASE_URL || "https://api.telebirr.com";

const isSimulation = !TELEBIRR_APP_ID || !TELEBIRR_APP_KEY;

const telebirr: PaymentProvider = {
  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    if (isSimulation) {
      console.log("════════════════════════════════════════");
      console.log("💰 TELEBIRR SIMULATION (no credentials)");
      console.log(`   Amount: ${params.amount} ${params.currency}`);
      console.log(`   Buyer: ${params.buyerPhone}`);
      console.log(`   Ticket: ${params.ticketId}`);
      console.log("════════════════════════════════════════");

      const simulatedRef = `SIM_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return {
        success: true,
        paymentUrl: `${params.returnUrl}?simulated=true&ref=${simulatedRef}`,
        providerRef: simulatedRef,
      };
    }

    try {
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
      const nonce = crypto.randomBytes(16).toString("hex");

      const requestBody = {
        appId: TELEBIRR_APP_ID,
        appKey: TELEBIRR_APP_KEY,
        shortCode: TELEBIRR_SHORT_CODE,
        receiveName: "FanPass",
        subject: "Event Ticket Purchase",
        totalAmount: (params.amount / 100).toFixed(2),
        outTradeNo: params.transactionId,
        notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/telebirr`,
        returnUrl: params.returnUrl,
        timeoutExpress: "30",
        nonce,
        timestamp,
      };

      const sortedKeys = Object.keys(requestBody).sort();
      const signString = sortedKeys.map((k) => `${k}=${requestBody[k as keyof typeof requestBody]}`).join("&");
      const sign = crypto.createHash("sha256").update(signString + TELEBIRR_SECRET).digest("hex").toUpperCase();

      const response = await fetch(`${TELEBIRR_BASE_URL}/payment/stb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: TELEBIRR_APP_ID, sign, ussd: JSON.stringify(requestBody) }),
      });

      const result = await response.json();

      if (result.code === "200" || result.code === 200) {
        return {
          success: true,
          paymentUrl: result.data?.toPayUrl,
          providerRef: params.transactionId,
        };
      }

      return { success: false, error: result.message || "Telebirr payment initiation failed" };
    } catch (error) {
      console.error("[Telebirr] Payment initiation error:", error);
      return { success: false, error: "Failed to connect to Telebirr" };
    }
  },

  verifyWebhook(payload: unknown, signature: string): boolean {
    if (isSimulation) return true;

    try {
      const payloadString = typeof payload === "string" ? payload : JSON.stringify(payload);
      const expected = crypto.createHmac("sha256", TELEBIRR_SECRET).update(payloadString).digest("hex").toUpperCase();
      return expected === signature.toUpperCase();
    } catch {
      return false;
    }
  },
};

export default telebirr;
