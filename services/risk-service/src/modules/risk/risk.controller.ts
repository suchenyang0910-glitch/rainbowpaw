import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { RiskService } from './risk.service';

@Controller('risk')
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Post('activity')
  async reportActivity(@Body() dto: { global_user_id: string; activity_type: string; metadata: any }) {
    const result = await this.riskService.reportActivity(dto);
    return { code: 0, data: result };
  }

  @Get('alerts')
  async getAlerts(@Query('status') status?: string) {
    const result = await this.riskService.getAlerts(status);
    return { code: 0, data: { items: result } };
  }

  @Post('alerts/:alertId/status')
  async updateAlertStatus(@Param('alertId') alertId: string, @Body() dto: { status: string }) {
    const result = await this.riskService.updateAlertStatus(alertId, dto.status);
    return { code: 0, data: result };
  }

  @Post('users/:globalUserId/freeze')
  async freezeUser(
    @Param('globalUserId') globalUserId: string,
    @Body() dto: { reason: string; related_alert_id?: string; frozen_by?: string },
  ) {
    const result = await this.riskService.freezeUser(globalUserId, dto.reason, dto.related_alert_id, dto.frozen_by);
    return { code: 0, data: result };
  }

  @Post('users/:globalUserId/unfreeze')
  async unfreezeUser(
    @Param('globalUserId') globalUserId: string,
    @Body() dto: { unfrozen_reason: string },
  ) {
    const result = await this.riskService.unfreezeUser(globalUserId, dto.unfrozen_reason);
    return { code: 0, data: result };
  }

  @Get('users/:globalUserId/status')
  async checkUserStatus(@Param('globalUserId') globalUserId: string) {
    const result = await this.riskService.checkUserStatus(globalUserId);
    return { code: 0, data: result };
  }
}
