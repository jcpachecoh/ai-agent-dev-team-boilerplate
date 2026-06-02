import { Resolver, Query, Args, ObjectType, Field, ID } from '@nestjs/graphql';
import { TenantService } from '../service/tenant.service';
import type { Tenant } from '../interfaces/tenant.interfaces';

@ObjectType('Tenant')
export class TenantType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
}

@Resolver(() => TenantType)
export class TenantResolver {
  constructor(private readonly tenantService: TenantService) {}

  @Query(() => TenantType, { nullable: true })
  async tenant(@Args('id', { type: () => ID }) id: string): Promise<Tenant | null> {
    return this.tenantService.findById(id);
  }

  @Query(() => [TenantType])
  async tenants(): Promise<Tenant[]> {
    return this.tenantService.findAll();
  }
}
