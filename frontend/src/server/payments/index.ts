/**
 * Payment Provider Factory
 * Design: adding a new provider = adding a new file with same interface.
 */

export interface PaymentProvider {
  initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  verifyWebhook(payload: unknown, signature: string): boolean;
}

export interface InitiatePaymentParams {
  eventId: string;
  ticketId: string;
  transactionId: string;
  amount: number;
  currency: string;
  buyerPhone: string;
  returnUrl: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  paymentUrl?: string;
  providerRef?: string;
  error?: string;
}

const providers: Record<string, () => Promise<PaymentProvider>> = {
  TELEBIRR: async () => {
    const mod = await import("./telebirr");
    return mod.default;
  },
};

export async function getPaymentProvider(name: string): Promise<PaymentProvider> {
  const loader = providers[name.toUpperCase()];
  if (!loader) {
    throw new Error(`Payment provider "${name}" not found. Available: ${Object.keys(providers).join(", ")}`);
  }
  return loader();
}
