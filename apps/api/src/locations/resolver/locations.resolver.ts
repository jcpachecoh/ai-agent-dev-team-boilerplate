import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { LocationsService } from '../service/locations.service';
import {
  CreateLocationInput,
  LocationConnectionType,
  LocationType,
  toLocationType,
  UpdateLocationInput,
} from './dto';

@UseGuards(JwtAuthGuard)
@Resolver(() => LocationType)
export class LocationsResolver {
  constructor(private readonly locationsService: LocationsService) {}

  @Query(() => LocationConnectionType, { name: 'locations' })
  async locations(
    @CurrentUser() user: JwtPayload,
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ): Promise<LocationConnectionType> {
    this.locationsService.assertTenantAccess(user.tenantId, restaurantId);
    const page = await this.locationsService.findAll(user.tenantId, cursor, take);

    return {
      edges: page.items.map((node) => ({
        node: toLocationType(node),
        cursor: node.id,
      })),
      pageInfo: {
        hasNextPage: page.hasNextPage,
        endCursor: page.endCursor,
      },
    };
  }

  @Query(() => LocationType, { name: 'location' })
  async location(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
  ): Promise<LocationType> {
    this.locationsService.assertTenantAccess(user.tenantId, restaurantId);
    const result = await this.locationsService.findOne(user.tenantId, id);
    return toLocationType(result);
  }

  @Mutation(() => LocationType, { name: 'createLocation' })
  async createLocation(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: CreateLocationInput,
  ): Promise<LocationType> {
    this.locationsService.assertTenantAccess(user.tenantId, input.restaurantId);
    const result = await this.locationsService.create(user.tenantId, {
      name: input.name,
      address: input.address,
      city: input.city,
      phone: input.phone,
    });
    return toLocationType(result);
  }

  @Mutation(() => LocationType, { name: 'updateLocation' })
  async updateLocation(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateLocationInput,
  ): Promise<LocationType> {
    const result = await this.locationsService.update(user.tenantId, id, input);
    return toLocationType(result);
  }

  @Mutation(() => Boolean, { name: 'deleteLocation' })
  deleteLocation(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.locationsService.delete(user.tenantId, id);
  }

  @Mutation(() => LocationType, { name: 'toggleLocationStatus' })
  async toggleLocationStatus(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<LocationType> {
    const result = await this.locationsService.toggleStatus(user.tenantId, id);
    return toLocationType(result);
  }
}
