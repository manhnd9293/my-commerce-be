import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Public } from '../../decorators/public.decorator';
import { User } from '../../decorators/user.decorator';
import { UserAuth } from '../auth/strategies/jwt.strategy';
import { UserEntity } from './entity/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PurchaseHistoryQueryDto } from './dto/purchase-history-query.dto';
import { CreateUserAddressDto } from './dto/user-address/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/user-address/update-user-address.dto';
import { UserAddressEntity } from './entity/user-address.entity';
import { PageData } from '../../utils/common/page-data';
import { OrderItemEntity } from '../orders/entities/order-item.entity';
import { UpdateUserGeneralInfoDto } from './dto/update-user-general-info.dto';
import { Response } from 'express';
import { v1 as uuid } from 'uuid';
import { ConfigService } from '@nestjs/config';
import * as process from 'node:process';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('/')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('/me')
  @ApiBearerAuth()
  me(@User() user: UserAuth): Promise<UserEntity> {
    return this.usersService.findByEmail(user.email);
  }

  @Get('/cookie')
  @Public()
  setUserCookie(@Res({ passthrough: true }) response: Response) {
    response.cookie('s_id', uuid(), {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV !== 'local',
      sameSite: 'lax',
    });
    return {
      message: 'ok',
    };
  }

  @Patch('avatar')
  @UseInterceptors(FileInterceptor('file'))
  updateAvatar(
    @User() user: UserAuth,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 30 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(file, user);
  }

  @Delete('avatar')
  deleteAvatar(@User() user: UserAuth) {
    return this.usersService.deleteAvatar(user);
  }

  @Get('/my-purchase')
  getMyPurchase(
    @Query() query: PurchaseHistoryQueryDto,
    @User() user: UserAuth,
  ): Promise<PageData<OrderItemEntity>> {
    return this.usersService.getUserPurchaseHistory(query, user.userId);
  }

  @Post('/address')
  addUserAddress(
    @User() user: UserAuth,
    @Body() data: CreateUserAddressDto,
  ): Promise<UserAddressEntity> {
    return this.usersService.createUserAddress(data, user);
  }

  @Put('/address/:addressId')
  updateUserAddress(
    @User() user: UserAuth,
    @Param('addressId') addressId: string,
    @Body() data: UpdateUserAddressDto,
  ): Promise<UserAddressEntity> {
    return this.usersService.updateUserAddress(addressId, data, user);
  }

  @Delete('address/:addressId')
  deleteUserAddress(
    @User() user: UserAuth,
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.deleteAddress(addressId, user);
  }

  @Get('address')
  getUserAddresses(@User() user: UserAuth): Promise<UserAddressEntity[]> {
    return this.usersService.getUserAddresses(user);
  }

  @Patch('/general-info')
  updateUserGeneralInformation(
    @User() user: UserAuth,
    @Body() data: UpdateUserGeneralInfoDto,
  ): Promise<UserEntity> {
    return this.usersService.updateUserGeneralInfor(data, user);
  }

  @Public()
  @Get('/debug-sentry-new')
  getError() {
    throw new Error('New sentry error');
  }
}
