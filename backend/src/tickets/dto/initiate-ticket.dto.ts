import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class InitiateTicketDto {
  @IsUUID()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  buyerPhone: string;

  @IsString()
  @IsOptional()
  buyerName?: string;

  @IsString()
  @IsNotEmpty()
  provider: string;
}
