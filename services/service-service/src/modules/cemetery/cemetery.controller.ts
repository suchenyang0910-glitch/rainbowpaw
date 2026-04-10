import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CemeteryService } from './cemetery.service';

@Controller('cemetery')
export class CemeteryController {
  constructor(private readonly cemeteryService: CemeteryService) {}

  @Get('zones')
  async listZones() {
    const result = await this.cemeteryService.listZones();
    return { code: 0, data: { items: result } };
  }

  @Get('zones/:zoneId/slots')
  async getZoneSlots(@Param('zoneId') zoneId: string) {
    const result = await this.cemeteryService.getZoneSlots(zoneId);
    return { code: 0, data: result };
  }

  @Post('slots/:slotId/rent')
  async rentSlot(
    @Param('slotId') slotId: string,
    @Body() dto: { global_user_id: string; memorial_id?: string; lease_months: number },
  ) {
    const result = await this.cemeteryService.rentSlot({
      slot_id: slotId,
      ...dto,
    });
    return { code: 0, data: result };
  }
}
