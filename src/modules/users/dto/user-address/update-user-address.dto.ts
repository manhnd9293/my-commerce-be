import { UserAddressEntity } from '../../entity/user-address.entity';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUserAddressDto extends PartialType(UserAddressEntity) {}
