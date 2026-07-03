import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { UserLocation } from '@prisma/client';

@ObjectType('UserLocation')
export class UserLocationType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => ID)
  locationId!: string;

  @Field()
  restaurantId!: string;

  @Field()
  createdAt!: Date;
}

export function toUserLocationType(row: UserLocation): UserLocationType {
  return {
    id: row.id,
    userId: row.userId,
    locationId: row.locationId,
    restaurantId: row.tenantId,
    createdAt: row.createdAt,
  };
}
