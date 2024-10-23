import { PickType } from '@nestjs/swagger';
import { UserEntity } from '../entity/user.entity';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUserGeneralInfoDto extends PartialType(
  PickType(UserEntity, ['fullName', 'dob', 'phone'] as const),
) {}
