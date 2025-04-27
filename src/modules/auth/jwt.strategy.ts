import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../users/entity/user.entity';
import { Repository } from 'typeorm';
import { UserRole } from '../../utils/enums/user-role';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface UserAuth {
  userId: string;
  email: string;
  role: UserRole;
}

export const JWT_STRATEGY = 'jwt-strategy';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<UserAuth> {
    if (!payload.email) {
      throw new UnauthorizedException('Email not provided');
    }

    const currentUser = await this.userRepository.findOne({
      where: {
        email: payload.email,
      },
    });
    if (!currentUser) {
      throw new UnauthorizedException('User not exist');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: currentUser.role,
    };
  }
}
