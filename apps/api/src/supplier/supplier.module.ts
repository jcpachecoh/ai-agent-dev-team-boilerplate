import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PubSubModule } from '../pubsub/pubsub.module';
import { SupplierDocumentsModule } from '../supplier-documents/supplier-documents.module';
import { SupplierRepository } from './repository/supplier.repository';
import { SupplierService } from './service/supplier.service';
import { SupplierResolver } from './resolver/supplier.resolver';

@Module({
  imports: [PrismaModule, PubSubModule, SupplierDocumentsModule],
  providers: [SupplierRepository, SupplierService, SupplierResolver],
  exports: [SupplierService],
})
export class SupplierModule {}
