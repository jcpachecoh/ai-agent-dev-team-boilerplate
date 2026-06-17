import { Field, ObjectType } from '@nestjs/graphql';
import { LocationType } from './location.type';

@ObjectType('LocationEdge')
export class LocationEdgeType {
  @Field(() => LocationType)
  node!: LocationType;

  @Field()
  cursor!: string;
}

@ObjectType('PageInfo')
export class PageInfoType {
  @Field()
  hasNextPage!: boolean;

  @Field(() => String, { nullable: true })
  endCursor?: string | null;
}

@ObjectType('LocationConnection')
export class LocationConnectionType {
  @Field(() => [LocationEdgeType])
  edges!: LocationEdgeType[];

  @Field(() => PageInfoType)
  pageInfo!: PageInfoType;
}
