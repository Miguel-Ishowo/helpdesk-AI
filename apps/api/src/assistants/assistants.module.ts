import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assistant, Membership } from '../database/entities';
import { OrgRoleGuard } from '../organizations/guards/org-role.guard';
import { AssistantsController } from './assistants.controller';
import { AssistantsService } from './assistants.service';

const hasDb = Boolean(process.env.DATABASE_URL || process.env.DB_HOST || process.env.DB_NAME);

@Module({
  imports: [...(hasDb ? [TypeOrmModule.forFeature([Assistant, Membership])] : [])],
  controllers: hasDb ? [AssistantsController] : [],
  providers: hasDb ? [AssistantsService, OrgRoleGuard] : [],
  exports: hasDb ? [AssistantsService] : [],
})
export class AssistantsModule {}
