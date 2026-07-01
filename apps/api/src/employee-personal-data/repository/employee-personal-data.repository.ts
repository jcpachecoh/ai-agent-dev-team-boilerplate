import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  EmployeeWithUser,
  IEmployeePersonalDataRepository,
} from '../interfaces/employee-personal-data.interfaces';
import type { EmployeePersonalData, User } from '@prisma/client';

@Injectable()
export class EmployeePersonalDataRepository implements IEmployeePersonalDataRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEmployeeByUserId(userId: string, tenantId: string): Promise<EmployeeWithUser | null> {
    return this.prisma.employeeDetails.findFirst({
      where: { userId, tenantId, deletedAt: null },
      include: {
        user: true,
        personalData: true,
        photoStorageObject: {
          select: { id: true, key: true, visibility: true, status: true, deletedAt: true },
        },
      },
    }) as Promise<EmployeeWithUser | null>;
  }

  upsertPersonalData(
    tenantId: string,
    employeeDetailsId: string,
    data: Partial<EmployeePersonalData>,
  ): Promise<EmployeePersonalData> {
    return this.prisma.employeePersonalData.upsert({
      where: { employeeDetailsId },
      create: {
        tenantId,
        employeeDetailsId,
        ...data,
      },
      update: data,
    });
  }

  updateUserIdentity(
    tenantId: string,
    userId: string,
    data: Pick<User, 'cedula' | 'documentType' | 'email'>,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId, tenantId },
      data,
    });
  }
}
