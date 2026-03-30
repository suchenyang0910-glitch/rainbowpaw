import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiCallLogEntity } from '../ai/entities/ai-call-log.entity';

export const CALL_LOG_STORE = Symbol('CALL_LOG_STORE');

export type CallLogInsert = Omit<Partial<AiCallLogEntity>, 'id' | 'created_at'>;

export interface CallLogStore {
  insert(entry: CallLogInsert): Promise<void>;
  sumTodayCostUsd(): Promise<number>;
}

@Injectable()
export class NoopCallLogStore implements CallLogStore {
  async insert(_entry: CallLogInsert) {}
  async sumTodayCostUsd() {
    return 0;
  }
}

@Injectable()
export class DbCallLogStore implements CallLogStore {
  constructor(
    @InjectRepository(AiCallLogEntity)
    private readonly repo: Repository<AiCallLogEntity>,
  ) {}

  async insert(entry: CallLogInsert) {
    await this.repo.insert(entry as any);
  }

  async sumTodayCostUsd() {
    const rows = await this.repo.query(
      "select coalesce(sum(cost_usd::numeric), 0) as s from ai.call_logs where created_at >= date_trunc('day', now())",
    );
    return Number(rows?.[0]?.s || 0);
  }
}

