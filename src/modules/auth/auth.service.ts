import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt.strategy';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../users/entity/user.entity';
import { Repository } from 'typeorm';
import { FileStorageService } from '../common/file-storage.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: Repository<UserEntity>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async signIn(email: string, password: string) {
    const userEntity = await this.userEntityRepository.findOne({
      where: {
        email,
      },
      select: {
        password: true,
        id: true,
        email: true,
        avatarFileId: true,
      },
    });
    if (!userEntity) {
      throw new HttpException('User email not exists', HttpStatus.NOT_FOUND);
    }
    const isMatch = await bcrypt.compare(password, userEntity.password);
    if (!isMatch) {
      throw new BadRequestException('User email or password incorrect');
    }
    const jwtPayload: JwtPayload = {
      sub: userEntity.id,
      email: userEntity.email,
    };
    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      secret: this.configService.get('jwt.secret'),
    });

    delete userEntity.password;
    userEntity.avatarUrl = userEntity.avatarFileId
      ? await this.fileStorageService.createPresignedUrl(
          userEntity.avatarFileId,
        )
      : null;

    return {
      ...userEntity,
      accessToken,
    };
  }
}
