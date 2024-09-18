import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { FileStorageService } from '../common/file-storage.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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
      },
    });
    for (const cartItem of userEntity.cart) {
      const productImage = cartItem.productVariant.product.productImages[0];
      cartItem.productVariant.product.thumbnailUrl =
        await this.fileStorageService.createPresignedUrl(productImage.assetId);
    }
    return userEntity;
  }
}
