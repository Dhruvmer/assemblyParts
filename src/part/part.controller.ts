import { Controller, Post, Param, Body, Get, Patch, Delete } from '@nestjs/common';
import { PartService } from './part.service';
import { CreatePartDto } from '../dto/create-part.dto';
import { UpdateQuantityDto } from '../dto/update-quantity.dto';

@Controller('api/part')
export class PartController {
  constructor(private readonly partService: PartService) {}

  @Post()
  async create(@Body() createPartDto: CreatePartDto) {
    const part = await this.partService.create(createPartDto);

    return {
      id: part.partId,
      name: part.name,
      type: part.type,
    };
  }

  @Post(':id')
  async addInventory(@Param('id') id: string, @Body() updateDto: UpdateQuantityDto) {
    return this.partService.addInventory(id, updateDto);
  }

  @Get()
  async findAll() {
    return this.partService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.partService.findOne(id);
  }

  @Patch(':id/quantity')
  async updateQuantity(@Param('id') id: string, @Body() updateQuantityDto: UpdateQuantityDto) {
    return this.partService.updateQuantity(id, updateQuantityDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.partService.remove(id);
  }
}
