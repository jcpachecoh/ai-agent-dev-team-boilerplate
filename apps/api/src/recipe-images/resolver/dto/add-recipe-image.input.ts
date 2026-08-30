import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';

@InputType()
export class AddRecipeImageInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  recipeId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nameImage!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true }, { message: 'url must be a valid http(s) URL' })
  url!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  alt?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  storageObjectId?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
