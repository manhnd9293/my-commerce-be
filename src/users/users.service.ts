import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const check = await this.userRepository.find({
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

    return this.userRepository.save(createUserDto);
  }
}
