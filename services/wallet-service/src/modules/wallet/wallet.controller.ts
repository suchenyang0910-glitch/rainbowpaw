import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { success } from '../../common/utils/response';
import { EarnDto } from './dto/earn.dto';
import { SpendDto } from './dto/spend.dto';
import { RecycleDto } from './dto/recycle.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('logs/:globalUserId')
  async getLogs(
    @Param('globalUserId') globalUserId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.walletService.getLogs(globalUserId, Number(page || 1), Number(pageSize || 20));
    return success(result);
  }

  @Get(':globalUserId')
  async getWallet(@Param('globalUserId') globalUserId: string) {
    const result = await this.walletService.getWallet(globalUserId);
    return success(result);
  }

  @Post('earn')
  async earn(@Body() dto: EarnDto, @Headers('x-idempotency-key') idemKey: string) {
    const result = await this.walletService.earn(dto, idemKey);
    return success(result);
  }

  @Post('spend')
  async spend(@Body() dto: SpendDto, @Headers('x-idempotency-key') idemKey: string) {
    const result = await this.walletService.spend(dto, idemKey);
    return success(result);
  }

  @Post('recycle')
  async recycle(@Body() dto: RecycleDto, @Headers('x-idempotency-key') idemKey: string) {
    const result = await this.walletService.recycle(dto, idemKey);
    return success(result);
  }

  @Post('withdraw')
  async withdraw(@Body() dto: WithdrawDto, @Headers('x-idempotency-key') idemKey: string) {
    const result = await this.walletService.withdraw(dto, idemKey);
    return success(result);
  }

  @Get('settings/:key')
  async getSetting(@Param('key') key: string) {
    const result = await this.walletService.getBusinessSetting(key, '');
    return success({ key, value: result });
  }
}
