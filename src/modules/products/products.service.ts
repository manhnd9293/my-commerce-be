import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { In, Not, Repository } from 'typeorm';
import { ProductColor } from './entities/product-color.entity';
import { ProductSize } from './entities/product-size.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { UserAuth } from '../auth/strategies/jwt.strategy';
import { Category } from '../categories/entities/category.entity';
import { Transactional } from 'typeorm-transactional';
import { FileStorageService } from '../common/file-storage/file-storage.service';
import { StorageTopLevelFolder } from '../../utils/enums/storage-to-level-folder';
import { v4 as uuidv4 } from 'uuid';
import { ProductImage } from './entities/product-image.entity';
import { ProductQueryDto } from './dto/product-query.dto';
import { BaseQueryDto } from '../../utils/common/base-query.dto';
import { PageData } from '../../utils/common/page-data';
import { Asset } from '../common/entities/asset.entity';
import { ProductOptionEntity } from './entities/product-option.entity';
import { ProductOptionValueEntity } from './entities/product-option-value.entity';
import { NewCreateProductDto } from './dto/new-create-product.dto';
import { UpdateProductOptionDto } from './dto/update-product-option.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { UpdateOptionValueDto } from './dto/update-option-value.dto';

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
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(ProductOptionEntity)
    private readonly productOptionRepository: Repository<ProductOptionEntity>,
    @InjectRepository(ProductOptionValueEntity)
    private readonly productOptionValueRepository: Repository<ProductOptionValueEntity>,
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
    const assetIds = createProductDto.productMedia;
    const countMedia = await this.assetRepository.count({
      where: {
        id: In(assetIds),
      },
    });

    if (countMedia < new Set(assetIds).size) {
      throw new BadRequestException('Some media not exist');
    }

    const product = this.productRepository.create({
      categoryId: createProductDto.categoryId,
      name: createProductDto.name,
      description: createProductDto.description,
      createdById: user.userId,
    });

    const newProduct = await this.productRepository.save(product);

    const productMedia = assetIds.map((id, index) =>
      this.productImageRepository.create({
        productId: newProduct.id,
        assetId: id,
        pos: index,
      }),
    );
    await this.productImageRepository.save(productMedia);

    if (
      createProductDto.productOptions &&
      createProductDto.productOptions.length > 0
    ) {
      const newOptionEntities = createProductDto.productOptions.map(
        (op, index) =>
          this.productOptionRepository.create({
            ...op,
            productId: newProduct.id,
            position: index,
          }),
      );
      await this.productOptionRepository.save(newOptionEntities);

      const newOptionValues = createProductDto.productOptions.reduce(
        (list, option) => {
          const optionValues = option.optionValues.map((ov, index) =>
            this.productOptionValueRepository.create({
              ...ov,
              productOptionId: option.id,
              position: index,
            }),
          );
          list.push(...optionValues);
          return list;
        },
        [],
      );
      await this.productOptionValueRepository.save(newOptionValues);
    }

    if (
      createProductDto.productVariants &&
      createProductDto.productVariants.length > 0
    ) {
      await this.productVariantRepository.save(
        createProductDto.productVariants.map((pv) => ({
          ...pv,
          productId: newProduct.id,
        })),
      );
    }

    return this.productRepository.findOne({
      where: {
        id: newProduct.id,
      },
      relations: {
        productVariants: true,
        category: true,
        productOptions: {
          optionValues: true,
        },
      },
    });
  }

  async findAll() {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.productImages', 'productImages')
      .leftJoinAndSelect('productImages.asset', 'asset')
      .orderBy({
        'product.createdAt': 'ASC',
        'productImages.pos': 'ASC',
      });
    const products = await queryBuilder.getMany();
    await Promise.all(
      products.map(async (product) => {
        if (product.productImages.length === 0) {
          return;
        }
        product.thumbnailUrl = await this.fileStorageService.createPresignedUrl(
          product.productImages[0].assetId,
        );
      }),
    );

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
      .leftJoinAndSelect('productImages.asset', 'asset')
      .orderBy('productImages.pos', 'ASC');

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
      if (product.productImages.length === 0) {
        continue;
      }
      const thumbnailImage = product.productImages.find(
        (image) => image.pos === 0,
      );
      product.thumbnailUrl = await this.fileStorageService.createPresignedUrl(
        thumbnailImage.assetId,
      );
    }

    return pageData;
  }

  async findOne(id: string) {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .andWhere('product.id = :productId', { productId: id })
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.productImages', 'productImages')
      .leftJoinAndSelect('productImages.asset', 'asset')
      .leftJoinAndSelect('product.productVariants', 'productVariants')
      .leftJoinAndSelect('product.productOptions', 'productOptions')
      .leftJoinAndSelect('productOptions.optionValues', 'optionValues')
      .addSelect('product.description')
      .orderBy({
        'productImages.pos': 'ASC',
        'productOptions.position': 'ASC',
        'optionValues.position': 'ASC',
      })
      .getOne();

    if (!product) {
      throw new BadRequestException('Product not found');
    }
    if (product.productImages.length > 0) {
      product.thumbnailUrl = await this.fileStorageService.createPresignedUrl(
        product.productImages[0].assetId,
      );
    }

    if (product.productImages) {
      await Promise.all(
        product.productImages.map(async (image) => {
          return this.fileStorageService
            .createPresignedUrl(image.assetId)
            .then((url) => {
              image.asset.preSignUrl = url;
            });
        }),
      );
    }

    return product;
  }

  @Transactional()
  async update(
    productId: string,
    updateProductDto: UpdateProductDto,
    user: UserAuth,
  ) {
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
        id: productId,
      },
      relations: {
        productImages: true,
      },
    });

    if (!product) {
      throw new BadRequestException('product not found');
    }
    const { productVariants, productOptions } = updateProductDto;

    const optionIdSet = new Set();
    for (const option of productOptions) {
      if (optionIdSet.has(option.id)) {
        throw new BadRequestException('Duplicated option id');
      }
      optionIdSet.add(option.id);
    }

    const optionValueIdSet = new Set();
    for (const optionValue of productOptions
      .map((po) => po.optionValues)
      .flat()) {
      if (optionValueIdSet.has(optionValue.id)) {
        throw new BadRequestException('Duplicated option value id');
      }
      optionValueIdSet.add(optionValue.id);
    }

    await this.productRepository.update(
      { id: productId },
      {
        updatedById: user.userId,
        categoryId: updateProductDto.categoryId,
        description: updateProductDto.description,
        name: updateProductDto.name,
        price: updateProductDto.price,
      },
    );

    /* Update product options */
    await this.updateProductOptions(productId, updateProductDto.productOptions);

    await this.updateProductOptionValues(
      productId,
      updateProductDto.productOptions,
    );

    await this.updateProductVariants(productId, productVariants, user);

    return this.productRepository.findOne({
      where: {
        id: productId,
      },
    });
  }

  @Transactional()
  private async updateProductVariants(
    productId: string,
    updateVariants: UpdateProductVariantDto[],
    user: UserAuth,
  ) {
    //todo: validate product variants

    const variantIdToVariant = updateVariants.reduce<{
      [key: string]: UpdateProductVariantDto;
    }>((map, variant) => {
      map[variant.id] = variant;
      return map;
    }, {});

    const updateVariantIdSet = new Set(Object.keys(variantIdToVariant));

    const allCurrentVariantEntities = await this.productVariantRepository.find({
      where: {
        productId: productId,
      },
    });

    const productOptionEntities = await this.productOptionRepository.find({
      where: {
        productId,
      },
      relations: {
        optionValues: true,
      },
    });

    const optionIdToOption = productOptionEntities.reduce<{
      [key: string]: ProductOptionEntity;
    }>((idToOption, option) => {
      idToOption[option.id] = option;
      return idToOption;
    }, {});

    const idToOptionValues = productOptionEntities.reduce<{
      [key: string]: ProductOptionValueEntity;
    }>((map, po) => {
      const { optionValues } = po;
      for (const ov of optionValues) {
        map[ov.id] = ov;
      }
      return map;
    }, {});

    allCurrentVariantEntities.forEach((v) => {
      v.price = variantIdToVariant[v.id]?.price || 0;
      v.quantity = variantIdToVariant[v.id]?.quantity || 0;
      v.specs = variantIdToVariant[v.id]?.specs || v.specs;

      const specs = v.specs;
      for (const spec of specs) {
        spec.optionName = optionIdToOption[spec.optionId].name;
        spec.optionValueName = idToOptionValues[spec.optionValueId].name;
      }
    });
    const currentVariantIds = new Set(
      allCurrentVariantEntities.map((v) => v.id),
    );
    const newVariants = updateVariants.filter(
      (pv) => !currentVariantIds.has(pv.id),
    );
    const newProductVariantEntities = newVariants.map((v) =>
      this.productVariantRepository.create({
        ...v,
        productId: productId,
        createdById: user.userId,
      }),
    );
    const deletedIds = allCurrentVariantEntities
      .map((v) => v.id)
      .filter((id) => !updateVariantIdSet.has(id));
    await this.productVariantRepository.delete({
      id: In(deletedIds),
    });

    const remainedProductVariantEntities = allCurrentVariantEntities.filter(
      (pv) => updateVariantIdSet.has(pv.id),
    );

    await this.productVariantRepository.save([
      ...remainedProductVariantEntities,
      ...newProductVariantEntities,
    ]);
  }

  async updateImages(
    id: string,
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

  remove(id: string) {
    return `This action removes a #${id} product`;
  }

  async findSimilarProducts(productId: string, query: BaseQueryDto) {
    const { page, pageSize } = query;
    const currentProduct = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!currentProduct) {
      throw new BadRequestException('Current product not found');
    }

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

  async updateProductMedia(
    productId: string,
    data: { updateIds: string[] },
    user: UserAuth,
  ) {
    const assetIdToPosition = data.updateIds.reduce<Map<string, number>>(
      (map, id, index) => {
        map.set(id, index);
        return map;
      },
      new Map<string, number>(),
    );
    const existedProductImages = await this.productImageRepository.find({
      where: {
        assetId: In(data.updateIds),
        productId,
      },
    });
    const deletedProductImages = await this.productImageRepository.find({
      where: {
        assetId: Not(In(data.updateIds)),
        productId,
      },
    });
    const existedAssetIds = existedProductImages.map((image) => image.assetId);
    const newProductImages = data.updateIds
      .filter((id) => !existedAssetIds.includes(id))
      .map((id) => {
        return this.productImageRepository.create({
          productId,
          assetId: id,
        });
      });

    const allMedia = [...existedProductImages, ...newProductImages].map(
      (media) => ({
        ...media,
        pos: assetIdToPosition.get(media.assetId),
      }),
    );

    await this.productImageRepository.delete({
      assetId: In(deletedProductImages.map((image) => image.assetId)),
    });

    return this.productImageRepository.save(allMedia);
  }

  @Transactional()
  async updateProductOptions(
    productId: string,
    productOptions: UpdateProductOptionDto[],
  ) {
    const optionIdToOption = productOptions.reduce<{
      [key: string]: UpdateProductOptionDto;
    }>((map, option) => {
      map[option.id] = option;
      return map;
    }, {});

    const productOptionEntities = await this.productOptionRepository.find({
      where: {
        productId,
      },
    });
    const updateOptionEntities = productOptionEntities.map((o) => {
      const updateOption = optionIdToOption[o.id];
      if (!updateOption) {
        return o;
      }
      return { ...o, ...updateOption };
    });
    const currentOptionIds = new Set(
      productOptionEntities.map((poe) => poe.id),
    );
    const newOptionIds = new Set(Object.keys(Object.keys(optionIdToOption)));
    const newOptionDtos = productOptions.filter(
      (po) => !currentOptionIds.has(po.id),
    );

    const deleteOptions = productOptionEntities.filter(
      (op) => !newOptionIds.has(op.id),
    );

    await this.productOptionRepository.softDelete(
      deleteOptions.map((o) => o.id),
    );

    const newOptionEntities = newOptionDtos.map((newOption) =>
      this.productOptionRepository.create({ ...newOption, productId }),
    );
    const idToPosition = productOptions.reduce<{ [id: string]: number }>(
      (map, option, index) => {
        map[option.id] = index;
        return map;
      },
      {},
    );
    const allUpdateEntities = [...updateOptionEntities, ...newOptionEntities];
    allUpdateEntities.forEach((e) => (e.position = idToPosition[e.id]));
    await this.productOptionRepository.save(allUpdateEntities);
  }

  @Transactional()
  async updateProductOptionValues(
    productId: string,
    productOptions: UpdateProductOptionDto[],
  ) {
    const updateProductOptionValues = productOptions
      .map((po) => po.optionValues)
      .flat();

    const currentProductOptionValueEntities =
      await this.productOptionValueRepository.find({
        where: {
          productOption: {
            productId,
          },
        },
      });

    const updateIds = new Set(updateProductOptionValues.map((pov) => pov.id));
    const currentIds = new Set(
      currentProductOptionValueEntities.map((e) => e.id),
    );
    const deletedOptionValues = currentProductOptionValueEntities.filter(
      (entity) => !updateIds.has(entity.id),
    );
    await this.productOptionValueRepository.softDelete(
      deletedOptionValues.map((ov) => ov.id),
    );
    const newProductOptionValueEntities = updateProductOptionValues
      .filter((pov) => !currentIds.has(pov.id))
      .map((dto) =>
        this.productOptionValueRepository.create({
          ...dto,
        }),
      );

    const updateProductOptionEntities =
      currentProductOptionValueEntities.filter((pov) => updateIds.has(pov.id));
    const updateIdToDto = updateProductOptionValues.reduce<{
      [key: string]: UpdateOptionValueDto;
    }>((map, pov) => {
      map[pov.id] = pov;
      return map;
    }, {});
    updateProductOptionEntities.map((entity) => {
      return { ...entity, ...updateIdToDto[entity.id] };
    });

    const allUpdateEntities = [
      ...newProductOptionValueEntities,
      ...updateProductOptionEntities,
    ];
    const idToPosition = updateProductOptionValues.reduce<{
      [id: string]: number;
    }>((map, pov) => {
      map[pov.id] = pov.position;
      return map;
    }, {});

    allUpdateEntities.forEach((e) => (e.position = idToPosition[e.id]));
    await this.productOptionValueRepository.save(allUpdateEntities);

    // const currentOptionEntities = await this.productOptionRepository.find({
    //   where: {
    //     productId,
    //   },
    // });
    // const updateOptionIdSet = new Set(productOptions.map((o) => o.id));
    // const currentOptionIdSet = new Set(currentOptionEntities.map((o) => o.id));
    // const optionValueIdToOptionValue = productOptions
    //   .map((op) => op.optionValues)
    //   .flat()
    //   .reduce<{ [key: string]: UpdateOptionValueDto }>((map, ov) => {
    //     map[ov.id] = ov;
    //     return map;
    //   }, {});
    // const newOptions = productOptions.filter(
    //   (po) => !currentOptionIdSet.has(po.id),
    // );
    //
    // const newOptionValueEntitiesFromNewOptions = newOptions.reduce(
    //   (all, option) => {
    //     const optionValueEntities = option.optionValues.map((ov) =>
    //       this.productOptionValueRepository.create({
    //         ...ov,
    //         productOptionId: option.id,
    //       }),
    //     );
    //
    //     all.push(...optionValueEntities);
    //     return all;
    //   },
    //   [],
    // );
    //
    // const currentProductOptionValueEntities =
    //   await this.productOptionValueRepository.find({
    //     where: {
    //       productOptionId: In(currentOptionEntities.map((o) => o.id)),
    //     },
    //   });
    // const updateProductOptionValueEntities =
    //   currentProductOptionValueEntities.map((pov) => {
    //     const updateOptionValueDto = optionValueIdToOptionValue[pov.id];
    //     if (!updateOptionValueDto) {
    //       return pov;
    //     }
    //     return { ...pov, ...updateOptionValueDto };
    //   });
    //
    // const existOptionValueIds = new Set(
    //   currentProductOptionValueEntities.map((ov) => ov.id),
    // );
    // const newOptionValueEntitiesFromOldOptions = productOptions
    //   .map((op) => {
    //     const values = op.optionValues;
    //     // @ts-ignore
    //     values.forEach((v) => (v['productOptionId'] = op.id));
    //     return values;
    //   })
    //   .flat()
    //   .filter((ov) => !existOptionValueIds.has(ov.id));
    //
    // await this.productOptionValueRepository.save([
    //   ...updateProductOptionValueEntities,
    //   ...newOptionValueEntitiesFromNewOptions,
    //   ...newOptionValueEntitiesFromOldOptions,
    // ]);
  }

  @Transactional()
  async deleteMedia(productId: string, data: { assetIds: string[] }) {
    const deleteResult = await this.productImageRepository.delete({
      productId,
      assetId: In(data.assetIds),
    });
    const remainedMedia = await this.productImageRepository.find({
      where: {
        productId,
      },
      order: {
        pos: 'ASC',
      },
    });
    remainedMedia.forEach((media, index) => {
      media.pos = index;
    });
    await this.productImageRepository.save(remainedMedia);

    return deleteResult;
  }

  @Transactional()
  async createNewProduct(data: NewCreateProductDto) {
    const { name, productOptions } = data;
    const product = this.productRepository.create({ name });
    const savedProduct = await this.productRepository.save(product);

    const newOptions = productOptions.map((option) =>
      this.productOptionRepository.create({
        name: option.name,
        productId: savedProduct.id,
      }),
    );
    const newSavedOptions = await this.productOptionRepository.save(newOptions);
    const nameToOptionId = newSavedOptions.reduce<Map<string, string>>(
      (map, option) => {
        map.set(option.name, option.id);
        return map;
      },
      new Map(),
    );
    const allOptionValuesEntities: ProductOptionValueEntity[] =
      productOptions.reduce((list, option) => {
        const optionValues = option.values.reduce(
          (listValue, value) =>
            listValue.concat(
              this.productOptionValueRepository.create({
                name: value,
                productOptionId: nameToOptionId.get(option.name),
              }),
            ),
          [],
        );
        return list.concat(optionValues);
      }, []);

    const savedProductOptionsValueEntities =
      await this.productOptionValueRepository.save(allOptionValuesEntities);

    const optionIdToOptionValueIds = savedProductOptionsValueEntities.reduce(
      (map, op) => {
        const currentList = map.get(op.productOptionId) || [];
        map.set(op.productOptionId, currentList.concat(op.id));
        return map;
      },
      new Map(),
    );

    let variants = [{}];
    for (const option of newSavedOptions) {
      const newVariants = [];
      for (const variant of variants) {
        for (const optionValueId of optionIdToOptionValueIds.get(option.id)) {
          newVariants.push({ ...variant, [option.id]: optionValueId });
        }
      }
      variants = newVariants;
    }
    // const productVariants = variants
    //   .map((v) =>
    //     this.productVariantRepository.create({
    //       options: v,
    //       productId: savedProduct.id,
    //     }),
    //   )
    //   .reduce((list, pv) => list.concat(pv), []);
    // await this.productVariantRepository.save(productVariants);

    return this.productRepository.findOne({
      where: {
        id: savedProduct.id,
      },
      relations: {
        productOptions: {
          optionValues: true,
        },
        productVariants: true,
      },
    });
  }
}
