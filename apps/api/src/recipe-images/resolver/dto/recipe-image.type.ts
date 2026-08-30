import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('RecipeImage')
export class RecipeImageType {
  @Field(() => ID)
  id!: string;

  @Field()
  tenantId!: string;

  @Field(() => ID)
  recipeId!: string;

  @Field(() => String, { nullable: true })
  alt?: string | null;

  @Field()
  nameImage!: string;

  @Field()
  url!: string;

  @Field(() => String, { nullable: true })
  storageObjectId?: string | null;

  @Field(() => Int)
  sortOrder!: number;

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
