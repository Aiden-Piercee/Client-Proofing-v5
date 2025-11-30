import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { KokenModule } from '../koken/koken.module';

@Module({
  imports: [KokenModule],
  controllers: [SyncController],
  providers: [SyncService]
})
export class SyncModule {}
