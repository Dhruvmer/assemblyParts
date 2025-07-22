import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, startSession, Connection } from 'mongoose';
import { Part, PartDocument, PartType } from '../schemas/part.schema';
import { CreatePartDto } from '../dto/create-part.dto';
import { UpdateQuantityDto } from '../dto/update-quantity.dto';

@Injectable()
export class PartService {
  constructor(@InjectModel(Part.name) private partModel: Model<PartDocument>, @InjectConnection() private readonly connection: Connection) { }

  async create(createPartDto: CreatePartDto): Promise<Part> {
    const { name, type } = createPartDto;

    // Generate unique partId like "bolt-1"
    const partNameLower = name.toLowerCase();
    const count = await this.partModel.countDocuments({ name: new RegExp(`^${name}$`, 'i') });
    const partId = `${partNameLower}-${count + 1}`;

    const createdPart = new this.partModel({ ...createPartDto, partId });
    try {
      return await createdPart.save();
    } catch (e) {
      throw new BadRequestException(`Part ${name} already exists`);
    }
  }

  async findAll(): Promise<Part[]> {
    return this.partModel.find().exec();
  }

  async findOne(id: string): Promise<Part> {
    const part = await this.partModel.findOne({ partId: id }).exec();
    if (!part) {
      throw new NotFoundException(`Part ${id} not found`);
    }
    return part;
  }

  async updateQuantity(id: string, updateQuantityDto: UpdateQuantityDto): Promise<Part> {
    const part = await this.findOne(id) as PartDocument;
    part.quantity = updateQuantityDto.quantity;
    return part.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.partModel.deleteOne({ partId: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Part ${id} not found`);
    }
  }

  async addInventory(partId: string, updateDto: UpdateQuantityDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const part = await this.partModel.findOne({ partId }).session(session);
      if (!part) throw new NotFoundException('Part not found');

      if (part.type === PartType.RAW) {
        part.quantity += updateDto.quantity;
        await part.save({ session });
      } else {
        await this.assemblePart(part, updateDto.quantity, session);
      }

      await session.commitTransaction();
      return { status: 'SUCCESS' };
    } catch (err) {
      await session.abortTransaction();
      return { status: 'FAILED', message: err.message };
    } finally {
      session.endSession();
    }
  }

  private async assemblePart(
    part: PartDocument,
    quantity: number,
    session: ClientSession,
  ) {
    const requiredParts = await this.flattenAssembly(part.parts, quantity, session);

    for (const { id, requiredQty } of requiredParts) {
      const p = await this.partModel.findOne({ partId: id }).session(session);
      if (!p || p.quantity < requiredQty) {
        throw new Error(`Insufficient quantity - ${id}`);
      }
    }

    for (const { id, requiredQty } of requiredParts) {
      await this.partModel.findOneAndUpdate(
        { partId: id },
        { $inc: { quantity: -requiredQty } },
        { session },
      );
    }

    await this.partModel.findOneAndUpdate(
      { partId: part.partId },
      { $inc: { quantity } },
      { session },
    );
  }

  private async flattenAssembly(parts: { id: string; quantity: number }[], multiplier: number, session: ClientSession) {
    const result: Record<string, number> = {};

    const recurse = async (partId: string, factor: number) => {
      const part = await this.partModel.findOne({ partId }).session(session);
      if (!part) throw new NotFoundException(`Part ${partId} not found`);

      if (part.type === PartType.RAW) {
        result[partId] = (result[partId] || 0) + factor;
      } else {
        for (const p of part.parts) {
          await recurse(p.id, factor * p.quantity);
        }
      }
    };

    for (const p of parts) {
      await recurse(p.id, p.quantity * multiplier);
    }

    return Object.entries(result).map(([id, requiredQty]) => ({ id, requiredQty }));
  }

  private async validateConstituents(parts: { id: string }[]) {
    for (const p of parts) {
      const exists = await this.partModel.exists({ partId: p.id });
      if (!exists) throw new NotFoundException(`Part ${p.id} not found`);
    }
  }

  private async detectCircularDependency(parts: { id: string }[], newName: string): Promise<boolean> {
    const visited = new Set<string>();

    const dfs = async (id: string): Promise<boolean> => {
      if (visited.has(id)) return true;

      visited.add(id);
      const part = await this.partModel.findOne({ partId: id });
      if (!part || part.type === PartType.RAW) return false;

      for (const child of part.parts) {
        if (await dfs(child.id)) return true;
      }

      visited.delete(id);
      return false;
    };

    for (const p of parts) {
      if (await dfs(p.id)) return true;
    }

    return false;
  }
}
