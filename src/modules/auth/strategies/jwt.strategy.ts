import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../users/entity/user.entity';
import { Repository } from 'typeorm';
import { UserRole } from '../../../utils/enums/user-role';
import { CachingService } from '../../common/caching/caching.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface UserAuth {
  userId: string;
  email: string;
  role: UserRole;
}

export const JWT_STRATEGY = 'jwt-strategies';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly cachingService: CachingService,
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

    const userKey = `user:${payload.sub}`;
    const cachedUser = await this.cachingService.cacheDb.hgetall(userKey);

    if (Object.keys(cachedUser).length === 0) {
      const currentUser = await this.userRepository.findOne({
        where: {
          email: payload.email,
        },
      });

      if (!currentUser) {
        throw new UnauthorizedException('User not exist');
      }
      await this.cachingService.cacheDb.hset(userKey, 'role', currentUser.role);
      await this.cachingService.cacheDb.hset(
        userKey,
        'email',
        currentUser.email,
      );

      return {
        userId: payload.sub,
        email: payload.email,
        role: currentUser.role,
      };
    }

    return {
      userId: payload.sub,
      email: cachedUser['email'],
      role: cachedUser['role'] as UserRole,
    };
  }
}
