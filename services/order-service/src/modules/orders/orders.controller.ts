import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { success } from '../../common/utils/response';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(
    @Body() dto: CreateOrderDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    const result = await this.ordersService.create(dto, idempotencyKey);
    return success(result);
  }

  @Get()
  async list(
    @Query('user_id') user_id?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.ordersService.list({
      user_id,
      type,
      status,
      from,
      to,
      page: Number(page || 1),
      pageSize: Number(pageSize || 20),
    });
    return success(result);
  }

  @Get(':orderId')
  async get(@Param('orderId') orderId: string) {
    const result = await this.ordersService.get(orderId);
    return success(result);
  }

  @Post(':orderId/status')
  async updateStatus(@Param('orderId') orderId: string, @Body() dto: UpdateStatusDto) {
    const result = await this.ordersService.updateStatus(orderId, dto.status, dto.remark);
    return success(result);
  }
}

