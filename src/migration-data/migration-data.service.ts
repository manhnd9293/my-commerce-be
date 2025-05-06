import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../modules/products/entities/product.entity';
import { Repository } from 'typeorm';
import { ProductVariant } from '../modules/products/entities/product-variant.entity';
import { ProductColor } from '../modules/products/entities/product-color.entity';
import { ProductSize } from '../modules/products/entities/product-size.entity';

@Injectable()
export class MigrationDataService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductColor)
    private readonly productColorRepository: Repository<ProductColor>,
    @InjectRepository(ProductSize)
    private readonly productSizeRepository: Repository<ProductSize>,
  ) {}

  async recoverProductColor() {
    // const products = await this.productRepository.find({
    //   relations: {
    //     productColors: true,
    //     productVariants: true,
    //   },
    // });
    //
    // const updateProductVariants = [];
    // for (const product of products) {
    //   const recoverProductVariants = product.productVariants.filter(
    //     (p) => !p.productColorId && !p.productSizeId,
    //   );
    //   for (let i = 0; i < product.productColors.length; i++) {
    //     recoverProductVariants[i].productColorId = product.productColors[i].id;
    //   }
    //   updateProductVariants.push(...recoverProductVariants);
    // }
    // await this.productVariantRepository.save(updateProductVariants);
  }

  async addDefaultProductVariant() {
    // const products = await this.productRepository.find({});
    // const productVariants = products.map((p) =>
    //   this.productVariantRepository.create({
    //     productId: p.id,
    //     productSizeId: null,
    //     productColorId: null,
    //   }),
    // );
    // await this.productVariantRepository.save(productVariants);
  }
}
