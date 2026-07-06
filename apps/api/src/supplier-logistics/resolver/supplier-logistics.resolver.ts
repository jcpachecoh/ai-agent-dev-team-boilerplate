import { Args, Context, Field, ID, ObjectType, Query, Resolver } from '@nestjs/graphql';

import { SupplierLogisticsService } from '../service/supplier-logistics.service';

@ObjectType('SupplierLogisticsHistoryChange')
export class SupplierLogisticsHistoryChangeType {
  @Field() field!: string;
  @Field(() => String, { nullable: true }) oldValue?: string | null;
  @Field(() => String, { nullable: true }) newValue?: string | null;
}

@ObjectType('SupplierLogisticsHistoryEntry')
export class SupplierLogisticsHistoryEntryType {
  @Field(() => ID) id!: string;
  @Field() action!: string;
  @Field(() => String, { nullable: true }) actorUserId?: string | null;
  @Field(() => String, { nullable: true }) actorEmail?: string | null;
  @Field() createdAt!: Date;
  @Field(() => [SupplierLogisticsHistoryChangeType]) changes!: SupplierLogisticsHistoryChangeType[];
}

function serializeAuditValue(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

@Resolver()
export class SupplierLogisticsResolver {
  constructor(private readonly supplierLogisticsService: SupplierLogisticsService) {}

  private getTenantId(context: { req?: { headers?: Record<string, unknown> } }): string {
    const tenantId = context.req?.headers?.['x-tenant-id'];
    if (typeof tenantId !== 'string' || !tenantId.trim()) {
      throw new Error('x-tenant-id header is required');
    }
    return tenantId.trim();
  }

  @Query(() => [SupplierLogisticsHistoryEntryType])
  async supplierLogisticsHistory(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('supplierId', { type: () => ID }) supplierId: string,
  ): Promise<SupplierLogisticsHistoryEntryType[]> {
    const history = await this.supplierLogisticsService.getHistory(
      this.getTenantId(context),
      supplierId,
    );

    return history.map((entry) => ({
      id: entry.id,
      action: entry.action,
      actorUserId: entry.actorUserId,
      actorEmail: entry.actorEmail,
      createdAt: entry.createdAt,
      changes: entry.changes.map((change) => ({
        field: change.field,
        oldValue: serializeAuditValue(change.old),
        newValue: serializeAuditValue(change.new),
      })),
    }));
  }
}
