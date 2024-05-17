import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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

  findByEmail(email: string): Promise<UserEntity> {
    return this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
      },
    });
  }
}
