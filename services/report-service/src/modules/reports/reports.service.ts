import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BridgeEventEntity } from './entities/bridge-event.entity';
import { OrderEntity } from './entities/order.entity';
import { WithdrawRequestEntity } from './entities/withdraw-request.entity';

function toDateRange(dateStr?: string) {
  const s = String(dateStr || '').trim();
  if (s) {
    const m = /^\d{4}-\d{2}-\d{2}$/.exec(s);
    if (m) {
      const start = new Date(`${s}T00:00:00.000Z`);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      return { date: s, start, end };
    }
  }
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const date = `${yyyy}-${mm}-${dd}`;
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { date, start, end };
}

function sumNums(values: Array<number>) {
  return values.reduce((s, x) => s + (Number.isFinite(x) ? x : 0), 0);
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(BridgeEventEntity)
    private readonly eventRepo: Repository<BridgeEventEntity>,
    @InjectRepository(WithdrawRequestEntity)
    private readonly withdrawRepo: Repository<WithdrawRequestEntity>,
  ) {}

  private pointsToUsd(points: number) {
    return points / 2;
  }

  async daily(opts?: { date?: string }) {
    const { date, start, end } = toDateRange(opts?.date);

    const qb = this.orderRepo.createQueryBuilder('o');
    qb.where('o.created_at >= :start AND o.created_at < :end', { start, end });
    const rows = await qb.getMany();

    const ok = (s: string) => {
      const v = String(s || '').toLowerCase();
      return v === 'paid' || v === 'completed' || v === 'posted' || v === 'succeeded';
    };
    const okRows = rows.filter((r) => ok(r.status));

    const income = okRows.filter((r) => String(r.flow) === 'income');
    const expense = okRows.filter((r) => String(r.flow) === 'expense');

    const incomePoints = sumNums(
      income
        .filter((r) => String(r.currency) === 'points')
        .map((r) => Number(r.amount || 0)),
    );
    const incomeUsd = sumNums(
      income
        .filter((r) => String(r.currency) === 'usd')
        .map((r) => Number(r.amount || 0)),
    );
    const expensePoints = sumNums(
      expense
        .filter((r) => String(r.currency) === 'points')
        .map((r) => Number(r.amount || 0)),
    );
    const expenseUsd = sumNums(
      expense
        .filter((r) => String(r.currency) === 'usd')
        .map((r) => Number(r.amount || 0)),
    );

    const revenue_usd = incomeUsd + this.pointsToUsd(incomePoints);
    const cost_usd = expenseUsd + this.pointsToUsd(expensePoints);
    const profit_usd = revenue_usd - cost_usd;

    const claw_plays = income.filter((r) => {
      if (String(r.type) !== 'claw') return false;
      const meta = r.metadata && typeof r.metadata === 'object' ? r.metadata : {};
      return String((meta as any).action || '') === 'play';
    }).length;

    const evQb = this.eventRepo.createQueryBuilder('e');
    evQb.select('e.event_name', 'event_name');
    evQb.addSelect('COUNT(*)::int', 'cnt');
    evQb.where('e.created_at >= :start AND e.created_at < :end', { start, end });
    evQb.groupBy('e.event_name');
    const evRows = await evQb.getRawMany<{ event_name: string; cnt: number }>();

    const sumByEvent = (name: string) =>
      evRows
        .filter((r) => String(r.event_name) === name)
        .reduce((s, r) => s + Number(r.cnt || 0), 0);

    const clicks = sumByEvent('ad_click');
    const landings = sumByEvent('landing_view');
    const leads = sumByEvent('lead_submit') + sumByEvent('chat_started');
    const conversions =
      sumByEvent('order_created') +
      sumByEvent('checkout_completed') +
      sumByEvent('payment_confirmed');
    const conversion_rate = clicks > 0 ? conversions / clicks : 0;

    const failed_orders = rows.filter((r) => {
      const s = String(r.status || '').toLowerCase();
      return s === 'failed' || s === 'canceled' || s === 'cancelled' || s === 'refunded';
    }).length;

    const pending_withdraws = await this.withdrawRepo.count({ where: { status: 'pending' } });

    const anomalies: any[] = [];
    if (failed_orders > 0) anomalies.push({ type: 'failed_orders', count: failed_orders });
    if (pending_withdraws > 0) anomalies.push({ type: 'pending_withdraws', count: pending_withdraws });
    if (clicks > 0 && conversions === 0) anomalies.push({ type: 'no_conversions', clicks });

    return {
      date,
      revenue: { points: incomePoints, usd: revenue_usd },
      cost: { points: expensePoints, usd: cost_usd },
      profit: { usd: profit_usd },
      claw_plays,
      funnel: {
        clicks,
        landings,
        leads,
        conversions,
        conversion_rate,
      },
      anomalies,
    };
  }

  async profit(opts?: { days?: number }) {
    const days = Math.min(31, Math.max(1, Number(opts?.days || 7)));
    const list: any[] = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const date = `${yyyy}-${mm}-${dd}`;
      const one = await this.daily({ date });
      list.push(one);
    }
    return { days, items: list };
  }
}
