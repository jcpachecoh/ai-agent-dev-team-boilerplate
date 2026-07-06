import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { SupplierDocumentsController } from './controller/supplier-documents.controller';
import { SupplierDocumentsRepository } from './repository/supplier-documents.repository';
import { SupplierDocumentExpirationService } from './service/supplier-document-expiration.service';
import { SupplierDocumentsService } from './service/supplier-documents.service';

@Module({
  imports: [PrismaModule, StorageModule, AuthModule],
  controllers: [SupplierDocumentsController],
  providers: [
    SupplierDocumentsService,
    SupplierDocumentsRepository,
    SupplierDocumentExpirationService,
  ],
  exports: [SupplierDocumentsService],
})
export class SupplierDocumentsModule {}
