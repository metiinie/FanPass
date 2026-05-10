import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsDateString, Min } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  venue: string;

  @IsString()
  @IsOptional()
  venueMapUrl?: string;

  @IsDateString()
  @IsNotEmpty()
  dateTime: string;

  @IsNumber()
  @Min(0)
  ticketPrice: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @Min(1)
  maxCapacity: number;

  @IsArray()
  @IsString({ each: true })
  paymentMethods: string[];

  // Match-specific fields (all optional)
  @IsString()
  @IsOptional()
  homeTeam?: string;

  @IsString()
  @IsOptional()
  awayTeam?: string;

  @IsString()
  @IsOptional()
  competition?: string;

  @IsDateString()
  @IsOptional()
  matchKickoff?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsOptional()
  city?: string;
}
