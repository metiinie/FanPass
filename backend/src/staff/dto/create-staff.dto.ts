import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsUUID()
  @IsOptional()
  eventId?: string;
}
