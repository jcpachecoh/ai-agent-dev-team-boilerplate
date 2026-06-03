import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Public()
@Controller()
export class AppController {
  /* istanbul ignore next */
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealthAlias() {
    return this.appService.getHealth();
  }

  @Get()
  getHealth() {
    return this.appService.getHealth();
  }
}
