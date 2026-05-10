import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketsService: TicketsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handlePaymentTimeouts() {
    const timeoutThreshold = new Date();
    timeoutThreshold.setMinutes(timeoutThreshold.getMinutes() - 30);

    const expiredTickets = await this.prisma.ticket.findMany({
      where: {
        status: 'PENDING',
        issuedAt: { lt: timeoutThreshold },
      },
    });

    if (expiredTickets.length === 0) return;

    this.logger.log(`Expiring ${expiredTickets.length} pending tickets...`);

    for (const ticket of expiredTickets) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Update ticket to EXPIRED
          await tx.ticket.update({
            where: { id: ticket.id },
            data: { status: 'EXPIRED' },
          });

          // Update associated pending transactions to FAILED
          await tx.transaction.updateMany({
            where: { ticketId: ticket.id, status: 'PENDING' },
            data: { status: 'FAILED' },
          });

          // Release capacity
          await tx.event.update({
            where: { id: ticket.eventId },
            data: { ticketsSold: { decrement: 1 } },
          });
        });
      } catch (error) {
        this.logger.error(`Failed to expire ticket ${ticket.id}:`, error);
      }
    }
  }

  // Simulation of Telebirr Webhook Verification
  verifyTelebirrSignature(ussd: string, sign: string): boolean {
    return true; 
  }

  async handleTelebirrWebhook(payload: any) {
    const { ussd, sign } = payload;

    if (!this.verifyTelebirrSignature(ussd, sign)) {
      throw new BadRequestException('Invalid signature');
    }

    let ussdData;
    try {
      ussdData = typeof ussd === 'string' ? JSON.parse(ussd) : ussd;
    } catch {
      throw new BadRequestException('Invalid USSD payload');
    }

    const transactionId = ussdData.outTradeNo;
    const tradeStatus = ussdData.tradeStatus;

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { ticket: { include: { event: true } } },
      });

      if (!transaction) throw new Error('Transaction not found');
      if (transaction.status === 'CONFIRMED') return { alreadyProcessed: true };

      if (tradeStatus !== 'COMPLETED') {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: 'FAILED' },
        });
        await tx.event.update({
          where: { id: transaction.ticket.eventId },
          data: { ticketsSold: { decrement: 1 } },
        });
        return { success: false };
      }

      // Mark confirmed
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'CONFIRMED',
          verifiedAt: new Date(),
          webhookPayload: payload,
        },
      });

      // Update ticket to PAID and generate QR Token
      const qrToken = this.ticketsService.signTicketToken(transaction.ticketId, transaction.ticket.eventId);
      
      await tx.ticket.update({
        where: { id: transaction.ticketId },
        data: { 
          status: 'ISSUED',
          qrToken 
        },
      });

      // Increment totalTicketsSold on the Influencer
      await tx.influencer.update({
        where: { id: transaction.ticket.event.organizerId },
        data: { totalTicketsSold: { increment: 1 } },
      });

      return { 
        success: true, 
        ticketId: transaction.ticketId, 
        buyerPhone: transaction.ticket.buyerPhone 
      };
    });

    if (result.success && result.ticketId && result.buyerPhone) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const ticketUrl = `${frontendUrl}/tickets/${result.ticketId}`;
      
      this.notificationsService.sendTicketSms(result.buyerPhone, ticketUrl).catch((err) => {
        this.logger.error(`Failed to send SMS for ticket ${result.ticketId}: ${err.message}`);
      });
    }

    return result;
  }

  async simulateSuccess(transactionId: string) {
    return this.handleTelebirrWebhook({
      ussd: JSON.stringify({ outTradeNo: transactionId, tradeStatus: 'COMPLETED' }),
      sign: 'simulated-signature',
    });
  }
}
