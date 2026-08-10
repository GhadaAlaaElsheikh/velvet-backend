import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Order } from "./schemas/order.schema";
import { CreateOrderDto } from "./dto/create-order.dto";
import { sendTelegramMessage } from "src/utils/telegram";
import { User } from "src/users/schemas/user.schema";
 
@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
     @InjectModel(User.name)
  private readonly userModel: Model<User>,
  ) {}


// Create Order
async create(body: CreateOrderDto, userId: string) {
  const shippingPrice = 35;

  // Get user
  const user = await this.userModel.findById(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  // Calculate subtotal
  const subtotal = body.items.reduce(
    (total, item) => {
      return total + item.price * item.quantity;
    },
    0,
  );

  const totalPrice = subtotal + shippingPrice;

  // Create order
  const order = await this.orderModel.create({
    user: userId,

    // Customer information
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,

    // Shipping address
    country: body.country,
    city: body.city,
    address: body.address,

    // Products
    items: body.items,

    // Prices
    shippingPrice,
    totalPrice,
  });

  // Get products names
  const populatedOrder = await this.orderModel
    .findById(order._id)
    .populate("items.product");

  if (!populatedOrder) {
    throw new NotFoundException("Order not found");
  }

  const itemsText = (populatedOrder.items as any[])
    .map((item) => {
      const product = item.product;

      return `🛍️ ${product?.name || "Unknown Product"} × ${
        item.quantity
      } — ${item.price * item.quantity} EGP`;
    })
    .join("\n");

  // Telegram message
  const message = `
🛍️ NEW VELVET ORDER

👤 Customer:
${body.firstName} ${body.lastName}

📧 Email:
${body.email}

📱 Phone:
${body.phone}

📍 Shipping Address:
Country: ${body.country}
City: ${body.city}
Address: ${body.address}

📦 Products:
${itemsText}

🚚 Shipping: ${shippingPrice} EGP

💵 Total: ${totalPrice} EGP

📌 Status: Pending
`;

  await sendTelegramMessage(message);

  return order;
}


  // Get All Orders
  async findAll() {
    return this.orderModel
      .find()
      .populate("user")
      .populate("items.product")
      .sort({ createdAt: -1 });
  }

  // Get Orders By User
  async findByUser(userId: string) {
    return this.orderModel
      .find({ user: userId })
      .populate("items.product")
      .sort({ createdAt: -1 });
  }

  // Get One Order
  async findOne(id: string) {
    const order = await this.orderModel
      .findById(id)
      .populate("user")
      .populate("items.product");

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  // Update Order Status
  async updateStatus(id: string, status: string) {
    const order = await this.orderModel.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
      },
    );

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  // Delete Order
  async remove(id: string) {
    const order = await this.orderModel.findByIdAndDelete(id);

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return {
      message: "Order deleted successfully",
    };
  }
}