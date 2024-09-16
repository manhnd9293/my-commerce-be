import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { In, Repository } from 'typeorm';
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
import { use } from 'passport';

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

  async findAll() {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.productSizes', 'productSizes')
      .leftJoinAndSelect('product.productColors', 'productColors')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.productImages', 'productImages')
      .leftJoinAndSelect('productImages.asset', 'asset')
      .getMany();

    for (const product of products) {
      for (const image of product.productImages) {
        image.asset.preSignUrl =
          await this.fileStorageService.createPresignedUrl(image.assetId);
      }
    }
    return products;
  }

  async findOne(id: number) {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .andWhere('product.id = :productId', { productId: id })
      .leftJoinAndSelect('product.productSizes', 'productSizes')
      .leftJoinAndSelect('product.productColors', 'productColors')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.productImages', 'productImages')
      .leftJoinAndSelect('productImages.asset', 'asset')
      .leftJoinAndSelect('product.productVariants', 'productVariants')
      .getOne();

    if (!product) {
      throw new BadRequestException('Product not found');
    }
    if (product.productImages) {
      for (const productImage of product.productImages) {
        const preSignUrl = await this.fileStorageService.createPresignedUrl(
          productImage.assetId,
        );
        productImage.asset.preSignUrl = preSignUrl;
      }
    }

    return product;
  }

  @Transactional()
  async update(updateProductDto: UpdateProductDto, user: UserAuth) {
    const category = await this.categoryRepository.findOne({
      where: {
        id: updateProductDto.categoryId,
      },
    });

    if (!category) {
      throw new BadRequestException('Update category not found');
    }

    const product = await this.productRepository.findOne({
      where: {
        id: updateProductDto.id,
      },
      relations: {
        productImages: true,
        productSizes: true,
        productColors: true,
      },
    });

    if (!product) {
      throw new BadRequestException('product not found');
    }

    await this.productRepository.update(
      { id: updateProductDto.id },
      {
        updatedById: user.userId,
        categoryId: updateProductDto.categoryId,
        description: updateProductDto.description,
        name: updateProductDto.name,
        price: updateProductDto.price,
      },
    );

    const remainImageIds = updateProductDto.productImages.map(
      (productImage) => productImage.id,
    );

    const deletedImageIds = product.productImages
      .map((productImage) => productImage.id)
      .filter((id) => !remainImageIds.includes(id));

    await this.productImageRepository.delete({
      id: In(deletedImageIds),
    });

    const deleteAssetIds = product.productImages
      .filter((image) => deletedImageIds.includes(image.id))
      .map((productImage) => productImage.assetId);

    for (const assetId of deleteAssetIds) {
      await this.fileStorageService.deleteAsset(assetId);
    }

    const remainSizeIds = updateProductDto.productSizes
      .filter((size) => size.id !== null && size.id !== undefined)
      .map((size) => size.id);
    await this.productSizeRepository.save(
      updateProductDto.productSizes.filter((size) =>
        remainSizeIds.includes(size.id),
      ),
    );
    const deleteSizeIds = product.productSizes
      .filter((size) => !remainSizeIds.includes(size.id))
      .map((size) => size.id);
    await this.productVariantRepository.delete({
      productSizeId: In(deleteSizeIds),
    });
    await this.productSizeRepository.delete({
      id: In(deleteSizeIds),
    });
    const newSizes = updateProductDto.productSizes
      .filter((size) => !size.id)
      .map((size) =>
        this.productSizeRepository.create({ ...size, productId: product.id }),
      );
    const newProductSizes = await this.productSizeRepository.save(newSizes);

    const remainColorIds = updateProductDto.productColors
      .filter((color) => color.id !== null && color.id !== undefined)
      .map((color) => color.id);
    await this.productColorRepository.save(
      updateProductDto.productColors.filter((c) =>
        remainColorIds.includes(c.id),
      ),
    );
    const deleteColorIds = product.productColors
      .filter((color) => !remainColorIds.includes(color.id))
      .map((color) => color.id);
    await this.productVariantRepository.delete({
      productColorId: In(deleteColorIds),
    });
    await this.productColorRepository.delete({
      id: In(deleteColorIds),
    });
    const newColors = updateProductDto.productColors
      .filter((color) => !color.id)
      .map((color) =>
        this.productColorRepository.create({ ...color, productId: product.id }),
      );

    const newProductColors = await this.productColorRepository.save(newColors);

    const newProductVariants = [];
    for (const newSize of newProductSizes) {
      for (const colorId of remainColorIds) {
        newProductVariants.push(
          this.productVariantRepository.create({
            productSizeId: newSize.id,
            productColorId: colorId,
            productId: updateProductDto.id,
            createdById: user.userId,
          }),
        );
      }
    }

    for (const newColor of newProductColors) {
      for (const sizeId of remainSizeIds) {
        newProductVariants.push(
          this.productVariantRepository.create({
            productId: updateProductDto.id,
            productColorId: newColor.id,
            productSizeId: sizeId,
            createdById: user.userId,
          }),
        );
      }
    }

    for (const newColor of newProductColors) {
      for (const newSize of newProductSizes) {
        newProductVariants.push(
          this.productVariantRepository.create({
            productId: updateProductDto.id,
            productColorId: newColor.id,
            productSizeId: newSize.id,
            createdById: user.userId,
          }),
        );
      }
    }
    await this.productVariantRepository.save(newProductVariants);

    return this.productRepository.findOne({
      where: {
        id: updateProductDto.id,
      },
    });
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
