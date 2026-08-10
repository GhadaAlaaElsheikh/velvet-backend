import {
  IsIn,
  IsMongoId,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class ProductQueryDto {
  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @IsIn(['men', 'women', 'unisex'])
  gender?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @IsOptional()
  @IsNumberString()
  maxPrice?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
  
  @IsOptional()
@IsString()
badge?: string;
}