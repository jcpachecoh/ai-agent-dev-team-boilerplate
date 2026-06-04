import { PartialType } from '@nestjs/swagger';
import { CreateSupplyItemDto } from './create-supplyitem.dto';

export class UpdateSupplyItemDto extends PartialType(CreateSupplyItemDto) {}
