import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserRepository } from './repository/user.repository';
import { UserService } from './service/user.service';
import { UserResolver } from './resolver/user.resolver';

@Module({
  imports: [PrismaModule],
  providers: [UserRepository, UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
