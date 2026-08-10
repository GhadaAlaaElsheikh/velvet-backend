import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Category } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) {}

  async create(body: CreateCategoryDto) {
    const exists = await this.categoryModel.findOne({
      name: body.name,
    });

    if (exists) {
      throw new ConflictException(
        'Category already exists',
      );
    }

    return this.categoryModel.create(body);
  }

  async findAll() {
    return this.categoryModel.find().sort({
      createdAt : -1
    });
  }

  async findOne(id: string) {
    const category =
      await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    return category;
  }

  async update(
    id: string,
    body: UpdateCategoryDto,
  ) {
    const category =
      await this.categoryModel.findByIdAndUpdate(
        id,
        body,
        {
          new: true,
        },
      );

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    return category;
  }

  async remove(id: string) {
    const category =
      await this.categoryModel.findByIdAndDelete(
        id,
      );

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    return {
      message: 'Category deleted successfully',
    };
  }
}