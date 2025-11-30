import { Module } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { AlbumsController } from './albums.controller';
import { KokenModule } from '../koken/koken.module';
import { DatabaseModule } from '../database/database.module';
import { SessionsModule } from '../sessions/sessions.module';  // ✅ ADD THIS

@Module({
  imports: [
    DatabaseModule,
    KokenModule,
    SessionsModule,     // ✅ CRITICAL
  ],
  controllers: [AlbumsController],
  providers: [AlbumsService],
  exports: [AlbumsService],
})
export class AlbumsModule {}
