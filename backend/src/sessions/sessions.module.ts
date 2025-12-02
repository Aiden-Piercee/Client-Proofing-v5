import { Module, forwardRef } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';
import { AlbumsModule } from '../albums/albums.module';

@Module({
  imports: [DatabaseModule, EmailModule, forwardRef(() => AlbumsModule)],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],   // <-- CRITICAL LINE
})
export class SessionsModule {}
