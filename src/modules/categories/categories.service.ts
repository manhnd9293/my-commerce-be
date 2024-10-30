import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { In, Repository } from 'typeorm';
import { FileStorageService } from '../common/file-storage.service';
import { StorageTopLevelFolder } from '../../utils/enums/storage-to-level-folder';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly fileStorageService: FileStorageService,
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

  async findAll() {
    const categories = await this.categoryRepository.find({
      order: {
        createdAt: 'ASC',
      },
      relations: {
        imageFile: true,
      },
    });
    for (const category of categories) {
      category.imageFileUrl = await this.fileStorageService.createPresignedUrl(
        category.imageFileId,
      );
    }

    return categories;
  }

  async findOne(id: number): Promise<Category | null> {
    const category = await this.categoryRepository.findOne({
      where: {
        id,
      },
      relations: {
        imageFile: true,
      },
    });
    if (category.imageFile) {
      category.imageFileUrl = await this.fileStorageService.createPresignedUrl(
        category.imageFileId,
      );
    }
    return category;
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    imageFile: Express.Multer.File,
  ) {
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
    if (imageFile) {
      const asset = await this.fileStorageService.saveFile(
        imageFile,
        StorageTopLevelFolder.Categories,
        `${id}/${imageFile.originalname}`,
      );
      category.imageFileId = asset.id;
    }
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
