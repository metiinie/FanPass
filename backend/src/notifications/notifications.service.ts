import { Injectable, Logger } from '@nestjs/common';
import * as AfricasTalking from 'africastalking';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private sms: any;

  constructor() {
    const apiKey = process.env.AT_API_KEY;
    const username = process.env.AT_USERNAME;

    if (apiKey && username) {
      const at = AfricasTalking({ apiKey, username });
      this.sms = at.SMS;
    } else {
      this.logger.warn('Africa\'s Talking credentials missing. SMS will be simulated.');
    }
  }

  async sendSms(phone: string, message: string) {
    if (!this.sms) {
      this.logger.log(`[SMS Simulation] Sending to ${phone}: ${message}`);
      return { success: true, simulated: true };
    }

    try {
      const result = await this.sms.send({
        to: [phone],
        message: message,
        from: process.env.AT_SENDER_ID || undefined,
      });
      this.logger.log(`SMS sent to ${phone}: ${JSON.stringify(result)}`);
      return { success: true, result };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async sendTicketSms(phone: string, ticketUrl: string) {
    const message = `Your FanPass ticket is ready! View it here: ${ticketUrl}`;
    return this.sendSms(phone, message);
  }

  // ─── NEW: Approval SMS ─────────────────────────────────────────

  async sendApprovalSms(phone: string, eventTitle: string, ticketUrl: string) {
    const message = `✅ Your ticket for "${eventTitle}" is ready! View your QR ticket here: ${ticketUrl}`;
    return this.sendSms(phone, message);
  }

  // ─── NEW: Rejection SMS ────────────────────────────────────────

  async sendRejectionSms(phone: string, eventTitle: string, reason: string, organizerContact: string) {
    const message = `❌ Your payment for "${eventTitle}" could not be verified. Reason: ${reason}. Contact: ${organizerContact}`;
    return this.sendSms(phone, message);
  }

  // ─── NEW: Organizer notification SMS ───────────────────────────

  async sendOrganizerNotificationSms(
    organizerPhone: string,
    eventTitle: string,
    fanName: string,
    fanPhoneLast4: string,
    aiConfidence: number,
    flagsText: string,
    eventId: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const message = `FanPass: New ticket submission for "${eventTitle}". Fan: ${fanName} (***${fanPhoneLast4}). AI confidence: ${aiConfidence}%.${flagsText}\nReview: ${frontendUrl}/dashboard/events/${eventId}/approvals`;
    return this.sendSms(organizerPhone, message);
  }
}
