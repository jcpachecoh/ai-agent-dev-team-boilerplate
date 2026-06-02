import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { createSupplierLoader } from './dataloader/supplier.loader';
import { createSupplyItemLoader } from './dataloader/supply-item.loader';
import type { GqlContext } from './context';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => ({
        autoSchemaFile: true,
        sortSchema: true,
        subscriptions: {
          'graphql-ws': true,
        },
        playground: process.env['NODE_ENV'] !== 'production',
        introspection: process.env['NODE_ENV'] !== 'production',
        context: ({ req }: { req: any }): GqlContext => ({
          req,
          user: req?.user,
          tenantId: req?.user?.tenantId,
          requestId: crypto.randomUUID(),
          loaders: {
            supplierLoader: createSupplierLoader(prisma),
            supplyItemLoader: createSupplyItemLoader(prisma),
          },
        }),
      }),
    }),
  ],
  exports: [GraphQLModule],
})
export class GraphqlModule {}
