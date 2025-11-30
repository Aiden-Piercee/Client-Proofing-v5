import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

import { JwtModule } from '@nestjs/jwt';
import { SessionsModule } from '../sessions/sessions.module';
import { AlbumsModule } from '../albums/albums.module';
import { DatabaseModule } from '../database/database.module';

import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [
    DatabaseModule,
    SessionsModule,
    AlbumsModule,
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET,
      signOptions: { expiresIn: '2h' }
    })
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
