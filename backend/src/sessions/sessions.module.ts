import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DatabaseModule, EmailModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],   // <-- CRITICAL LINE
})
export class SessionsModule {}
