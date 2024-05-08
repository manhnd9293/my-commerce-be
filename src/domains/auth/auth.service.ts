import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(email: string, password: string) {
    const userEntity = await this.userService.findByEmail(email);
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

    return {
      ...userEntity,
      accessToken,
    };
  }
}
