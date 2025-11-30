import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { KokenModule } from '../koken/koken.module';

@Module({
  imports: [KokenModule],
  controllers: [ImagesController],
  providers: [ImagesService]
})
export class ImagesModule {}
