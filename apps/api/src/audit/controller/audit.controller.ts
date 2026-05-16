import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('audit')
@Controller('audit')
export class AuditController {}
