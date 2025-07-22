import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PartModule } from './part/part.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://<username>:<password>@cluster0.u7bgw.mongodb.net/assembly-parts?retryWrites=true&w=majority'),
    PartModule,
  ],
})
export class AppModule {}
