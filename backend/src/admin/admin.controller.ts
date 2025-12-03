import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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

class GenerateTokenDto {
  album_id?: number;
  album_ids?: number[];
  client_id?: number;
  client_name?: string;
  email?: string;
}

class TokenParam {
  token!: string;
}

class SessionParam {
  sessionId!: string;
}

class UpdateSessionDto {
  album_id?: number;
  client_id?: number | null;
  client_name?: string | null;
  client_email?: string | null;
}

class UpdateClientDto {
  name?: string;
  email?: string;
}

class ClientParam {
  clientId!: string;
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

  @UseGuards(AdminGuard)
  @Get('token-management')
  async listManagedTokens() {
    return this.adminService.listSessions();
  }

  @UseGuards(AdminGuard)
  @Get('token-management/resources')
  async listTokenResources() {
    return this.adminService.listTokenResources();
  }

  @UseGuards(AdminGuard)
  @Post('token-management/generate')
  async generateManagedToken(@Body() body: GenerateTokenDto) {
    return this.adminService.generateManagedToken({
      albumIds: body.album_ids ?? (body.album_id ? [body.album_id] : []),
      clientId: body.client_id,
      clientName: body.client_name ?? null,
      email: body.email ?? null,
    });
  }

  @UseGuards(AdminGuard)
  @Post('token-management/:token/albums')
  async addAlbumToToken(
    @Param() params: TokenParam,
    @Body() body: { album_id?: number; album_ids?: number[] }
  ) {
    if (body.album_ids && body.album_ids.length > 0) {
      return this.adminService.linkAlbumsToSessionToken(params.token, body.album_ids);
    }

    return this.adminService.linkAlbumToSessionToken(params.token, Number(body.album_id));
  }

  @UseGuards(AdminGuard)
  @Delete('token-management/session/:sessionId')
  async removeSession(@Param() params: SessionParam) {
    return this.adminService.removeSession(Number(params.sessionId));
  }

  @UseGuards(AdminGuard)
  @Patch('token-management/session/:sessionId')
  async updateSession(
    @Param() params: SessionParam,
    @Body() body: UpdateSessionDto,
  ) {
    return this.adminService.updateSessionDetails(Number(params.sessionId), {
      albumId: body.album_id,
      clientId: body.client_id,
      clientName: body.client_name,
      clientEmail: body.client_email,
    });
  }

  @UseGuards(AdminGuard)
  @Patch('token-management/client/:clientId')
  async updateClient(
    @Param() params: ClientParam,
    @Body() body: UpdateClientDto
  ) {
    return this.adminService.updateClientDetails(Number(params.clientId), {
      name: body.name ?? null,
      email: body.email ?? null,
    });
  }
}
