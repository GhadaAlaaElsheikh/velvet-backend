import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Review,
  ReviewSchema,
} from './schemas/review.schema';

 
import { ReviewService } from './review.service';
import { Product, ProductSchema } from 'src/products/schemas/product.schema';
import { Order, OrderSchema } from 'src/orders/schemas/order.schema';
import { ReviewController } from './review.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Review.name,
        schema: ReviewSchema,
      },

      {
        name: Product.name,
        schema: ProductSchema,
      },

      {
        name: Order.name,
        schema: OrderSchema,
      },
    ]),
  ],
  
controllers:[ReviewController],
  providers: [ReviewService],

  exports: [ReviewService],
})
export class ReviewModule {}