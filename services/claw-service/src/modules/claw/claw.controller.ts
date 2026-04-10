import { Controller, Get, Post, Body, Headers, Param } from '@nestjs/common';
import { ClawService } from './claw.service';

@Controller('claw')
export class ClawController {
  constructor(private readonly clawService: ClawService) {}

  @Get('pool/active')
  async getActivePool() {
    const result = await this.clawService.getActivePool();
    return { code: 0, data: result };
  }

  @Post('play')
  async play(
    @Body() dto: { global_user_id: string; pool_id: string },
    @Headers('x-idempotency-key') idemKey: string,
  ) {
    const result = await this.clawService.play(dto.global_user_id, dto.pool_id, idemKey);
    return { code: 0, data: result };
  }

  @Post('play/:playId/recycle')
  async recycle(
    @Param('playId') playId: string,
    @Body() dto: { global_user_id: string },
  ) {
    const result = await this.clawService.recycle(dto.global_user_id, playId);
    return { code: 0, data: result };
  }
}
