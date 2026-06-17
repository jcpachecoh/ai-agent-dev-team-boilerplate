import { PartialType } from '@nestjs/swagger';
import { CreatePhaseDto } from './create-recipe.dto';

export class UpdatePhaseDto extends PartialType(CreatePhaseDto) {}
