import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { env } from '../config/env';

@Controller()
export class HealthController {
  @Public()
  @Get('health')
  health(): { status: string; service: string; uptime: number; timestamp: string; env: string } {
    return {
      status: 'ok',
      service: '@restopsiq/gateway',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
    };
  }

  @Public()
  @Get('graphql')
  graphqlLanding(): { status: string; message: string; endpoint: string } {
    return {
      status: 'ok',
      message: 'GraphQL endpoint is available via POST requests.',
      endpoint: '/graphql',
    };
  }
}
