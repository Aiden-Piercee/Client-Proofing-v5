import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';

// DTOs
class LoginDto {
  username!: string;
  password!: string;
}

class AlbumIdParam {
  id!: string;
}

class CreateSessionDto {
  album_id!: number;
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.adminService.login(body.username, body.password);
  }

  @UseGuards(AdminGuard)
  @Get('albums')
  async getAlbums() {
    return this.adminService.getAlbums();
  }

  @UseGuards(AdminGuard)
  @Get('albums/:id')
  async getAlbum(@Param() params: AlbumIdParam) {
    return this.adminService.getAlbum(Number(params.id));
  }

  @UseGuards(AdminGuard)
  @Post('session/create')
  async createSession(@Body() body: CreateSessionDto) {
    return this.adminService.createAnonymousSession(body.album_id);
  }

  @UseGuards(AdminGuard)
  @Get('sessions')
  async listSessions() {
    return this.adminService.listSessions();
  }
}
