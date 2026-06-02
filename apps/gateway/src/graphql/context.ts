import { IncomingMessage } from 'http';
import { DataLoaders } from './dataloader/dataloader.interface';
import type { JwtPayload } from '../auth/interfaces/auth.interfaces';

export interface GqlContext {
  req: IncomingMessage & { user?: JwtPayload };
  user?: JwtPayload;
  tenantId?: string;
  requestId: string;
  loaders: DataLoaders;
}
