import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PayrollController } from './controller/payroll.controller';
import { PayrollService } from './service/payroll.service';
import { PayrollRepository } from './repository/payroll.repository';
import { EmployeesResolver } from './resolver/employees.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [PayrollController],
  providers: [PayrollService, PayrollRepository, EmployeesResolver],
  exports: [PayrollService],
})
export class PayrollModule {}
