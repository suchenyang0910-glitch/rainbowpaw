import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { success } from '../../common/utils/response';
import { GlobalUserEntity } from '../global-user/entities/global-user.entity';

@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(GlobalUserEntity)
    private readonly globalUsersRepo: Repository<GlobalUserEntity>,
  ) {}

  @Get('users')
  async users(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('petType') petType?: string,
    @Query('spendLevel') spendLevel?: string,
    @Query('status') status?: string,
  ) {
    const page = Math.max(1, Number(current || 1));
    const size = Math.min(200, Math.max(1, Number(pageSize || 20)));
    const kw = String(keyword || '').trim();
    const pt = String(petType || '').trim();
    const sl = String(spendLevel || '').trim();
    const st = String(status || '').trim();

    const qb = this.globalUsersRepo.createQueryBuilder('u');
    if (pt) qb.andWhere('u.pet_type = :pt', { pt });
    if (sl) qb.andWhere('u.spend_level = :sl', { sl });
    if (st) qb.andWhere('u.status = :st', { st });
    if (kw) {
      const asNum = Number(kw);
      if (Number.isFinite(asNum)) {
        qb.andWhere('(u.telegram_id = :tgId OR u.global_user_id ILIKE :kw OR u.username ILIKE :kw)', {
          tgId: String(Math.floor(asNum)),
          kw: `%${kw}%`,
        });
      } else {
        qb.andWhere('(u.global_user_id ILIKE :kw OR u.username ILIKE :kw)', { kw: `%${kw}%` });
      }
    }

    qb.orderBy('u.created_at', 'DESC');
    qb.skip((page - 1) * size).take(size);

    const [rows, total] = await qb.getManyAndCount();
    return success({
      items: rows.map((r) => ({
        global_user_id: r.global_user_id,
        telegram_id: r.telegram_id ? Number(r.telegram_id) : null,
        username: r.username,
        pet_type: r.pet_type,
        spend_total: Number(r.spend_total || 0),
        spend_level: r.spend_level,
        status: r.status,
        last_active_at: r.last_active_at ? r.last_active_at.toISOString() : null,
      })),
      total,
      current: page,
      pageSize: size,
    });
  }

  @Post('users/:globalUserId/freeze')
  async freezeUser(@Param('globalUserId') globalUserId: string) {
    await this.globalUsersRepo.update({ global_user_id: globalUserId }, { status: 'frozen' });
    return success({ global_user_id: globalUserId, status: 'frozen' });
  }

  @Post('users/:globalUserId/unfreeze')
  async unfreezeUser(@Param('globalUserId') globalUserId: string) {
    await this.globalUsersRepo.update({ global_user_id: globalUserId }, { status: 'active' });
    return success({ global_user_id: globalUserId, status: 'active' });
  }
}

