import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import databaseConfig from './config/database.config';

import { KokenModule } from './koken/koken.module';
import { AlbumsModule } from './albums/albums.module';
import { ImagesModule } from './images/images.module';
import { ClientsModule } from './clients/clients.module';
import { SelectionsModule } from './selections/selections.module';
import { SyncModule } from './sync/sync.module';
import { DatabaseModule } from './database/database.module';
import { SessionsModule } from './sessions/sessions.module';
import { EmailModule } from './email/email.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        __dirname + '/../.env', // <── forced absolute path
        '.env'
      ],
      load: [databaseConfig],
    }),

    ScheduleModule.forRoot(),
    DatabaseModule,
    EmailModule,
    KokenModule,
    AlbumsModule,
    ImagesModule,
    ClientsModule,
    SelectionsModule,
    SessionsModule,
    SyncModule,
    AdminModule,
    SchedulerModule,
  ],
})
export class AppModule {}
