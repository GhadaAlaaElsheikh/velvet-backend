
import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Get products and calculate their prices
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
          ["perfumes", "luxury perfumes"].includes(
            categoryName || "",
          ) &&
          item.size.replace(/\s/g, "").toLowerCase() === "60ml";

        let giftBagSelections: {
          product: any;
          size: string;
          type: string;
          scent?: string;
        }[] = [];

        // Validate Gift Bag selections
        if (product.isGiftBag) {
          const selections = item.giftBagSelections;

          if (!selections || selections.length !== 5) {
            throw new BadRequestException(
              "Gift Bag must contain 1 bakhoor, 1 candle, and 3 perfumes",
            );
          }

          const bakhoorSelections = selections.filter(
            (selection) => selection.type === "bakhoor",
          );

          const candleSelections = selections.filter(
            (selection) => selection.type === "candle",
          );

          const perfumeSelections = selections.filter(
            (selection) => selection.type === "perfume",
          );

          if (
            bakhoorSelections.length !== 1 ||
            candleSelections.length !== 1 ||
            perfumeSelections.length !== 3
          ) {
            throw new BadRequestException(
              "Gift Bag must contain exactly 1 bakhoor, 1 candle, and 3 perfumes",
            );
          }

          giftBagSelections = await Promise.all(
            selections.map(async (selection) => {
              const selectedProduct =
                await this.productModel.findById(selection.product);

              if (!selectedProduct) {
                throw new NotFoundException(
                  `Selected product not found: ${selection.product}`,
                );
              }

              const selectedCategory =
                await this.categoryModel.findById(
                  selectedProduct.category,
                );

              const selectedCategoryName =
                selectedCategory?.name.trim().toLowerCase();

              let requiredSize = "";

              if (selection.type === "bakhoor") {
                requiredSize = "30gm";

                if (
                  !["bakhoor", "bukhoor"].includes(
                    selectedCategoryName || "",
                  )
                ) {
                  throw new BadRequestException(
                    `${selectedProduct.name} is not a bakhoor`,
                  );
                }

                if (!selection.scent?.trim()) {
                  throw new BadRequestException(
                    "Please select a scent for the bakhoor",
                  );
                }
              } else if (selection.type === "candle") {
                requiredSize = "25gm";

                if (
                  !["candles", "candle"].includes(
                    selectedCategoryName || "",
                  )
                ) {
                  throw new BadRequestException(
                    `${selectedProduct.name} is not a candle`,
                  );
                }
              } else if (selection.type === "perfume") {
                requiredSize = "10ml";

                if (
                  !["perfumes", "luxury perfumes"].includes(
                    selectedCategoryName || "",
                  )
                ) {
                  throw new BadRequestException(
                    `${selectedProduct.name} is not an eligible perfume`,
                  );
                }
              } else {
                throw new BadRequestException(
                  "Invalid Gift Bag selection type",
                );
              }

              const normalizedSelectionSize = selection.size
                .replace(/\s/g, "")
                .toLowerCase();

              if (normalizedSelectionSize !== requiredSize) {
                throw new BadRequestException(
                  `${selectedProduct.name} must be selected in ${requiredSize} size`,
                );
              }

              const selectedSize = selectedProduct.sizes?.find(
                (size) =>
                  size.name.replace(/\s/g, "").toLowerCase() ===
                  requiredSize,
              );

              if (!selectedSize) {
                throw new BadRequestException(
                  `${selectedProduct.name} does not have size ${requiredSize}`,
                );
              }

              return {
                product: selectedProduct._id,
                size: requiredSize,
                type: selection.type,
                ...(selection.type === "bakhoor"
                  ? { scent: selection.scent!.trim() }
                  : {}),
              };
            }),
          );
        } else if (
          item.giftBagSelections &&
          item.giftBagSelections.length > 0
        ) {
          throw new BadRequestException(
            "Gift Bag selections are only allowed for Gift Bag",
          );
        }

        return {
          product,
          quantity: item.quantity,
          size: item.size,
          scent: item.scent,
          originalPrice,
          isEligibleForBundle,
          categoryName,
          isGiftBag: product.isGiftBag,
          giftBagSelections,
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

    const calculatedItems: any[] = [];

    for (const item of productsData) {
      // Gift Bag has a fixed price of 300 EGP
      if (item.isGiftBag) {
        calculatedItems.push({
          product: item.product._id,
          quantity: item.quantity,
          size: item.size,
          price: 300,
          scent: item.scent,
          giftBagSelections: item.giftBagSelections,
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

      const remainingQuantity =
        item.quantity - bundleQuantity;

      if (bundleQuantity > 0) {
        calculatedItems.push({
          product: item.product._id,
          quantity: bundleQuantity,
          size: item.size,
          price: 200,
          scent: item.scent,
          giftBagSelections: [],
        });
      }

      if (remainingQuantity > 0) {
        let discountRate = 0;

        if (
          ["perfumes", "luxury perfumes"].includes(
            item.categoryName || "",
          )
        ) {
          discountRate = 0.20;
        } else if (
          ["bukhoor", "bakhoor"].includes(
            item.categoryName || "",
          )
        ) {
          discountRate = 0.20;
        } else if (
          ["candles", "candle"].includes(
            item.categoryName || "",
          )
        ) {
          discountRate = 0.30;
        }

        const finalPrice = Number(
          (item.originalPrice * (1 - discountRate)).toFixed(2),
        );

        calculatedItems.push({
          product: item.product._id,
          quantity: remainingQuantity,
          size: item.size,
          price: finalPrice,
          scent: item.scent,
          giftBagSelections: [],
        });
      }
    }

    const subtotal = calculatedItems.reduce(
      (total, item) =>
        total + item.price * item.quantity,
      0,
    );

    const totalPrice = subtotal + shippingPrice;

    // Create order
    const order = await this.orderModel.create({
      user: userId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      country: body.country,
      city: body.city,
      address: body.address,
      items: calculatedItems,
      shippingPrice,
      totalPrice,
    });

    // Populate order products and Gift Bag selections
    const populatedOrder = await this.orderModel
      .findById(order._id)
      .populate("items.product")
      .populate("items.giftBagSelections.product");

    if (!populatedOrder) {
      throw new NotFoundException("Order not found");
    }

    const itemsText = (populatedOrder.items as any[])
      .map((item) => {
        const product = item.product;

        let text = `🛍️ ${product?.name || "Unknown Product"} × ${item.quantity} — ${
          item.price * item.quantity
        } EGP`;

        if (item.scent) {
          text += `\n🌸 Scent: ${item.scent}`;
        }

        if (
          item.giftBagSelections &&
          item.giftBagSelections.length > 0
        ) {
          const selectedItems = item.giftBagSelections
            .map((selection: any, index: number) => {
              const selectedProduct = selection.product;

              let selectionText =
                `${index + 1}. ${selectedProduct?.name || "Unknown Product"}` +
                ` (${selection.type}) (${selection.size})`;

              if (selection.scent) {
                selectionText += ` - Scent: ${selection.scent}`;
              }

              return selectionText;
            })
            .join("\n");

          text += `\n🎁 Gift Bag selections:\n${selectedItems}`;
        }

        return text;
      })
      .join("\n\n");

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
      .populate("items.giftBagSelections.product")
      .sort({ createdAt: -1 });
  }

  // Get Orders By User
  async findByUser(userId: string) {
    return this.orderModel
      .find({ user: userId })
      .populate("items.product")
      .populate("items.giftBagSelections.product")
      .sort({ createdAt: -1 });
  }

  // Get One Order
  async findOne(id: string) {
    const order = await this.orderModel
      .findById(id)
      .populate("user")
      .populate("items.product")
      .populate("items.giftBagSelections.product");

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
      { new: true },
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
