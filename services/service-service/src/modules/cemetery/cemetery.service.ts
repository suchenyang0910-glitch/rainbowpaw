import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { CemeteryZoneEntity } from './entities/cemetery-zone.entity';
import { CemeterySlotEntity } from './entities/cemetery-slot.entity';

@Injectable()
export class CemeteryService {
  constructor(
    @InjectRepository(CemeteryZoneEntity)
    private readonly zoneRepo: Repository<CemeteryZoneEntity>,
    @InjectRepository(CemeterySlotEntity)
    private readonly slotRepo: Repository<CemeterySlotEntity>,
  ) {}

  private generateId(prefix: string) {
    return `${prefix}_${randomBytes(8).toString('hex')}`;
  }

  async listZones() {
    return this.zoneRepo.find({
      where: { is_active: true },
      order: { created_at: 'ASC' },
    });
  }

  async getZoneSlots(zoneId: string) {
    const zone = await this.zoneRepo.findOne({ where: { zone_id: zoneId } });
    if (!zone) throw new NotFoundException('zone not found');

    const slots = await this.slotRepo.find({
      where: { zone_id: zoneId },
      order: { slot_number: 'ASC' },
    });

    return {
      zone,
      slots,
    };
  }

  async rentSlot(dto: { slot_id: string; global_user_id: string; memorial_id?: string; lease_months: number }) {
    const slot = await this.slotRepo.findOne({ where: { slot_id: dto.slot_id } });
    if (!slot) throw new NotFoundException('slot not found');
    if (slot.status !== 'available') throw new BadRequestException('slot is not available');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + dto.lease_months);

    slot.status = 'occupied';
    slot.current_occupant_user_id = dto.global_user_id;
    slot.memorial_id = dto.memorial_id || null;
    slot.lease_start_date = startDate;
    slot.lease_end_date = endDate;
    slot.updated_at = new Date();

    await this.slotRepo.save(slot);

    // Update zone occupied count
    const zone = await this.zoneRepo.findOne({ where: { zone_id: slot.zone_id } });
    if (zone) {
      zone.occupied += 1;
      await this.zoneRepo.save(zone);
    }

    return slot;
  }
}
