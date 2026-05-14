import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class SubmitTicketDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  buyerPhone: string;

  @IsString()
  @IsNotEmpty()
  buyerName: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  ticketCount?: number;

  @IsString()
  @IsNotEmpty()
  screenshotBase64: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsString()
  @IsOptional()
  note?: string;
}
