import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { FileStorageService } from '../common/file-storage.service';
import { UserAuth } from '../auth/jwt.strategy';
import { StorageTopLevelFolder } from '../../utils/enums/storage-to-level-folder';
import { OrderEntity } from '../orders/entities/order.entity';
import { OrderItemEntity } from '../orders/entities/order-item.entity';
import { PurchaseHistoryQueryDto } from './dto/purchase-history-query.dto';
import { PageData } from '../../utils/common/page-data';
import { CreateUserAddressDto } from './dto/user-address/create-user-address.dto';
import { UserAddressEntity } from './entity/user-address.entity';
import { UpdateUserAddressDto } from './dto/user-address/update-user-address.dto';
import { UpdateUserGeneralInfoDto } from './dto/update-user-general-info.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(UserAddressEntity)
    private readonly userAddressRepository: Repository<UserAddressEntity>,

    private readonly fileStorageService: FileStorageService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const check = await this.userRepository.findOne({
      where: {
        email: createUserDto.email,
      },
    });

    if (check) {
      throw new HttpException(
        'User email already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const userEntity = this.userRepository.create(createUserDto);
    userEntity.password = await bcrypt.hash(createUserDto.password, 10);

    const saved = await this.userRepository.save(userEntity);
    delete saved.password;
    return saved;
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const userEntity = await this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        cart: true,
        avatarFileId: true,
        fullName: true,
        dob: true,
        phone: true,
      },
      relations: {
        cart: {
          productVariant: {
            productColor: true,
            productSize: true,
            product: {
              productImages: true,
            },
          },
        },
        addresses: true,
      },
      order: {
        addresses: {
          createdAt: 'ASC',
        },
      },
    });
    for (const cartItem of userEntity.cart) {
      const productImage = cartItem.productVariant.product.productImages[0];
      cartItem.productVariant.product.thumbnailUrl =
        await this.fileStorageService.createPresignedUrl(productImage.assetId);
    }
    if (userEntity.avatarFileId) {
      userEntity.avatarUrl = await this.fileStorageService.createPresignedUrl(
        userEntity.avatarFileId,
      );
    }
    return userEntity;
  }

  async updateAvatar(file: Express.Multer.File, user: UserAuth) {
    const asset = await this.fileStorageService.saveFile(
      file,
      StorageTopLevelFolder.Users,
      `${user.userId}/avatar/${file.originalname}.${file.mimetype}`,
    );

    await this.userRepository.update(
      {
        id: user.userId,
      },
      {
        avatarFileId: asset.id,
      },
    );

    return {
      avatarUrl: await this.fileStorageService.createPresignedUrl(asset.id),
    };
  }

  async deleteAvatar(user: UserAuth) {
    await this.userRepository.update(
      {
        id: user.userId,
      },
      {
        avatarFileId: null,
      },
    );

    return 'done';
  }

  async getUserPurchaseHistory(
    query: PurchaseHistoryQueryDto,
    userId: string,
  ): Promise<PageData<OrderItemEntity>> {
    const { page, pageSize, order, sortBy, search } = query;
    const qb = this.orderItemRepository.createQueryBuilder('item');
    qb.leftJoinAndSelect('item.productVariant', 'productVariant');
    qb.leftJoinAndSelect('productVariant.product', 'product');
    qb.leftJoinAndSelect('product.productImages', 'productImages');
    qb.leftJoinAndSelect('item.order', 'order');
    qb.andWhere('order.user_id = :userId', { userId });
    search &&
      qb.andWhere('LOWER(product.name) like :searchTerm', {
        searchTerm: `%${search.toLowerCase()}%`,
      });
    const countItem = await qb.getCount();

    const sortField = sortBy ? `item.${sortBy}` : 'item.createdAt';
    qb.orderBy(sortField, order);

    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const orderItemEntities = await qb.getMany();

    await Promise.all(
      orderItemEntities.map((item) => {
        const product = item.productVariant.product;
        return this.fileStorageService
          .createPresignedUrl(product.productImages[0].assetId)
          .then((res) => (product.thumbnailUrl = res));
      }),
    );

    const result: PageData<OrderItemEntity> = {
      data: orderItemEntities,
      page,
      pageSize,
      totalPage: Math.ceil(countItem / pageSize),
    };

    return result;
  }

  createUserAddress(
    data: CreateUserAddressDto,
    user: UserAuth,
  ): Promise<UserAddressEntity> {
    const userAddressEntity = this.userAddressRepository.create({
      ...data,
      userId: user.userId,
    });
    return this.userAddressRepository.save(userAddressEntity);
  }

  async updateUserAddress(
    addressId: string,
    data: UpdateUserAddressDto,
    user: UserAuth,
  ): Promise<UserAddressEntity> {
    const userAddressEntity = await this.validateUserAndAddress(
      addressId,
      user,
    );

    await this.userAddressRepository.update(
      {
        id: addressId,
      },
      {
        ...userAddressEntity,
        ...data,
      },
    );

    return this.userAddressRepository.findOne({
      where: {
        id: addressId,
      },
    });
  }

  async deleteAddress(addressId: string, user: UserAuth) {
    await this.validateUserAndAddress(addressId, user);
    await this.userAddressRepository.delete({
      id: addressId,
    });

    return 'success';
  }

  private async validateUserAndAddress(addressId: string, user: UserAuth) {
    const userAddressEntity = await this.userAddressRepository.findOne({
      where: {
        id: addressId,
      },
    });
    if (!userAddressEntity) {
      throw new NotFoundException('Address not found');
    }
    if (user.userId !== userAddressEntity.userId) {
      throw new ForbiddenException('user is not allowed to update address');
    }
    return userAddressEntity;
  }

  getUserAddresses(user: UserAuth): Promise<UserAddressEntity[]> {
    return this.userAddressRepository.find({
      where: {
        userId: user.userId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async updateUserGeneralInfor(data: UpdateUserGeneralInfoDto, user: UserAuth) {
    await this.userRepository.update(
      {
        id: user.userId,
      },
      {
        ...data,
      },
    );

    return this.userRepository.findOne({
      where: {
        id: user.userId,
      },
    });
  }
}
