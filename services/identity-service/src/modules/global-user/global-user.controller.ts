import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GlobalUserService } from './global-user.service';
import { LinkUserDto } from './dto/link-user.dto';
import { UpsertTagsDto } from './dto/upsert-tags.dto';
import { success } from '../../common/utils/response';

@Controller('identity')
export class GlobalUserController {
  constructor(private readonly globalUserService: GlobalUserService) {}

  @Post('link-user')
  async linkUser(@Body() dto: LinkUserDto) {
    const result = await this.globalUserService.linkUser(dto);
    return success(result);
  }

  @Get('profile/:globalUserId')
  async getProfile(@Param('globalUserId') globalUserId: string) {
    const result = await this.globalUserService.getProfile(globalUserId);
    return success(result);
  }

  @Post('profile/:globalUserId/pet')
  async updatePetProfile(
    @Param('globalUserId') globalUserId: string,
    @Body() body: any,
  ) {
    const result = await this.globalUserService.updatePetProfile(globalUserId, body);
    return success(result);
  }

  @Post('tags/upsert')
  async upsertTags(@Body() dto: UpsertTagsDto) {
    const result = await this.globalUserService.upsertTags(dto);
    return success(result);
  }
}