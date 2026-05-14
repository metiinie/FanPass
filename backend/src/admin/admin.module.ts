import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [PrismaModule, NotificationsModule, TicketsModule],
  controllers: [AdminController],
})
export class AdminModule {}
