import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { ServiceItemEntity } from './entities/service-item.entity';
import { ServiceBookingEntity } from './entities/service-booking.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceItemEntity)
    private readonly serviceItemRepo: Repository<ServiceItemEntity>,
    @InjectRepository(ServiceBookingEntity)
    private readonly bookingRepo: Repository<ServiceBookingEntity>,
  ) {}

  private generateId(prefix: string) {
    return `${prefix}_${randomBytes(8).toString('hex')}`;
  }

  async listServices(type?: string) {
    const where: any = { is_active: true };
    if (type) where.type = type;

    return this.serviceItemRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async book(dto: any) {
    const bookingId = this.generateId('bk');
    const booking = this.bookingRepo.create({
      booking_id: bookingId,
      global_user_id: dto.global_user_id,
      service_id: dto.service_id,
      order_id: dto.order_id || null,
      status: 'pending',
      scheduled_time: dto.scheduled_time ? new Date(dto.scheduled_time) : null,
      contact_info: dto.contact_info || null,
      remark: dto.remark || null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.bookingRepo.save(booking);
  }

  async getBookings(globalUserId?: string) {
    const where: any = {};
    if (globalUserId) where.global_user_id = globalUserId;
    
    return this.bookingRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }
}
