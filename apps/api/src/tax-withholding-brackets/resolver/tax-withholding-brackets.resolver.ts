import { Resolver } from '@nestjs/graphql';

/**
 * GraphQL adapter shell — brackets are consumed internally by ReportsModule via
 * TaxWithholdingBracketsService.preload(); no public queries in OS-594 scope.
 */
@Resolver()
// eslint-disable-next-line @typescript-eslint/naming-convention
export class TaxWithholdingBracketsResolver {}
