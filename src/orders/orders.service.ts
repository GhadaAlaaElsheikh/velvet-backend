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
import { Product } from "src/products/schemas/product.schema";
import { Category } from "src/categories/schemas/category.schema";
 
@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
     @InjectModel(User.name)
  private readonly userModel: Model<User>,
   @InjectModel(Product.name)
private readonly productModel: Model<Product>,
@InjectModel(Category.name)
private readonly categoryModel: Model<Category>,
) {}


// Create Order
async create(body: CreateOrderDto, userId: string) {
  const shippingPrice = 40;

  // Get user
  const user = await this.userModel.findById(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  // Calculate subtotal
/*  const subtotal = body.items.reduce(
    (total, item) => {
      return total + item.price * item.quantity;
    },
    0,
  );
*/
// Calculate products prices from database
  
  // Get products and calculate their original prices
const productsData = await Promise.all(
  body.items.map(async (item) => {
    const product = await this.productModel.findById(item.product);

    if (!product) {
      throw new NotFoundException(
        `Product not found: ${item.product}`,
      );
    }

    let originalPrice = product.price;

    if (product.sizes && product.sizes.length > 0) {
      const selectedSize = product.sizes.find(
        (size) =>
          size.name.trim().toLowerCase() ===
          item.size.trim().toLowerCase(),
      );

      if (!selectedSize) {
        throw new NotFoundException(
          `Size ${item.size} not found for ${product.name}`,
        );
      }

      originalPrice = selectedSize.price;
    }

    const category = await this.categoryModel.findById(
      product.category,
    );

const categoryName = category?.name.trim().toLowerCase();

const isEligibleForBundle =
  ["perfumes", "luxury perfumes"].includes(categoryName || "") &&
  item.size.replace(/\s/g, "").toLowerCase() === "60ml";
    return {
      product,
      quantity: item.quantity,
      size: item.size,
      originalPrice,
      isEligibleForBundle,
       isGiftBag: product.isGiftBag,
    };
  }),
);

// Count eligible 60ml perfume units
const totalEligibleUnits = productsData.reduce(
  (total, item) =>
    total + (item.isEligibleForBundle ? item.quantity : 0),
  0,
);

// Every complete group of five costs 1000 EGP
let bundleUnitsRemaining =
  Math.floor(totalEligibleUnits / 5) * 5;

const calculatedItems: {
  product: any;
  quantity: number;
  size: string;
  price: number;
}[] = [];

for (const item of productsData) {
  if (item.isGiftBag) {
    calculatedItems.push({
      product: item.product._id,
      quantity: item.quantity,
      size: item.size,
      price: 300,
    });

    continue;
  }
  let bundleQuantity = 0;

  if (item.isEligibleForBundle) {
    bundleQuantity = Math.min(
      item.quantity,
      bundleUnitsRemaining,
    );

    bundleUnitsRemaining -= bundleQuantity;
  }

  const remainingQuantity = item.quantity - bundleQuantity;

  if (bundleQuantity > 0) {
    calculatedItems.push({
      product: item.product._id,
      quantity: bundleQuantity,
      size: item.size,
      price: 200,
    });
  }

  if (remainingQuantity > 0) {
    calculatedItems.push({
      product: item.product._id,
      quantity: remainingQuantity,
      size: item.size,
      price: Number(
        (item.originalPrice * 0.8).toFixed(2),
      ),
    });
  }
}

const subtotal = calculatedItems.reduce(
  (total, item) => total + item.price * item.quantity,
  0,
);

const totalPrice = subtotal + shippingPrice;
 
//  const totalPrice = subtotal + shippingPrice;

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
    //items: body.items,
items: calculatedItems,
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