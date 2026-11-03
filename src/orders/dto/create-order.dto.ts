
import {
  IsArray,
  IsEmail,
  IsMongoId,
  IsNumber,
  IsString,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  IsIn,
} from "class-validator";

import { Type } from "class-transformer";

class GiftBagSelectionDto {
  @IsMongoId()
  product: string;

  @IsString()
  size: string;

  @IsIn(["bakhoor", "candle", "perfume"])
  type: string;

  @IsOptional()
  @IsString()
  scent?: string;
}
class OrderItemDto {
  @IsMongoId()
  product: string;

  @IsNumber()
  quantity: number;

  @IsString()
  size: string;

    @IsOptional()
  @IsString()
  scent?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => GiftBagSelectionDto)
  giftBagSelections?: GiftBagSelectionDto[];
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  country: string;

  @IsString()
  city: string;

  @IsString()
  address: string;
}
