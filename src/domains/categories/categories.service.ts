import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const check = await this.categoryRepository.findOne({
      where: {
        name: createCategoryDto.name,
      },
    });

    if (check) {
      throw new BadRequestException('Category exits');
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  findAll() {
    return this.categoryRepository.find({
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async getPage(page: number, pageSize: number) {
    const total = await this.categoryRepository.count({});
    const items = await this.categoryRepository.find({
      order: {
        createdAt: 'ASC',
      },
      skip: page * pageSize,
      take: pageSize,
    });
    return { total, items };
  }

  findOne(id: number): Promise<Category | null> {
    return this.categoryRepository.findOne({
      where: {
        id,
      },
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOne({
      where: {
        id,
      },
    });
    const checkName = await this.categoryRepository
      .createQueryBuilder()
      .where('lower(name) like :categoryName', {
        categoryName: updateCategoryDto.name?.toLowerCase(),
      })
      .andWhere('id != :updateId', { updateId: id })
      .getOne();

    if (checkName) {
      throw new BadRequestException(
        `Category with name ${updateCategoryDto.name} existed`,
      );
    }
    if (!category) {
      throw new BadRequestException('Category not found');
    }
    this.categoryRepository.merge(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(data: { ids: number[] }) {
    const categories = await this.categoryRepository.find({
      where: {
        id: In(data.ids),
      },
    });
    if (data.ids.some((id) => !categories.map((c) => c.id).includes(id))) {
      throw new BadRequestException('Some category id not exist');
    }

    await this.categoryRepository.delete({
      id: In(data.ids),
    });

    return 'delete success';
  }
}
