import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { LinkUserDto } from './dto/link-user.dto';
import { UpsertTagsDto } from './dto/upsert-tags.dto';
import { BotUserMappingEntity } from './entities/bot-user-mapping.entity';
import { GlobalUserEntity } from './entities/global-user.entity';
import { UserTagEntity } from './entities/user-tag.entity';
import { UserProfileEntity } from './entities/user-profile.entity';

@Injectable()
export class GlobalUserService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(GlobalUserEntity)
    private readonly globalUserRepo: Repository<GlobalUserEntity>,
    @InjectRepository(BotUserMappingEntity)
    private readonly mappingRepo: Repository<BotUserMappingEntity>,
    @InjectRepository(UserTagEntity)
    private readonly tagRepo: Repository<UserTagEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profileRepo: Repository<UserProfileEntity>,
  ) {}

  private newGlobalUserId() {
    const suffix = randomBytes(9).toString('hex');
    return `g_${suffix}`;
  }

  async linkUser(dto: LinkUserDto) {
    return this.dataSource.transaction(async (manager) => {
      const mappingRepo = manager.getRepository(BotUserMappingEntity);
      const globalUserRepo = manager.getRepository(GlobalUserEntity);

      const existingMapping = await mappingRepo.findOne({
        where: { source_bot: dto.source_bot, source_user_id: dto.source_user_id },
      });

      if (existingMapping) {
        await globalUserRepo.update(
          { global_user_id: existingMapping.global_user_id },
          {
            telegram_id: dto.telegram_id ? String(dto.telegram_id) : undefined,
            username: dto.username || undefined,
            last_active_at: new Date(),
            updated_at: new Date(),
          },
        );

        return { global_user_id: existingMapping.global_user_id, is_new: false };
      }

      let user: GlobalUserEntity | null = null;
      if (dto.telegram_id) {
        user = await globalUserRepo.findOne({ where: { telegram_id: String(dto.telegram_id) } });
      }

      let isNew = false;
      if (!user) {
        isNew = true;
        const globalUserId = this.newGlobalUserId();
        user = globalUserRepo.create({
          global_user_id: globalUserId,
          telegram_id: dto.telegram_id ? String(dto.telegram_id) : null,
          username: dto.username || null,
          first_source: dto.first_source || null,
          primary_bot:
            dto.source_bot === 'claw_bot'
              ? 'claw'
              : dto.source_bot === 'rainbowpaw_bot'
                ? 'rainbowpaw'
                : null,
          pet_type: 'unknown',
          pet_age: null,
          spend_total: '0',
          spend_level: 'low',
          activity_score: '0',
          last_active_at: new Date(),
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
        });
        await globalUserRepo.save(user);
      } else {
        await globalUserRepo.update(
          { id: user.id },
          {
            telegram_id: user.telegram_id || (dto.telegram_id ? String(dto.telegram_id) : null),
            username: dto.username || user.username,
            first_source: user.first_source || dto.first_source || null,
            last_active_at: new Date(),
            updated_at: new Date(),
          },
        );
      }

      await mappingRepo.save(
        mappingRepo.create({
          global_user_id: user.global_user_id,
          source_bot: dto.source_bot,
          source_user_id: dto.source_user_id,
          telegram_id: dto.telegram_id ? String(dto.telegram_id) : null,
          created_at: new Date(),
        }),
      );

      return { global_user_id: user.global_user_id, is_new: isNew };
    });
  }

  async getProfile(globalUserId: string) {
    if (!globalUserId) throw new NotFoundException('user not found');

    const user = await this.globalUserRepo.findOne({ where: { global_user_id: globalUserId } });
    if (!user) throw new NotFoundException('user not found');

    const profile = await this.profileRepo.findOne({ where: { global_user_id: globalUserId } });
    const tags = await this.tagRepo.find({ where: { global_user_id: globalUserId } });
    return {
      global_user_id: user.global_user_id,
      telegram_id: user.telegram_id ? Number(user.telegram_id) : null,
      username: user.username,
      pet_type: profile?.pet_type || user.pet_type,
      pet_age: profile?.pet_age ?? ((user as any).pet_age ?? null),
      pet_age_stage: profile?.pet_age_stage || ((user as any).pet_age_stage ?? null),
      pet_weight_kg: profile?.pet_weight_kg ? Number(profile.pet_weight_kg) : null,
      elder_pet_flag: profile?.elder_pet_flag || false,
      health_issues: profile?.health_issues || null,
      spend_total: Number(user.spend_total || 0),
      spend_level: user.spend_level,
      activity_score: Number((user as any).activity_score || 0),
      status: user.status,
      tags: tags.map((t) => ({
        tag_key: t.tag_key,
        tag_value: t.tag_value,
        score: Number(t.score || 0),
      })),
    };
  }

  async updatePetProfile(globalUserId: string, payload: any) {
    return this.dataSource.transaction(async (manager) => {
      const globalUserRepo = manager.getRepository(GlobalUserEntity);
      const profileRepo = manager.getRepository(UserProfileEntity);

      const user = await globalUserRepo.findOne({ where: { global_user_id: globalUserId } });
      if (!user) throw new NotFoundException('user not found');

      const updateData: any = { updated_at: new Date() };
      if (payload.petType) updateData.pet_type = payload.petType;
      if (payload.petAgeStage) updateData.pet_age_stage = payload.petAgeStage;
      if (payload.petAge) updateData.pet_age = String(payload.petAge);

      await globalUserRepo.update({ id: user.id }, updateData);

      let profile = await profileRepo.findOne({ where: { global_user_id: globalUserId } });
      if (!profile) {
        profile = profileRepo.create({
          global_user_id: globalUserId,
          pet_type: payload.petType || null,
          pet_age: payload.petAge ? Number(payload.petAge) : null,
          pet_age_stage: payload.petAgeStage || null,
          pet_weight_kg: payload.petWeightKg ? String(payload.petWeightKg) : null,
          health_issues: payload.healthIssues || null,
          elder_pet_flag: false,
          created_at: new Date(),
          updated_at: new Date(),
        });
      } else {
        if (payload.petType) profile.pet_type = payload.petType;
        if (payload.petAge) profile.pet_age = Number(payload.petAge);
        if (payload.petAgeStage) profile.pet_age_stage = payload.petAgeStage;
        if (payload.petWeightKg) profile.pet_weight_kg = String(payload.petWeightKg);
        if (payload.healthIssues) profile.health_issues = payload.healthIssues;
        profile.updated_at = new Date();
      }

      if (profile.pet_age_stage === '7+' || profile.pet_age_stage === 'elder' || (profile.pet_age && profile.pet_age >= 7)) {
        profile.elder_pet_flag = true;
      }

      await profileRepo.save(profile);

      return { global_user_id: globalUserId, updated: true };
    });
  }

  async upsertTags(dto: UpsertTagsDto) {
    const globalUserId = dto.global_user_id;
    const tags = dto.tags.map((t) => ({
      global_user_id: globalUserId,
      tag_key: t.tag_key,
      tag_value: typeof t.tag_value === 'undefined' ? null : t.tag_value,
      score: typeof t.score === 'number' ? String(t.score) : '1',
      updated_at: new Date(),
    }));

    await this.tagRepo.upsert(tags, {
      conflictPaths: ['global_user_id', 'tag_key'],
    });

    return { global_user_id: globalUserId, updated: dto.tags.length };
  }
}
