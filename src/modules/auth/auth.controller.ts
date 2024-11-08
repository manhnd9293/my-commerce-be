import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { Public } from '../../decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/sign-in')
  @Throttle({ default: { limit: 6, ttl: 5 * 60 * 1000 } })
  signIn(@Body() data: SignInDto) {
    return this.authService.signIn(data.email, data.password);
  }

  @Public()
  @Post('/google-sign-in')
  @Throttle({ default: { limit: 6, ttl: 5 * 60 * 1000 } })
  googleSignIn(@Body() data: { googleToken: string }) {
    return this.authService.googleSignIn(data.googleToken);
  }
}
