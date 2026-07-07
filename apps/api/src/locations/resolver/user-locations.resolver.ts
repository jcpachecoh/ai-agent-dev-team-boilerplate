import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserLocationsService } from '../service/user-locations.service';
import {
  LocationAssignedUserType,
  LocationType,
  toLocationAssignedUserType,
  toLocationType,
  toUserLocationType,
  UserLocationType,
} from './dto';

@UseGuards(JwtAuthGuard)
@Resolver()
export class UserLocationsResolver {
  constructor(private readonly userLocationsService: UserLocationsService) {}

  @Mutation(() => UserLocationType, { name: 'assignUserToLocation' })
  async assignUserToLocation(
    @CurrentUser() user: JwtPayload,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('locationId', { type: () => ID }) locationId: string,
  ): Promise<UserLocationType> {
    const result = await this.userLocationsService.assign(user.tenantId, userId, locationId);
    return toUserLocationType(result);
  }

  @Mutation(() => Boolean, { name: 'removeUserFromLocation' })
  removeUserFromLocation(
    @CurrentUser() user: JwtPayload,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('locationId', { type: () => ID }) locationId: string,
  ): Promise<boolean> {
    return this.userLocationsService.remove(user.tenantId, userId, locationId);
  }

  @Query(() => [LocationAssignedUserType], { name: 'locationUsers' })
  async locationUsers(
    @CurrentUser() user: JwtPayload,
    @Args('locationId', { type: () => ID }) locationId: string,
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
  ): Promise<LocationAssignedUserType[]> {
    this.userLocationsService.assertTenantAccess(user.tenantId, restaurantId);
    const users = await this.userLocationsService.getLocationUsers(user.tenantId, locationId);
    return users.map(toLocationAssignedUserType);
  }

  @Query(() => [LocationType], { name: 'userLocations' })
  async userLocations(
    @CurrentUser() user: JwtPayload,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
  ): Promise<LocationType[]> {
    this.userLocationsService.assertTenantAccess(user.tenantId, restaurantId);
    const locations = await this.userLocationsService.getUserLocations(user.tenantId, userId);
    return locations.map(toLocationType);
  }
}
