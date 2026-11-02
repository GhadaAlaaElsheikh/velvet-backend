import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

import {
  Order,
  OrderSchema,
} from './schemas/order.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { Product, ProductSchema } from 'src/products/schemas/product.schema';
import { Category, CategorySchema } from 'src/categories/schemas/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
      },
       {
        name: User.name,
        schema: UserSchema,
      },
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}