import { Controller, Get, Query } from '@nestjs/common';
import { success } from '../../common/utils/response';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  async daily(@Query('date') date?: string) {
    const result = await this.reportsService.daily({ date });
    return success(result);
  }

  @Get('profit')
  async profit(@Query('days') days?: string) {
    const result = await this.reportsService.profit({ days: Number(days || 7) });
    return success(result);
  }
}

