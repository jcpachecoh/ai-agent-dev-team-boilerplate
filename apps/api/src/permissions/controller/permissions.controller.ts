import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/** Placeholder controller — HTTP enforcement is deferred to USR-02B / USR-03. */
@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {}
