import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('list')
  async listServices(@Query('type') type?: string) {
    const result = await this.servicesService.listServices(type);
    return { code: 0, data: { items: result } };
  }

  @Post('book')
  async book(@Body() dto: any) {
    const result = await this.servicesService.book(dto);
    return { code: 0, data: result };
  }

  @Get('bookings')
  async getBookings(@Query('global_user_id') globalUserId?: string) {
    const result = await this.servicesService.getBookings(globalUserId);
    return { code: 0, data: { items: result } };
  }
}
