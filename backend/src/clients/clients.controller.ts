import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { LoginDto } from './dto/login.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  listClients() {
    return this.clientsService.listClients();
  }

  @Get(':id')
  getClient(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.getClient(id);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.clientsService.login(body.email, body.accessCode);
  }

  @Post('logout')
  logout(@Body('token') token: string) {
    return this.clientsService.logout(token);
  }

  @Get('sessions/:token')
  validateSession(@Param('token') token: string) {
    return this.clientsService.validateSession(token);
  }
}
