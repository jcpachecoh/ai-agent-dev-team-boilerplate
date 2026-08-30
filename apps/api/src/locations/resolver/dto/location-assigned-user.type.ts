import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { User } from '@prisma/client';

@ObjectType('LocationAssignedUser')
export class LocationAssignedUserType {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field()
  cedula!: string;

  @Field()
  isActive!: boolean;

  @Field()
  restaurantId!: string;
}

export function toLocationAssignedUserType(user: User): LocationAssignedUserType {
  return {
    id: user.id,
    email: user.email,
    cedula: user.cedula,
    isActive: user.isActive,
    restaurantId: user.tenantId,
  };
}
