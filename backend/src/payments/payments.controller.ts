import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook/telebirr')
  @HttpCode(HttpStatus.OK)
  async telebirrWebhook(@Body() payload: any) {
    const result = await this.paymentsService.handleTelebirrWebhook(payload);
    if (result.alreadyProcessed) return { code: '200', message: 'Success' };
    return { code: '200', message: 'Success' };
  }

  @Post('simulate-success')
  async simulate(@Body('transactionId') transactionId: string) {
    return this.paymentsService.simulateSuccess(transactionId);
  }
}
