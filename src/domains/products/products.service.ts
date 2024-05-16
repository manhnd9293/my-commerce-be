import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { ProductColor } from './entities/product-color.entity';
import { ProductSize } from './entities/product-size.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductVariantImage } from './entities/product-variant-image.entity';
import { UserAuth } from '../auth/jwt.strategy';
import { Category } from '../categories/entities/category.entity';
import { Transactional } from 'typeorm-transactional';

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
    @InjectRepository(ProductVariantImage)
    private readonly productVariantImageRepository: Repository<ProductVariantImage>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
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
      categoryId: createProductDto.categoryId,
      name: createProductDto.name,
      description: createProductDto.description,
      createdById: user.userId,
    });
    const newProduct = await this.productRepository.save(product);

    const productColors = createProductDto.productColors.map((pc) => {
      const productColor = this.productColorRepository.create(pc);
      productColor.productId = newProduct.id;
      return productColor;
    });
    const newColors = await this.productColorRepository.save(productColors);

    const productSizes = createProductDto.productSizes.map((ps) => {
      const productSize = this.productSizeRepository.create(ps);
      productSize.productId = newProduct.id;
      return productSize;
    });
    const newSizes = await this.productSizeRepository.save(productSizes);

    const variants = [];
    for (let color of newColors) {
      for (let size of newSizes) {
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
        // productColors: true,
        productSizes: true,
        productVariants: true,
        category: true,
      },
    });
  }

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
