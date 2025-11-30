import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('client')
export class SessionsController {
  constructor(private service: SessionsService) {}

  @Post('session/create')
  async createSession(@Body() body: any) {
    const { albumId, email, clientName, sendEmail, albumTitle } = body;

    if (sendEmail) {
      return this.service.sendMagicLink(albumId, email, clientName, albumTitle);
    }

    const token = await this.service.createSession(albumId, email, clientName);
    return { token };
  }

  @Post('session/magic')
  async sendMagic(@Body() body: any) {
    const { albumId, email, clientName, albumTitle } = body;
    return this.service.sendMagicLink(albumId, email, clientName, albumTitle);
  }

  @Get('session/:token')
  async validate(@Param('token') token: string) {
    return this.service.validateSession(token);
  }
}
