import { Reflector } from '@nestjs/core';
import { UserRole } from '../utils/enums/user-role';

export const Roles = Reflector.createDecorator<UserRole[]>();
