import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { TenantService } from '../service/tenant.service';
import { TenantType, toTenantType, UpdateTenantInput } from './dto';

@Resolver(() => TenantType)
export class TenantResolver {
  constructor(private readonly tenantService: TenantService) {}

  @Query(() => TenantType, { name: 'myTenant' })
  @UseGuards(JwtAuthGuard)
  async myTenant(@CurrentUser() user: JwtPayload): Promise<TenantType> {
    const tenant = await this.tenantService.findById(user.tenantId);
    return toTenantType(tenant);
  }

  @Query(() => TenantType, { name: 'tenant' })
  @UseGuards(JwtAuthGuard)
  async tenant(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<TenantType> {
    this.tenantService.assertTenantAccess(user.tenantId, id);
    const result = await this.tenantService.findById(id);
    return toTenantType(result);
  }

  @Query(() => [TenantType], { name: 'tenants' })
  @UseGuards(JwtAuthGuard)
  async tenants(@CurrentUser() user: JwtPayload): Promise<TenantType[]> {
    void user;
    const rows = await this.tenantService.findAll();
    return rows.map(toTenantType);
  }

  @Mutation(() => TenantType, { name: 'updateTenant' })
  @UseGuards(JwtAuthGuard)
  async updateTenant(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: UpdateTenantInput,
  ): Promise<TenantType> {
    const result = await this.tenantService.update(user.tenantId, {
      tradeName: input.tradeName,
      nit: input.nit,
      address: input.address,
      phone: input.phone,
      email: input.email,
      openingTime: input.openingTime,
      closingTime: input.closingTime,
    });

    return toTenantType(result);
  }
}
