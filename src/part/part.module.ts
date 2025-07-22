import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Part, PartSchema } from '../schemas/part.schema';
import { PartController } from './part.controller';
import { PartService } from './part.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Part.name, schema: PartSchema }]),
  ],
  controllers: [PartController],
  providers: [PartService],
})
export class PartModule {}
