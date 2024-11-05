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
import { FileStorageService } from '../common/file-storage.service';
import { StorageTopLevelFolder } from '../../utils/enums/storage-to-level-folder';
import { v4 as uuidv4 } from 'uuid';
import { ProductImage } from './entities/product-image.entity';
import { ProductQueryDto } from './dto/product-query.dto';
import { BaseQueryDto } from '../../utils/common/base-query.dto';
import { PageData } from '../../utils/common/page-data';

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

    let newColors = null;
    if (
      createProductDto.productColors &&
      createProductDto.productColors.length > 0
    ) {
      const productColors = createProductDto.productColors.map((pc) => {
        const productColor = this.productColorRepository.create(pc);
        productColor.productId = newProduct.id;
        return productColor;
      });
      newColors = await this.productColorRepository.save(productColors);
    }

    let newSizes = null;
    if (
      createProductDto.productSizes &&
      createProductDto.productSizes.length > 0
    ) {
      const productSizes = createProductDto.productSizes.map((ps) => {
        const productSize = this.productSizeRepository.create(ps);
        productSize.productId = newProduct.id;
        return productSize;
      });
      newSizes = await this.productSizeRepository.save(productSizes);
    }

    const variants = [];
    for (const color of newColors || [null]) {
      for (const size of newSizes || [null]) {
        const productVariant = this.productVariantRepository.create();
        productVariant.productColorId = color?.id || null;
        productVariant.productSizeId = size?.id || null;
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
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.productSizes', 'productSizes')
      .leftJoinAndSelect('product.productColors', 'productColors')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.productImages', 'productImages')
      .leftJoinAndSelect('productImages.asset', 'asset');
    queryBuilder.orderBy('product.createdAt', 'ASC');

    const products = await queryBuilder.getMany();
    for (const product of products) {
      product.thumbnailUrl = await this.fileStorageService.createPresignedUrl(
        product.productImages[0].assetId,
      );
    }

    return products;
  }

  async findPage(query: ProductQueryDto) {
    const { categoryId, search, page, pageSize } = query;
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.productSizes', 'productSizes')
      .leftJoinAndSelect('product.productColors', 'productColors')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.productImages', 'productImages')
      .leftJoinAndSelect('productImages.asset', 'asset');

    if (categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId });
    }
    if (search) {
      queryBuilder.andWhere('LOWER(product.name) like :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }
    const count = await queryBuilder.getCount();
    queryBuilder.orderBy('product.createdAt', 'ASC');
    // queryBuilder.addOrderBy('productImages.id', 'ASC');

    queryBuilder.skip((page - 1) * pageSize);
    queryBuilder.take(pageSize);
    const products = await queryBuilder.getMany();
    const pageData: PageData<Product> = {
      data: products,
      page,
      pageSize,
      totalPage: Math.ceil(count / pageSize),
    };
    for (const product of products) {
      product.thumbnailUrl = await this.fileStorageService.createPresignedUrl(
        product.productImages[0].assetId,
      );
    }

    return pageData;
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
      .addSelect('product.description')
      .orderBy('productImages.id', 'ASC')
      .getOne();

    if (!product) {
      throw new BadRequestException('Product not found');
    }
    product.thumbnailUrl = await this.fileStorageService.createPresignedUrl(
      product.productImages[0].assetId,
    );
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
      for (const colorId of remainColorIds.length > 0
        ? remainColorIds
        : [null]) {
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
      for (const sizeId of remainSizeIds.length > 0 ? remainSizeIds : [null]) {
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

  async findSimilarProducts(productId: number, query: BaseQueryDto) {
    const { page, pageSize } = query;
    const currentProduct = await this.productRepository.findOne({
      where: { id: productId },
    });

    const qb = this.productRepository.createQueryBuilder('product');
    qb.andWhere('product.categoryId = :currentCategoryId', {
      currentCategoryId: currentProduct.categoryId,
    });
    qb.andWhere('product.id != :currentId', { currentId: currentProduct.id });
    qb.leftJoinAndSelect('product.productImages', 'productImages');
    const total = await qb.getCount();
    qb.addSelect('abs(product.price - :currentPrice)', 'diff').setParameter(
      'currentPrice',
      currentProduct.price,
    );
    qb.orderBy('diff', 'ASC');
    qb.skip((query.page - 1) * query.pageSize);
    qb.take(query.pageSize);
    const products = await qb.getMany();

    for (const p of products) {
      p.thumbnailUrl = await this.fileStorageService.createPresignedUrl(
        p.productImages[0].assetId,
      );
    }

    const response: PageData<Product> = {
      data: products,
      page,
      pageSize,
      totalPage: Math.ceil(total / query.pageSize),
    };

    return response;
  }
}
