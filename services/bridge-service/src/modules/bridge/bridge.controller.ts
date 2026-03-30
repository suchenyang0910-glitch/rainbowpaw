import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BridgeService } from './bridge.service';
import { success } from '../../common/utils/response';
import { BridgeEventDto } from './dto/bridge-event.dto';
import { GenerateLinkDto } from './dto/generate-link.dto';

@Controller('bridge')
export class BridgeController {
  constructor(private readonly bridgeService: BridgeService) {}

  @Post('events')
  async reportEvent(@Body() dto: BridgeEventDto) {
    const result = await this.bridgeService.reportEvent(dto);
    return success(result);
  }

  @Post('generate-link')
  async generateLink(@Body() dto: GenerateLinkDto) {
    const result = await this.bridgeService.generateLink(dto);
    return success(result);
  }

  @Get('deep-link/:token')
  async parseDeepLink(@Param('token') token: string) {
    const result = await this.bridgeService.parseDeepLink(token);
    return success(result);
  }
}