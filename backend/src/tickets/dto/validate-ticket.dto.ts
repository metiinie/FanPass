import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class ValidateTicketDto {
  @IsUUID()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
