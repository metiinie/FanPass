import { IsString, IsNotEmpty } from 'class-validator';

export class RejectTicketDto {
  @IsString()
  @IsNotEmpty()
  reason: string; // "Wrong amount" | "Duplicate submission" | "Fake receipt" | "Other"
}
