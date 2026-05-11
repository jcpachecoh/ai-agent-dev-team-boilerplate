import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; service: string } {
    return { status: 'ok', service: 'restopsiq-api' };
  }
}
