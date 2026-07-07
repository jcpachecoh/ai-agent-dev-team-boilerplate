import { AuthGuard } from '@nestjs/passport';

/** Accepts MES operator JWT or platform (email) JWT — web-app uses the latter. */
export class PlantAuthGuard extends AuthGuard(['mes-jwt', 'jwt']) {}
