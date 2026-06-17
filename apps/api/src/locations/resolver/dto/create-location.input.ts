import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType('CreateLocationInput')
export class CreateLocationInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  address!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  city?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  restaurantId!: string;
}
