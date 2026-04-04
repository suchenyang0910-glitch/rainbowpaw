import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderEntity } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
  ) {}

  private newOrderId() {
    return `ord_${randomBytes(10).toString('hex')}`;
  }

  async create(dto: CreateOrderDto, idempotencyKey?: string) {
    const idem = String(idempotencyKey || '').trim();
    if (idem) {
      const existed = await this.orderRepo.findOne({ where: { idempotency_key: idem } });
      if (existed) return this.toView(existed);
    }

    const type = String(dto.type || '').trim();
    const user_id = String(dto.user_id || '').trim();
    if (!user_id) throw new BadRequestException('user_id required');
    if (!type) throw new BadRequestException('type required');

    const amountNum = Number(dto.amount);
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      throw new BadRequestException('amount must be non-negative number');
    }

    const currency = String(dto.currency || 'points').trim() || 'points';
    const status = String(dto.status || 'created').trim() || 'created';
    const flow = String(dto.flow || 'income').trim() || 'income';

    const providedOrderId = String(dto.order_id || '').trim();
    const orderId = providedOrderId || this.newOrderId();

    const order = await this.orderRepo.save(
      this.orderRepo.create({
        order_id: orderId,
        idempotency_key: idem || null,
        type,
        status,
        flow,
        amount: amountNum.toFixed(2),
        currency,
        user_id,
        metadata: dto.metadata || null,
        created_at: new Date(),
        updated_at: new Date(),
      }),
    );
    return this.toView(order);
  }

  async get(orderId: string) {
    const oid = String(orderId || '').trim();
    if (!oid) throw new NotFoundException('order not found');
    const rec = await this.orderRepo.findOne({ where: { order_id: oid } });
    if (!rec) throw new NotFoundException('order not found');
    return this.toView(rec);
  }

  async list(opts: {
    user_id?: string;
    type?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) {
    const pageSize = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const page = Math.max(1, Number(opts.page || 1));
    const qb = this.orderRepo.createQueryBuilder('o');

    const user_id = String(opts.user_id || '').trim();
    const type = String(opts.type || '').trim();
    const status = String(opts.status || '').trim();
    const from = String(opts.from || '').trim();
    const to = String(opts.to || '').trim();

    if (user_id) qb.andWhere('o.user_id = :user_id', { user_id });
    if (type) qb.andWhere('o.type = :type', { type });
    if (status) qb.andWhere('o.status = :status', { status });
    if (from) qb.andWhere('o.created_at >= :from', { from: new Date(from) });
    if (to) qb.andWhere('o.created_at < :to', { to: new Date(to) });

    qb.orderBy('o.id', 'DESC');
    qb.take(pageSize);
    qb.skip((page - 1) * pageSize);

    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map((r) => this.toView(r)),
      total,
      page,
      pageSize,
    };
  }

  async updateStatus(orderId: string, status: string) {
    const oid = String(orderId || '').trim();
    if (!oid) throw new NotFoundException('order not found');
    const rec = await this.orderRepo.findOne({ where: { order_id: oid } });
    if (!rec) throw new NotFoundException('order not found');

    rec.status = String(status || '').trim() || rec.status;
    rec.updated_at = new Date();
    const saved = await this.orderRepo.save(rec);
    return this.toView(saved);
  }

  private toView(o: OrderEntity) {
    return {
      order_id: o.order_id,
      type: o.type,
      status: o.status,
      amount: Number(o.amount || 0),
      currency: o.currency,
      flow: o.flow,
      user_id: o.user_id,
      metadata: o.metadata || null,
      created_at: o.created_at,
      updated_at: o.updated_at,
    };
  }
}
