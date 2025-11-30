import { Module } from '@nestjs/common';
import { SelectionsController } from './selections.controller';
import { SelectionsService } from './selections.service';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [SessionsModule],
  controllers: [SelectionsController],
  providers: [SelectionsService]
})
export class SelectionsModule {}
