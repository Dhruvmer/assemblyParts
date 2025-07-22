import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested, ArrayMinSize, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PartType } from '../schemas/part.schema';

class ConstituentDto {
  @IsString()
  id: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreatePartDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PartType)
  type: PartType;

  @ValidateNested({ each: true })
  @Type(() => ConstituentDto)
  @IsOptional()
  parts?: ConstituentDto[];
}
