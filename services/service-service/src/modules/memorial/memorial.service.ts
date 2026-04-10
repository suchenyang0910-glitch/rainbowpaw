import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { MemorialPageEntity } from './entities/memorial-page.entity';

@Injectable()
export class MemorialService {
  constructor(
    @InjectRepository(MemorialPageEntity)
    private readonly memorialRepo: Repository<MemorialPageEntity>,
  ) {}

  private generateId(prefix: string) {
    return `${prefix}_${randomBytes(8).toString('hex')}`;
  }

  async listPages(globalUserId?: string) {
    const where: any = { status: 'active' };
    if (globalUserId) where.global_user_id = globalUserId;

    return this.memorialRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async getPage(memorialId: string) {
    const page = await this.memorialRepo.findOne({ where: { memorial_id: memorialId, status: 'active' } });
    if (!page) throw new NotFoundException('memorial page not found');
    return page;
  }

  async createPage(dto: any) {
    const memorialId = this.generateId('m');
    const page = this.memorialRepo.create({
      memorial_id: memorialId,
      global_user_id: dto.global_user_id,
      pet_name: dto.pet_name,
      pet_type: dto.pet_type || null,
      born_date: dto.born_date ? new Date(dto.born_date) : null,
      passed_away_date: dto.passed_away_date ? new Date(dto.passed_away_date) : null,
      bio: dto.bio || null,
      cover_image: dto.cover_image || null,
      gallery: dto.gallery || null,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.memorialRepo.save(page);
  }

  async lightCandle(memorialId: string) {
    const page = await this.memorialRepo.findOne({ where: { memorial_id: memorialId } });
    if (!page) throw new NotFoundException('memorial page not found');

    page.candles_lit += 1;
    page.updated_at = new Date();
    await this.memorialRepo.save(page);
    return { candles_lit: page.candles_lit };
  }
}
