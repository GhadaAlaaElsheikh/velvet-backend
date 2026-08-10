 import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Product } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async create(body: CreateProductDto) {
    const exists = await this.productModel.findOne({
      name: body.images,
    });

    if (exists) {
      throw new ConflictException(
        'Product already exists',
      );
    }

    return this.productModel.create(body);
  }

  async findAll(query: ProductQueryDto) {
    const {
      category,
      gender,
      search,
      badge,
      minPrice,
      maxPrice,
      sort,
      page = '1',
      limit = '9',
    } = query;

    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    if (gender) {
      filter.gender = gender;
    }

    if (badge) {
      filter.badge = badge;
    }

    if (search) {
      filter.name = {
        $regex: search,
        $options: 'i',
      };
    }

    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    const skip =
      (Number(page) - 1) * Number(limit);

    const products = await this.productModel
      .find(filter)
      .populate('category')
      .sort(sort || '-createdAt')
      .skip(skip)
      .limit(Number(limit));

  
    const total =
      await this.productModel.countDocuments(filter);

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      products,
    };
  }

  async findOne(id: string) {
    const product = await this.productModel
      .findById(id)
      .populate('category');

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    return product;
  }

  async update(
  id: string,
  body: UpdateProductDto,
) {
  const product =
    await this.productModel.findByIdAndUpdate(
      id,
      body,
      {
        returnDocument: 'after',
      },
    );

  if (!product) {
    throw new NotFoundException(
      'Product not found',
    );
  }

  return product;
}

  async remove(id: string) {
    const product =
      await this.productModel.findByIdAndDelete(id);

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    return {
      message: 'Product deleted successfully',
    };
  }
}