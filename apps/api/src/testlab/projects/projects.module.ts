import { Module } from '@nestjs/common';
import { ProjectsController } from './controller/projects.controller';
import { ProjectsService } from './service/projects.service';
import { ProjectsRepository } from './repository/projects.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController],
  providers: [ProjectsRepository, ProjectsService],
})
export class ProjectsModule {}
