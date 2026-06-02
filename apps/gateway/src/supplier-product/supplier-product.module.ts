import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupplierProductRepository } from './repository/supplier-product.repository';
import { SupplierProductService } from './service/supplier-product.service';
import { SupplierProductResolver } from './resolver/supplier-product.resolver';

@Module({
  imports: [PrismaModule],
  providers: [SupplierProductRepository, SupplierProductService, SupplierProductResolver],
  exports: [SupplierProductService],
})
export class SupplierProductModule {}
