import { Controller, Get, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { Public } from '../auth/decorators/public.decorator';
import { metricsRegistry } from '../utils/monitoring';

@Controller()
export class MetricsController {
  @Public()
  @Get('metrics')
  async metrics(@Res() res: FastifyReply): Promise<void> {
    const metrics = await metricsRegistry.metrics();
    res.header('Content-Type', metricsRegistry.contentType);
    res.send(metrics);
  }
}
