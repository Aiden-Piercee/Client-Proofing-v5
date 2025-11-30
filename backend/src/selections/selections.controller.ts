import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { SelectionsService } from './selections.service';
import { SessionsService } from '../sessions/sessions.service';

@Controller('selections')
export class SelectionsController {
  constructor(
    private readonly selectionsService: SelectionsService,
    private readonly sessionsService: SessionsService,
  ) {}

  @Post(':sessionToken/:imageId')
  async updateSelection(
    @Param('sessionToken') sessionToken: string,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Body('state') state: string | null,
    @Body('print') print: boolean | undefined,
  ) {
    const session = await this.sessionsService.validateSession(sessionToken);

    if (!session.client_id) {
      throw new BadRequestException('Session is not linked to a client.');
    }

    // CLEAR selection (state = null)
    if (state === null) {
      return this.selectionsService.clearSelection(
        session.client_id,
        imageId,
      );
    }

    // UPSERT both state + print
    return this.selectionsService.upsertSelection(
      session.client_id,
      imageId,
      state as any,
      print,
    );
  }

  @Get(':sessionToken')
  async getSelections(@Param('sessionToken') sessionToken: string) {
    const session = await this.sessionsService.validateSession(sessionToken);

    if (!session.client_id) {
      throw new BadRequestException('Session is not linked to a client.');
    }

    return this.selectionsService.getSelectionsForClient(session.client_id);
  }
}
