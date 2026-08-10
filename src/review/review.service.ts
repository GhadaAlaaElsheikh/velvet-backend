 import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import {
  Review,
  ReviewDocument,
} from './schemas/review.schema';

  
import { CreateReviewDto } from './dto/create-review.dto';
import { Product, ProductDocument } from 'src/products/schemas/product.schema';
import { Order, OrderDocument } from 'src/orders/schemas/order.schema';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  async create(
    userId: string,
    createReviewDto: CreateReviewDto,
  ) {
    const {
      productId,
      rating,
      comment,
    } = createReviewDto;

    // 1️⃣ Check product
    const product =
      await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    // 2️⃣ Check if user already reviewed
    const existingReview =
      await this.reviewModel.findOne({
        user: userId,
        product: productId,
      });

    if (existingReview) {
      throw new ConflictException(
        'You already reviewed this product',
      );
    }

    // 3️⃣ Check if user bought the product
    const order =
      await this.orderModel.findOne({
        user: userId,
        status: 'delivered',
        'items.product': productId,
      });

    if (!order) {
      throw new BadRequestException(
        'You can review this product only after purchasing it',
      );
    }

    // 4️⃣ Create review
    const review =
      await this.reviewModel.create({
        user: new Types.ObjectId(userId),
        product: new Types.ObjectId(productId),
        rating,
        comment,
      });

    // 5️⃣ Calculate average rating
    const result =
      await this.reviewModel.aggregate([
        {
          $match: {
            product: new Types.ObjectId(productId),
          },
        },
        {
          $group: {
            _id: '$product',

            averageRating: {
              $avg: '$rating',
            },

            reviewsCount: {
              $sum: 1,
            },
          },
        },
      ]);

    const averageRating =
      result[0]?.averageRating ?? 0;

    const reviewsCount =
      result[0]?.reviewsCount ?? 0;

    // 6️⃣ Update product
    await this.productModel.findByIdAndUpdate(
      productId,
      {
        rating: Number(
          averageRating.toFixed(1),
        ),

        reviews: reviewsCount,
      },
    );

    return {
      message: 'Review added successfully',

      review,

      rating: Number(
        averageRating.toFixed(1),
      ),

      reviews: reviewsCount,
    };
  }

  async findByProduct(
    productId: string,
  ) {
    const reviews =
      await this.reviewModel
        .find({
          product: productId,
        })
        .populate(
          'user',
          'name image',
        )
        .sort({
          createdAt: -1,
        });

    return {
      reviews,
      count: reviews.length,
    };
  }
}