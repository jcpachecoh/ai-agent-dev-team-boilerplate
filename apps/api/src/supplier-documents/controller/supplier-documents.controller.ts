import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SupplierDocumentType } from '@prisma/client';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  SUPPLIER_DOCUMENTS_READ_ROLES,
  SUPPLIER_DOCUMENTS_WRITE_ROLES,
} from '../supplier-documents.constants';
import { SupplierDocumentsService } from '../service/supplier-documents.service';
import {
  ListSupplierDocumentsResponseDto,
  SupplierDocumentDownloadUrlDto,
} from './dto/list-supplier-documents-response.dto';
import { UpsertSupplierDocumentDto } from './dto/upsert-supplier-document.dto';

function resolveTenantId(user: JwtPayload, headerTenantId: string): string {
  return user?.tenantId || headerTenantId;
}

@ApiTags('supplier-documents')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@Controller('suppliers/:supplierId/documents')
export class SupplierDocumentsController {
  constructor(private readonly service: SupplierDocumentsService) {}

  @ApiOperation({ summary: 'Listar documentos de proveedor y completitud' })
  @ApiOkResponse({ type: ListSupplierDocumentsResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SUPPLIER_DOCUMENTS_READ_ROLES)
  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('supplierId') supplierId: string,
  ): Promise<ListSupplierDocumentsResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    return this.service.list(tenantId, supplierId);
  }

  @ApiOperation({ summary: 'Cargar o reemplazar documento de proveedor' })
  @ApiOkResponse({ type: ListSupplierDocumentsResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SUPPLIER_DOCUMENTS_WRITE_ROLES)
  @Post(':documentType')
  async upsert(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('supplierId') supplierId: string,
    @Param('documentType', new ParseEnumPipe(SupplierDocumentType))
    documentType: SupplierDocumentType,
    @Body() body: UpsertSupplierDocumentDto,
  ): Promise<ListSupplierDocumentsResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    await this.service.upsert({
      tenantId,
      supplierId,
      documentType,
      storageObjectId: body.storageObjectId,
      issuedAt: body.issuedAt,
      expiresAt: body.expiresAt,
      actorUserId: user.sub,
    });
    return this.service.list(tenantId, supplierId);
  }

  @ApiOperation({ summary: 'Eliminar versión activa de documento de proveedor' })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SUPPLIER_DOCUMENTS_WRITE_ROLES)
  @Delete(':documentType')
  async remove(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('supplierId') supplierId: string,
    @Param('documentType', new ParseEnumPipe(SupplierDocumentType))
    documentType: SupplierDocumentType,
  ): Promise<void> {
    const tenantId = resolveTenantId(user, headerTenantId);
    await this.service.remove({
      tenantId,
      supplierId,
      documentType,
      actorUserId: user.sub,
    });
  }

  @ApiOperation({ summary: 'Obtener URL firmada de descarga de documento' })
  @ApiOkResponse({ type: SupplierDocumentDownloadUrlDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SUPPLIER_DOCUMENTS_READ_ROLES)
  @Get(':documentType/download')
  async download(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('supplierId') supplierId: string,
    @Param('documentType', new ParseEnumPipe(SupplierDocumentType))
    documentType: SupplierDocumentType,
    @Query('versionId') versionId?: string,
  ): Promise<SupplierDocumentDownloadUrlDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const url = await this.service.getDownloadUrl({
      tenantId,
      supplierId,
      documentType,
      actorUserId: user.sub,
      versionId,
    });
    return { url };
  }
}
