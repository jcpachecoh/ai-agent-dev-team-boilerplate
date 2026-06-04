import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';
import { SuitesModule } from './suites/suites.module';
import { RunsModule } from './runs/runs.module';
import { RequirementsModule } from './requirements/requirements.module';
import { MilestonesModule } from './milestones/milestones.module';
import { CasesModule } from './cases/cases.module';
import { GenerationModule } from './generation/generation.module';
import { JiraModule } from './jira/jira.module';

@Module({
  imports: [
    ProjectsModule,
    SuitesModule,
    RunsModule,
    RequirementsModule,
    MilestonesModule,
    CasesModule,
    GenerationModule,
    JiraModule,
  ],
})
export class TestlabModule {}
