import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MemorialService } from './memorial.service';

@Controller('memorial')
export class MemorialController {
  constructor(private readonly memorialService: MemorialService) {}

  @Get('list')
  async listPages(@Query('global_user_id') globalUserId?: string) {
    const result = await this.memorialService.listPages(globalUserId);
    return { code: 0, data: { pages: result } };
  }

  @Get(':memorialId')
  async getPage(@Param('memorialId') memorialId: string) {
    const result = await this.memorialService.getPage(memorialId);
    return { code: 0, data: result };
  }

  @Post()
  async createPage(@Body() dto: any) {
    const result = await this.memorialService.createPage(dto);
    return { code: 0, data: result };
  }

  @Post(':memorialId/candle')
  async lightCandle(@Param('memorialId') memorialId: string) {
    const result = await this.memorialService.lightCandle(memorialId);
    return { code: 0, data: result };
  }
}
