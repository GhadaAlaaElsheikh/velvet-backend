import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  timestamps: true,
})
export class Product {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
  })
  description: string;

  @Prop({
    required: true,
    min: 0,
  })
  price: number;
 
  @Prop({
    type: [String],
    default: [],
  })
  images: string[];

  @Prop({
    type: String,
    default: '',
  })
  detailsImage: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Types.ObjectId;

  @Prop({
    enum: ['men', 'women', 'unisex'],
    default: 'unisex',
  })
  gender: string;

  @Prop({
    default: 5,
    min: 0,
    max: 5,
  })
  rating: number;

  @Prop({
    default: '',
  })
  badge: string;

  @Prop({
    default: 0,
    min: 0,
  })
  stock: number;

  @Prop({
    default: 0,
    min: 0,
  })
  reviews: number;

  @Prop({
    default: '',
  })
  burnType: string;

  @Prop({
    type: [
      {
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    default: [],
  })
  sizes: {
    name: string;
    price: number;
  }[];
}
 
export const ProductSchema =
  SchemaFactory.createForClass(Product);