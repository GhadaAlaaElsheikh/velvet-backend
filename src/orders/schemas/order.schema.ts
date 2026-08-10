
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderItem {
  @Prop({
    type: Types.ObjectId,
    ref: "Product",
    required: true,
  })
  product: Types.ObjectId;

  @Prop({
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    required: true,
    min: 0,
  })
  price: number;
}

export const OrderItemSchema =
  SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({
    type: Types.ObjectId,
    ref: "User",
    required: true,
  })
  user: Types.ObjectId;

  // Customer Information

  @Prop({
    required: true,
  })
  firstName: string;

  @Prop({
    required: true,
  })
  lastName: string;

  @Prop({
    required: true,
  })
  email: string;

  @Prop({
    required: true,
  })
  phone: string;

  // Shipping Address

  @Prop({
    required: true,
  })
  country: string;

  @Prop({
    required: true,
  })
  city: string;

  @Prop({
    required: true,
  })
  address: string;

  // Products

  @Prop({
    type: [OrderItemSchema],
    required: true,
  })
  items: OrderItem[];

  // Prices

  @Prop({
    required: true,
    default: 35,
  })
  shippingPrice: number;

  @Prop({
    required: true,
  })
  totalPrice: number;

  // Order Status

  @Prop({
    enum: [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ],
    default: "pending",
  })
  status: string;
}

export const OrderSchema =
  SchemaFactory.createForClass(Order);

