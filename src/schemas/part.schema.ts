import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PartDocument = Part & Document;

export enum PartType {
  RAW = 'RAW',
  ASSEMBLED = 'ASSEMBLED',
}

@Schema()
export class Constituent {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  quantity: number;
}

const ConstituentSchema = SchemaFactory.createForClass(Constituent);

@Schema({ timestamps: true })
export class Part {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: PartType })
  type: PartType;

  @Prop({ default: 0 })
  quantity: number;

  @Prop({ type: [ConstituentSchema], default: [] })
  parts: Constituent[];

  @Prop({ required: true })
  partId: string;
}

export const PartSchema = SchemaFactory.createForClass(Part);
