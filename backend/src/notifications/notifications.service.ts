import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendTicketSms(phone: string, ticketUrl: string) {
    const message = `Your FanPass ticket is ready! View it here: ${ticketUrl}`;
    
    // Simulation mode
    this.logger.log(`[SMS Simulation] Sending to ${phone}: ${message}`);
    
    // Real implementation skeleton for Africa's Talking
    /*
    const AfricasTalking = require('africastalking')({
      apiKey: process.env.AT_API_KEY,
      username: process.env.AT_USERNAME,
    });
    const sms = AfricasTalking.SMS;
    await sms.send({ to: [phone], message });
    */

    return { success: true };
  }
}
