import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { ClawPoolEntity } from './entities/claw-pool.entity';
import { ClawPoolItemEntity } from './entities/claw-pool-item.entity';
import { ClawPlayEntity } from './entities/claw-play.entity';
import { ClawRewardEntity } from './entities/claw-reward.entity';

@Injectable()
export class ClawService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ClawPoolEntity)
    private readonly poolRepo: Repository<ClawPoolEntity>,
    @InjectRepository(ClawPoolItemEntity)
    private readonly poolItemRepo: Repository<ClawPoolItemEntity>,
    @InjectRepository(ClawPlayEntity)
    private readonly playRepo: Repository<ClawPlayEntity>,
    @InjectRepository(ClawRewardEntity)
    private readonly rewardRepo: Repository<ClawRewardEntity>,
  ) {}

  private generateId(prefix: string) {
    return `${prefix}_${randomBytes(8).toString('hex')}`;
  }

  async getActivePool() {
    const pool = await this.poolRepo.findOne({ where: { is_active: true }, order: { created_at: 'DESC' } });
    if (!pool) throw new NotFoundException('No active claw pool found');

    const items = await this.poolItemRepo.find({ where: { pool_id: pool.pool_id, is_active: true } });
    return { pool, items };
  }

  async play(globalUserId: string, poolId: string, idemKey?: string) {
    if (idemKey) {
      const existing = await this.playRepo.findOne({ where: { idempotency_key: idemKey } });
      if (existing) {
        const existingReward = await this.rewardRepo.findOne({ where: { play_id: existing.play_id } });
        return { play: existing, reward: existingReward };
      }
    }

    const poolData = await this.getActivePool();
    if (poolData.pool.pool_id !== poolId) {
      throw new BadRequestException('Invalid or inactive pool_id');
    }

    // Filter items with stock > 0 and weight > 0
    const availableItems = poolData.items.filter(i => i.stock > 0 && i.weight > 0);
    if (availableItems.length === 0) {
      throw new BadRequestException('Pool is empty');
    }

    // Calculate total weight
    const totalWeight = availableItems.reduce((sum, item) => sum + item.weight, 0);
    
    // Random selection based on weight
    let randomNum = Math.random() * totalWeight;
    let selectedItem: ClawPoolItemEntity | null = null;

    for (const item of availableItems) {
      if (randomNum < item.weight) {
        selectedItem = item;
        break;
      }
      randomNum -= item.weight;
    }

    // Fallback just in case
    if (!selectedItem) selectedItem = availableItems[availableItems.length - 1];

    return this.dataSource.transaction(async (manager) => {
      const poolItemRepo = manager.getRepository(ClawPoolItemEntity);
      const playRepo = manager.getRepository(ClawPlayEntity);
      const rewardRepo = manager.getRepository(ClawRewardEntity);

      // Decrement stock
      selectedItem.stock -= 1;
      await poolItemRepo.save(selectedItem);

      const playId = this.generateId('play');
      const play = await playRepo.save(playRepo.create({
        play_id: playId,
        global_user_id: globalUserId,
        pool_id: poolId,
        cost_points: poolData.pool.cost_points,
        status: 'completed',
        idempotency_key: idemKey || null,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      const rewardId = this.generateId('rew');
      const reward = await rewardRepo.save(rewardRepo.create({
        reward_id: rewardId,
        play_id: playId,
        global_user_id: globalUserId,
        pool_item_id: selectedItem.item_id,
        reward_type: selectedItem.reward_type,
        reference_id: selectedItem.reference_id,
        name: selectedItem.name,
        quantity: selectedItem.quantity,
        recycle_value: selectedItem.recycle_value,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      return { play, reward };
    });
  }

  async recycle(globalUserId: string, playId: string) {
    return this.dataSource.transaction(async (manager) => {
      const playRepo = manager.getRepository(ClawPlayEntity);
      const rewardRepo = manager.getRepository(ClawRewardEntity);

      const play = await playRepo.findOne({ where: { play_id: playId, global_user_id: globalUserId } });
      if (!play) throw new NotFoundException('play record not found');
      if (play.status !== 'completed') throw new BadRequestException(`cannot recycle play in status: ${play.status}`);

      const reward = await rewardRepo.findOne({ where: { play_id: playId } });
      if (!reward) throw new NotFoundException('reward not found');
      if (!reward.recycle_value || Number(reward.recycle_value) <= 0) {
        throw new BadRequestException('this reward cannot be recycled');
      }

      play.status = 'recycled';
      play.updated_at = new Date();
      await playRepo.save(play);

      return {
        play,
        reward,
        recycled_points: Number(reward.recycle_value)
      };
    });
  }
}
