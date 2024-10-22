import { PickType } from '@nestjs/swagger';
import { UserAddressEntity } from '../../entity/user-address.entity';

export class CreateUserAddressDto extends PickType(UserAddressEntity, [
  'province',
  'district',
  'noAndStreet',
  'name',
] as const) {}
