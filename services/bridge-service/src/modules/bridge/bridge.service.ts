import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { BridgeEventDto } from './dto/bridge-event.dto';
import { GenerateLinkDto } from './dto/generate-link.dto';
import { BridgeEventEntity } from './entities/bridge-event.entity';
import { DeepLinkTokenEntity } from './entities/deep-link-token.entity';

@Injectable()
export class BridgeService {
  constructor(
    @InjectRepository(BridgeEventEntity)
    private readonly eventRepo: Repository<BridgeEventEntity>,
    @InjectRepository(DeepLinkTokenEntity)
    private readonly tokenRepo: Repository<DeepLinkTokenEntity>,
  ) {}

  async reportEvent(dto: BridgeEventDto) {
    const idem = String(dto.idempotency_key || '').trim();
    if (idem) {
      const existed = await this.eventRepo.findOne({ where: { idempotency_key: idem } });
      if (existed)
        return { recorded: false, deduped: true, event_name: existed.event_name };
    }

    await this.eventRepo.save(
      this.eventRepo.create({
        event_name: dto.event_name,
        global_user_id: dto.global_user_id,
        source_bot: dto.source_bot,
        idempotency_key: idem || null,
        source_user_id: dto.source_user_id || null,
        telegram_id: typeof dto.telegram_id === 'number' ? String(dto.telegram_id) : null,
        event_data: dto.event_data || null,
        created_at: new Date(),
      }),
    );

    return { recorded: true, event_name: dto.event_name };
  }

  async generateLink(dto: GenerateLinkDto) {
    const token = `dl_${randomUUID().replace(/-/g, '')}`;
    const ttl = typeof dto.ttl_minutes === 'number' && dto.ttl_minutes > 0 ? dto.ttl_minutes : 1440;
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    await this.tokenRepo.save(
      this.tokenRepo.create({
        token,
        global_user_id: dto.global_user_id,
        from_bot: dto.from_bot,
        to_bot: dto.to_bot,
        scene: dto.scene,
        extra_data: dto.extra_data || null,
        expires_at: expiresAt,
        used_at: null,
        created_at: new Date(),
      }),
    );

    return { token, deep_link: `https://t.me/RainbowPawbot?start=${token}` };
  }

  async parseDeepLink(token: string, opts?: { to_bot?: string; consume?: boolean }) {
    if (!token) throw new NotFoundException('token not found');

    const rec = await this.tokenRepo.findOne({ where: { token } });
    if (!rec) throw new NotFoundException('token not found');

    const now = Date.now();
    const exp = rec.expires_at ? rec.expires_at.getTime() : NaN;
    const notExpired = !Number.isFinite(exp) || exp > now;

    const expectedToBot = String(opts?.to_bot || '').trim();
    const toBotOk = !expectedToBot || expectedToBot === rec.to_bot;

    const valid = notExpired && toBotOk;

    let used_at = rec.used_at;
    if (opts?.consume && valid && !used_at) {
      used_at = new Date();
      await this.tokenRepo.update({ token: rec.token }, { used_at });
    }

    return {
      valid,
      global_user_id: rec.global_user_id,
      from_bot: rec.from_bot,
      to_bot: rec.to_bot,
      scene: rec.scene,
      extra_data: rec.extra_data || {},
      used_at,
      error_reason: valid ? null : !notExpired ? 'expired' : !toBotOk ? 'to_bot_mismatch' : 'invalid',
    };
  }
}
