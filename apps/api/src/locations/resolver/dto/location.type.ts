import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { Location } from '@prisma/client';

@ObjectType('Location')
export class LocationType {
  @Field(() => ID)
  id!: string;

  @Field()
  restaurantId!: string;

  @Field()
  name!: string;

  @Field()
  address!: string;

  @Field(() => String, { nullable: true })
  city?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  code?: string | null;

  /** Serialized JSON string of LocationBusinessHours */
  @Field(() => String, { nullable: true })
  businessHours?: string | null;

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

export function toLocationType(location: Location): LocationType {
  return {
    id: location.id,
    restaurantId: location.tenantId,
    name: location.name,
    address: location.address,
    city: location.city,
    phone: location.phone,
    code: location.code,
    businessHours: location.businessHours != null ? JSON.stringify(location.businessHours) : null,
    isActive: location.isActive,
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
  };
}
