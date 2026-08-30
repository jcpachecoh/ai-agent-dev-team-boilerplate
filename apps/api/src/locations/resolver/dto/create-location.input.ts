import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

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

  /** JSON string with LocationBusinessHours structure */
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  businessHours?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'openingTime debe estar en formato HH:mm' })
  openingTime?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'closingTime debe estar en formato HH:mm' })
  closingTime?: string | null;
}
