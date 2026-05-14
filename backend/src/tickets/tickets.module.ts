import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { ReceiptsModule } from '../receipts/receipts.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ReceiptsModule, NotificationsModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
