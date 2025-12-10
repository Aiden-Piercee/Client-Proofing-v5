import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { AlbumsModule } from '../albums/albums.module';
import { DatabaseModule } from '../database/database.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    SessionsModule,
    AlbumsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('ADMIN_JWT_SECRET');

        if (!secret) {
          throw new Error('ADMIN_JWT_SECRET must be configured for admin access.');
        }

        return {
          secret,
          signOptions: { expiresIn: '2h' }
        };
      }
    })
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
