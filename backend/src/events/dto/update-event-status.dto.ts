import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateEventStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}
