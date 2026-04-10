import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository, DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { OrderStatusLogEntity } from './entities/order-status-log.entity';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepo: Repository<OrderItemEntity>,
    @InjectRepository(OrderStatusLogEntity)
    private readonly orderStatusLogRepo: Repository<OrderStatusLogEntity>,
  ) {}

  private newOrderId() {
    return `ord_${randomBytes(10).toString('hex')}`;
  }

  async create(dto: CreateOrderDto, idempotencyKey?: string) {
    const idem = String(idempotencyKey || '').trim();
    if (idem) {
      const existed = await this.orderRepo.findOne({ where: { idempotency_key: idem } });
      if (existed) return this.get(existed.order_id);
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

    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderEntity);
      const itemRepo = manager.getRepository(OrderItemEntity);
      const logRepo = manager.getRepository(OrderStatusLogEntity);

      const order = await orderRepo.save(
        orderRepo.create({
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

      await logRepo.save(
        logRepo.create({
          order_id: orderId,
          status,
          remark: 'Order created',
          created_at: new Date(),
        }),
      );

      if (dto.items && dto.items.length > 0) {
        const items = dto.items.map((item) =>
          itemRepo.create({
            order_id: orderId,
            product_id: item.product_id || null,
            item_name: item.item_name,
            quantity: item.quantity,
            unit_price: Number(item.unit_price).toFixed(2),
            total_price: Number(item.total_price).toFixed(2),
            metadata: item.metadata || null,
            created_at: new Date(),
          }),
        );
        await itemRepo.save(items);
      }

      return this.get(order.order_id);
    });
  }

  async get(orderId: string) {
    const oid = String(orderId || '').trim();
    if (!oid) throw new NotFoundException('order not found');
    const rec = await this.orderRepo.findOne({ where: { order_id: oid } });
    if (!rec) throw new NotFoundException('order not found');

    const items = await this.orderItemRepo.find({ where: { order_id: oid } });
    const logs = await this.orderStatusLogRepo.find({ where: { order_id: oid }, order: { created_at: 'ASC' } });

    return this.toView(rec, items, logs);
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

    // Fetch items and logs for the listed orders
    const orderIds = rows.map((r) => r.order_id);
    let allItems: OrderItemEntity[] = [];
    let allLogs: OrderStatusLogEntity[] = [];
    
    if (orderIds.length > 0) {
      allItems = await this.orderItemRepo.createQueryBuilder('i')
        .where('i.order_id IN (:...orderIds)', { orderIds })
        .getMany();
        
      allLogs = await this.orderStatusLogRepo.createQueryBuilder('l')
        .where('l.order_id IN (:...orderIds)', { orderIds })
        .orderBy('l.created_at', 'ASC')
        .getMany();
    }

    return {
      items: rows.map((r) => {
        const items = allItems.filter(i => i.order_id === r.order_id);
        const logs = allLogs.filter(l => l.order_id === r.order_id);
        return this.toView(r, items, logs);
      }),
      total,
      page,
      pageSize,
    };
  }

  async updateStatus(orderId: string, status: string, remark?: string) {
    const oid = String(orderId || '').trim();
    const newStatus = String(status || '').trim();
    if (!oid) throw new NotFoundException('order not found');
    if (!newStatus) throw new BadRequestException('status required');

    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderEntity);
      const logRepo = manager.getRepository(OrderStatusLogEntity);

      const rec = await orderRepo.findOne({ where: { order_id: oid } });
      if (!rec) throw new NotFoundException('order not found');

      if (rec.status !== newStatus) {
        rec.status = newStatus;
        rec.updated_at = new Date();
        await orderRepo.save(rec);

        await logRepo.save(
          logRepo.create({
            order_id: oid,
            status: newStatus,
            remark: remark || `Status updated to ${newStatus}`,
            created_at: new Date(),
          }),
        );
      }

      return this.get(oid);
    });
  }

  private toView(o: OrderEntity, items: OrderItemEntity[] = [], logs: OrderStatusLogEntity[] = []) {
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
      items: items.map(i => ({
        id: i.id,
        product_id: i.product_id,
        item_name: i.item_name,
        quantity: i.quantity,
        unit_price: Number(i.unit_price),
        total_price: Number(i.total_price),
        metadata: i.metadata,
      })),
      status_logs: logs.map(l => ({
        status: l.status,
        remark: l.remark,
        created_at: l.created_at,
      }))
    };
  }
}
