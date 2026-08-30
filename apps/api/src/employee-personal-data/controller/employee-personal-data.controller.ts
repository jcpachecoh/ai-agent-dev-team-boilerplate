import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EmployeePersonalDataService } from '../service/employee-personal-data.service';
import { UpdateEmployeePersonalDataDto } from './dto/update-employee-personal-data.dto';

@ApiTags('employee-personal-data')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeePersonalDataController {
  constructor(private readonly service: EmployeePersonalDataService) {}

  @ApiOperation({ summary: 'Obtener datos personales del empleado' })
  @Get(':userId/datos-personales')
  getPersonalData(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('userId') userId: string,
  ) {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.service.getByUserId(tenantId, userId, user.sub, user.roleCode);
  }

  @ApiOperation({ summary: 'Actualizar datos personales del empleado' })
  @Put(':userId/datos-personales')
  updatePersonalData(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('userId') userId: string,
    @Body() body: UpdateEmployeePersonalDataDto,
  ) {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.service.updateByUserId(tenantId, userId, user.sub, user.roleCode, body);
  }

  @ApiOperation({ summary: 'Subir foto de perfil del empleado' })
  @ApiConsumes('multipart/form-data')
  @Post(':userId/foto-perfil')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  uploadProfilePhoto(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.service.uploadProfilePhoto(tenantId, userId, user.sub, user.roleCode, file);
  }

  private resolveTenantId(user: JwtPayload, headerTenantId: string): string {
    const tenantId = user?.tenantId ?? headerTenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
    }
    return tenantId;
  }
}
