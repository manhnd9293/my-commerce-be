import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { ProductColor } from './entities/product-color.entity';
import { ProductSize } from './entities/product-size.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { UserAuth } from '../auth/jwt.strategy';
import { Category } from '../categories/entities/category.entity';
import { Transactional } from 'typeorm-transactional';
import {
  DEFAULT_COLOR,
  DEFAULT_COLOR_CODE,
  DEFAULT_SIZE,
} from '../../utils/constants/constant';
import { FileStorageService } from '../common/file-storage.service';
import { StorageTopLevelFolder } from '../../utils/enums/storage-to-level-folder';
import { v4 as uuidv4 } from 'uuid';
import { ProductImage } from './entities/product-image.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductColor)
    private readonly productColorRepository: Repository<ProductColor>,
    @InjectRepository(ProductSize)
    private readonly productSizeRepository: Repository<ProductSize>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  @Transactional()
  async create(createProductDto: CreateProductDto, user: UserAuth) {
    const category = await this.categoryRepository.findOne({
      where: {
        id: createProductDto.categoryId,
      },
    });
    if (!category) {
      throw new BadRequestException("Product's category not exist)");
    }

    const product = this.productRepository.create({
      categoryId: Number(createProductDto.categoryId),
      name: createProductDto.name,
      description: createProductDto.description,
      createdById: user.userId,
    });
    const newProduct = await this.productRepository.save(product);

    const productColors = (
      createProductDto.productColors || [
        { name: DEFAULT_COLOR, code: DEFAULT_COLOR_CODE },
      ]
    ).map((pc) => {
      const productColor = this.productColorRepository.create(pc);
      productColor.productId = newProduct.id;
      return productColor;
    });
    const newColors = await this.productColorRepository.save(productColors);

    const productSizes = (
      createProductDto.productSizes || [{ name: DEFAULT_SIZE }]
    ).map((ps) => {
      const productSize = this.productSizeRepository.create(ps);
      productSize.productId = newProduct.id;
      return productSize;
    });
    const newSizes = await this.productSizeRepository.save(productSizes);

    const variants = [];
    for (const color of newColors) {
      for (const size of newSizes) {
        const productVariant = this.productVariantRepository.create();
        productVariant.productColorId = color.id;
        productVariant.productSizeId = size.id;
        productVariant.productId = newProduct.id;
        variants.push(productVariant);
      }
    }

    await this.productVariantRepository.save(variants);

    return this.productRepository.findOne({
      where: {
        id: newProduct.id,
      },
      relations: {
        productColors: true,
        productSizes: true,
        productVariants: true,
        category: true,
      },
    });
  }

  findAll() {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.productSizes', 'productSizes')
      .leftJoinAndSelect('product.productColors', 'productColors')
      .leftJoinAndSelect('product.category', 'category')
      .getMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async updateImages(
    id: number,
    productImageFiles: Array<Express.Multer.File>,
    user: UserAuth,
  ) {
    const updateProduct = await this.productRepository.findOne({
      where: {
        id,
      },
    });
    if (!updateProduct) {
      throw new BadRequestException('Update product not found');
    }

    const assets = await Promise.all(
      productImageFiles.map(async (file) => {
        return await this.fileStorageService.saveFile(
          file,
          StorageTopLevelFolder.Products,
          `${uuidv4()}.${file.mimetype}`,
        );
      }),
    );

    const productImageEntities = assets
      .map((asset) => {
        return this.productImageRepository.create({
          productId: updateProduct.id,
          assetId: asset.id,
          createdById: user.userId,
        });
      })
      .reduce((acc, cur) => {
        return acc.concat(cur);
      }, []);
    await this.productImageRepository.save(productImageEntities);

    return 'update success';
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
