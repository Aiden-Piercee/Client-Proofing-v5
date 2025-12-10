import { Module } from '@nestjs/common';
import { KokenService } from './koken.service';

@Module({
  providers: [KokenService],
  exports: [KokenService]
})
export class KokenModule {}
