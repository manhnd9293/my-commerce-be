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
import * as process from 'node:process';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly fileStorageService: FileStorageService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async signIn(email: string, password: string) {
    const userEntity = await this.userRepository.findOne({
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
    if (!userEntity.password) {
      throw new BadRequestException('Invalid login method');
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

  async googleSignIn(googleToken: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const ticket = await this.googleClient.verifyIdToken({
      audience: clientId,
      idToken: googleToken,
    });
    const payload = ticket.getPayload();
    const googleId = payload['sub'] as string;
    const email = payload['email'] as string;
    const aud = payload['aud'] as string;
    const firstName = payload['given_name'] as string;
    const lastName = payload['family_name'] as string;
    if (aud !== clientId) {
      throw new BadRequestException('Token is not of this app');
    }

    let user = await this.userRepository.findOne({
      where: { googleId },
    });

    if (!user) {
      const userEntity = this.userRepository.create({
        fullName: `${firstName} ${lastName}`,
        googleId,
        email,
      });
      user = await this.userRepository.save(userEntity);
    }

    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };
    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      secret: this.configService.get('jwt.secret'),
    });

    delete user.password;
    user.avatarUrl = user.avatarFileId
      ? await this.fileStorageService.createPresignedUrl(user.avatarFileId)
      : null;

    return {
      ...user,
      accessToken,
    };
  }
}
