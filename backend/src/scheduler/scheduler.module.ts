import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { KokenModule } from '../koken/koken.module';
import { EmailModule } from '../email/email.module';
import { EditScheduler } from './edit.scheduler';

@Module({
  imports: [ScheduleModule, DatabaseModule, KokenModule, EmailModule],
  providers: [EditScheduler]
})
export class SchedulerModule {}
