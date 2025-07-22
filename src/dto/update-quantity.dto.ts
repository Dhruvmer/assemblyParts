import { IsNumber, Min } from 'class-validator';

export class UpdateQuantityDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}
