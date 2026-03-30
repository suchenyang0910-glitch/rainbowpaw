import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import type { QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class AppService {
  private opsPg: Pool | null = null;
  private paymentProofFiles = new Map<string, { mime_type: string; file_base64: string }>();
  private shippingByTelegramId = new Map<number, { name: string; phone: string; address: string }>();

  private marketplaceProductsStore = [
    {
      id: 101,
      category: 'urn',
      name: '纪念骨灰盒·陶瓷款',
      description: '温润哑光质感，可刻字定制，适合长期纪念保存。',
      price_cents: 8900,
      currency: 'USD',
      images: [{ image_url: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=800&auto=format&fit=crop' }],
      merchant: { id: 'm_official', name: 'RainbowPaw 官方' },
      production_time_days: 3,
      delivery_type: 'shipment',
      sales_7d: 12,
    },
    {
      id: 102,
      category: 'jewelry',
      name: '骨灰晶石吊坠（可定制刻字）',
      description: '把想念佩戴在身边，支持刻字与多色选择。',
      price_cents: 4500,
      currency: 'USD',
      images: [{ image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop' }],
      merchant: { id: 'm_official', name: 'RainbowPaw 官方' },
      production_time_days: 2,
      delivery_type: 'shipment',
      sales_7d: 8,
    },
    {
      id: 103,
      category: 'art',
      name: '手绘肖像·治愈系油画',
      description: '根据照片绘制，保留神态与陪伴的温度。',
      price_cents: 12000,
      currency: 'USD',
      images: [{ image_url: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800&auto=format&fit=crop' }],
      merchant: { id: 'm_official', name: 'RainbowPaw 官方' },
      production_time_days: 7,
      delivery_type: 'digital',
      sales_7d: 5,
    },
  ];

  private marketplaceServicesStore = [
    {
      id: 'svc_cremation_basic',
      category: 'cremation',
      city: 'Phnom Penh',
      service_name: '善终服务·Basic',
      description: '基础火化服务 + 取回安排，适合轻量需求。',
      price_cents: 4900,
      currency: 'USD',
    },
    {
      id: 'svc_cremation_standard',
      category: 'cremation',
      city: 'Phnom Penh',
      service_name: '善终服务·Standard',
      description: '含上门接宠 + 独立火化 + 基础纪念组件。',
      price_cents: 12900,
      currency: 'USD',
    },
  ];

  private cartByPhone = new Map<string, { items: any[] }>();
  private ordersByPhone = new Map<string, any[]>();

  private v1UsersByPhone = new Map<string, any>();
  private v1PetsByPhone = new Map<string, any[]>();
  private v1PaymentsStoreByPhone = new Map<string, any[]>();
  private v1MemorialFavoritesByPhone = new Map<string, Set<number>>();
  private v1MerchantsById = new Map<string, any>();
  private v1MerchantTokenToId = new Map<string, string>();

  private businessSettings = {
    points_per_usd: 2,
    claw_cost_points: 3,
    recycle_ratio: 0.8,
    recycle_locked_ratio: 0.6,
    recycle_cashable_ratio: 0.4,
    withdraw_min_points: 20,
    withdraw_fee_ratio: 0.05,
    reward_mode: 'normal' as 'low' | 'normal' | 'boost',
    legendary_rate: 0.05,
  };

  private adminUsersStore = new Map<
    string,
    {
      global_user_id: string;
      telegram_id: number | null;
      username: string | null;
      pet_type: string | null;
      spend_total: number;
      spend_level: string;
      status: string;
      last_active_at: string | null;
    }
  >([
    [
      'g_demo_admin',
      {
        global_user_id: 'g_demo_admin',
        telegram_id: 123,
        username: 'demo',
        pet_type: 'cat',
        spend_total: 0,
        spend_level: 'low',
        status: 'active',
        last_active_at: new Date().toISOString(),
      },
    ],
  ]);

  private adminWithdrawRequestsStore = new Map<
    string,
    {
      id: string;
      request_no: string;
      global_user_id: string;
      points_cashable_amount: number;
      cash_amount: number;
      status: string;
      created_at: string;
    }
  >();

  private adminMerchantsStore = new Map<
    string,
    {
      id: string;
      name: string;
      category: string;
      status: 'pending' | 'approved' | 'rejected' | 'suspended';
      created_at: string;
    }
  >([
    [
      'm_official',
      {
        id: 'm_official',
        name: 'RainbowPaw 官方',
        category: 'official',
        status: 'approved',
        created_at: new Date().toISOString(),
      },
    ],
  ]);

  private adminClawPoolsStore = new Map<
    string,
    {
      id: string
      pool_name: string
      mode: 'low' | 'normal' | 'boost'
      legendary_rate: number
      recycle_ratio: number
      status: 'draft' | 'active' | 'inactive'
      updated_at: string
    }
  >([
    [
      'pool_default',
      {
        id: 'pool_default',
        pool_name: '默认奖池',
        mode: 'normal',
        legendary_rate: 0.05,
        recycle_ratio: 0.8,
        status: 'active',
        updated_at: new Date().toISOString(),
      },
    ],
  ])

  private riskAlertsStore = [
    {
      id: 'risk_001',
      type: 'withdraw_anomaly',
      level: 'medium',
      title: '提现异常',
      description: '检测到异常提现频率（示例数据）',
      global_user_id: 'g_demo_admin',
      created_at: new Date().toISOString(),
    },
  ]

  private aiOpsState: {
    last_daily?: {
      generated_at: string
      summary: string
      issues: string[]
      pool_suggestion: string
      reactivation_suggestion: string
      model_hint: string
    }
    last_publish?: { published_at: string; title: string; payload: any }
    last_smoke?: { ran_at: string; status: 'pass' | 'fail'; details: string[] }
  } = {}

  private internalToken() {
    return process.env.INTERNAL_TOKEN || 'dev-secret-token';
  }

  private identityBase() {
    return process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001/api';
  }

  private walletBase() {
    return process.env.WALLET_SERVICE_URL || 'http://localhost:3002/api';
  }

  private bridgeBase() {
    return process.env.BRIDGE_SERVICE_URL || 'http://localhost:3003/api';
  }

  private aiBase() {
    return String(process.env.AI_ORCHESTRATOR_SERVICE_URL || '').trim();
  }

  private enableRecommendOnPlay() {
    return String(process.env.ENABLE_AI_RECOMMEND_ON_PLAY || '').trim() === 'true';
  }

  private async internalGet<T>(url: string, params?: any, extraHeaders?: Record<string, string>) {
    const { data } = await axios.get(url, {
      params,
      headers: {
        Authorization: `Bearer ${this.internalToken()}`,
        'Content-Type': 'application/json',
        ...(extraHeaders || {}),
      },
    });
    return data as T;
  }

  private async internalPost<T>(url: string, body?: any, extraHeaders?: Record<string, string>) {
    const { data } = await axios.post(url, body || {}, {
      headers: {
        Authorization: `Bearer ${this.internalToken()}`,
        'Content-Type': 'application/json',
        ...(extraHeaders || {}),
      },
    });
    return data as T;
  }

  private async linkUser(tgId: number) {
    const { data } = await axios.post(
      `${this.identityBase()}/identity/link-user`,
      {
        source_bot: 'claw_bot',
        source_user_id: String(tgId),
        telegram_id: tgId,
        username: '',
        first_source: 'web',
      },
      {
        headers: {
          Authorization: `Bearer ${this.internalToken()}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return data.data as { global_user_id: string };
  }

  private getTelegramId(devTelegramId: string, telegramInitData: string) {
    const dev = Number(String(devTelegramId || '').trim());
    if (Number.isFinite(dev) && dev > 0) return dev;
    const raw = String(telegramInitData || '');
    if (!raw) return 0;
    const m = raw.match(/(?:^|&)user=([^&]+)/);
    if (!m) return 0;
    try {
      const userJson = decodeURIComponent(m[1]);
      const u = JSON.parse(userJson);
      const id = Number(u && u.id ? u.id : 0);
      return Number.isFinite(id) ? id : 0;
    } catch {
      return 0;
    }
  }

  private async getWallet(globalUserId: string) {
    const { data } = await axios.get(`${this.walletBase()}/wallet/${encodeURIComponent(globalUserId)}`, {
      headers: {
        Authorization: `Bearer ${this.internalToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return data.data;
  }

  private async getWalletLogs(globalUserId: string, pageSize: number) {
    const { data } = await axios.get(
      `${this.walletBase()}/wallet/logs/${encodeURIComponent(globalUserId)}?page=1&pageSize=${encodeURIComponent(String(pageSize))}`,
      {
        headers: {
          Authorization: `Bearer ${this.internalToken()}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return data.data;
  }

  private async walletEarn(globalUserId: string, amountPointsLocked: number, idemKey: string, bizType: string) {
    const { data } = await axios.post(
      `${this.walletBase()}/wallet/earn`,
      {
        global_user_id: globalUserId,
        biz_type: bizType,
        changes: [{ asset_type: 'points_locked', amount: amountPointsLocked }],
        ref_type: 'gateway',
        ref_id: null,
        remark: null,
      },
      {
        headers: {
          Authorization: `Bearer ${this.internalToken()}`,
          'Content-Type': 'application/json',
          'x-idempotency-key': idemKey,
        },
      },
    );
    return data.data;
  }

  private async walletSpend(globalUserId: string, spendAmount: number, idemKey: string, bizType: string) {
    const { data } = await axios.post(
      `${this.walletBase()}/wallet/spend`,
      {
        global_user_id: globalUserId,
        biz_type: bizType,
        spend_amount: spendAmount,
        spend_strategy: 'locked_first',
        ref_type: 'gateway',
        ref_id: null,
        remark: null,
      },
      {
        headers: {
          Authorization: `Bearer ${this.internalToken()}`,
          'Content-Type': 'application/json',
          'x-idempotency-key': idemKey,
        },
      },
    );
    return data.data;
  }

  private async walletRecycle(globalUserId: string, recycleAmount: number, idemKey: string) {
    const { data } = await axios.post(
      `${this.walletBase()}/wallet/recycle`,
      {
        global_user_id: globalUserId,
        biz_type: 'claw_recycle',
        origin_amount: 3,
        recycle_amount: recycleAmount,
        split_rule: { locked_ratio: 0.6, cashable_ratio: 0.4 },
        ref_type: 'gateway',
        ref_id: null,
      },
      {
        headers: {
          Authorization: `Bearer ${this.internalToken()}`,
          'Content-Type': 'application/json',
          'x-idempotency-key': idemKey,
        },
      },
    );
    return data.data;
  }

  async me(opts: { devTelegramId: string; telegramInitData: string }) {
    const tgId = this.getTelegramId(opts.devTelegramId, opts.telegramInitData);
    if (!tgId) throw new BadRequestException('missing telegram id');

    const linked = await this.linkUser(tgId);
    const wallet = await this.getWallet(linked.global_user_id);

    const referralCode = `ref_${String(linked.global_user_id).slice(0, 8)}`;
    return {
      code: 0,
      message: 'ok',
      data: {
        telegram: { id: tgId, username: '', first_name: '' },
        user: { global_user_id: linked.global_user_id, plays_left: 0, state: 'idle', referral_code: referralCode },
        wallet,
        pricing: { playUsd: 1.5, bundle3xUsd: 4, bundle10xUsd: 13 },
        pay: { usdtTrc20Address: '', abaName: '', abaId: '' },
        links: { referral: `https://t.me/rainbowpay_claw_Bot?start=${referralCode}` },
        shipping: null,
      },
    };
  }

  async wallet(opts: { devTelegramId: string; telegramInitData: string; limit: number }) {
    const tgId = this.getTelegramId(opts.devTelegramId, opts.telegramInitData);
    if (!tgId) throw new BadRequestException('missing telegram id');

    const linked = await this.linkUser(tgId);
    const wallet = await this.getWallet(linked.global_user_id);
    const logs = await this.getWalletLogs(linked.global_user_id, opts.limit);

    return { code: 0, message: 'ok', data: { wallet, logs: logs.logs || [] } };
  }

  async devAddPlays(opts: { devTelegramId: string; telegramInitData: string; count: number }) {
    const tgId = this.getTelegramId(opts.devTelegramId, opts.telegramInitData);
    if (!tgId) throw new BadRequestException('missing telegram id');

    const linked = await this.linkUser(tgId);
    const n = Math.min(100, Math.max(1, Number(opts.count || 10)));
    const points = n * 3;
    await this.walletEarn(linked.global_user_id, points, `devAddPlays:${tgId}:${n}:${Date.now()}`, 'recharge');
    const wallet = await this.getWallet(linked.global_user_id);
    return { code: 0, message: 'ok', data: { wallet } };
  }

  async play(opts: { devTelegramId: string; telegramInitData: string; multi: number }) {
    const tgId = this.getTelegramId(opts.devTelegramId, opts.telegramInitData);
    if (!tgId) throw new BadRequestException('missing telegram id');

    const linked = await this.linkUser(tgId);
    const m = Number(opts.multi || 1) === 10 ? 10 : 1;
    const plays = [] as any[];

    for (let i = 0; i < m; i += 1) {
      try {
        await this.walletSpend(linked.global_user_id, 3, `playSpend:${tgId}:${i}:${Date.now()}`, 'claw_consume');
      } catch (e: any) {
        throw new BadRequestException('no plays left');
      }
      await this.walletRecycle(linked.global_user_id, 2.4, `playRecycle:${tgId}:${i}:${Date.now()}`);
      plays.push({
        play_id: `p_${tgId}_${Date.now()}_${i}`,
        order_id: `o_${tgId}_${Date.now()}_${i}`,
        tier: 'common',
        near_miss_tier: null,
        prize: { name: '普通奖品', display_name: '普通奖品' },
      });
    }

    const wallet = await this.getWallet(linked.global_user_id);
    const aiBase = this.aiBase();
    let ai_recommendation: any = null;

    if (aiBase && this.enableRecommendOnPlay()) {
      try {
        const candidates = await this.products();
        const products = Array.isArray(candidates?.data?.products) ? candidates.data.products : [];
        const payload = {
          user_profile: {
            global_user_id: linked.global_user_id,
            pet_type: null,
            spend_level: null,
            tags: [],
          },
          recent_actions: ['play_completed'],
          last_result: { plays: plays.slice(-1) },
          candidate_products: products.map((p: any) => ({
            id: p.id,
            title: p.display_name || p.name,
            category: 'shop',
            price: p.direct_buy_price,
            sales_7d: p.sales_7d,
          })),
          candidate_entries: ['claw', 'shop', 'memorial'],
        };
        const res = await this.internalPost<any>(`${aiBase}/ai/recommend/next`, payload, {
          'x-global-user-id': linked.global_user_id,
        });
        ai_recommendation = res?.data || null;
      } catch {
      }
    }

    return { code: 0, message: 'ok', data: { plays, plays_left: 0, wallet, ai_recommendation } };
  }

  async products() {
    return {
      code: 0,
      message: 'ok',
      data: {
        products: [
          { id: 101, name: '高级玩具 A', display_name: '高级玩具 A', direct_buy_price: 10, sales_7d: 12 },
          { id: 102, name: '纪念金币', display_name: '纪念金币', direct_buy_price: 25, sales_7d: 8 },
        ],
      },
    };
  }

  async marketplaceProducts(opts: { category?: string }) {
    const category = String(opts?.category || '').trim();
    const list = category ? this.marketplaceProductsStore.filter((p) => String(p.category) === category) : this.marketplaceProductsStore;
    return { code: 0, message: 'ok', data: { items: list } };
  }

  async marketplaceProduct(opts: { id: string }) {
    const id = Number(opts?.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid product id');
    const p = this.marketplaceProductsStore.find((x) => Number(x.id) === id);
    if (!p) throw new BadRequestException('product not found');
    return { code: 0, message: 'ok', data: p };
  }

  async marketplaceServices(opts: { city?: string; category?: string }) {
    const city = String(opts?.city || '').trim();
    const category = String(opts?.category || '').trim();
    let list = this.marketplaceServicesStore;
    if (city) list = list.filter((s) => String(s.city || '').toLowerCase() === city.toLowerCase());
    if (category) list = list.filter((s) => String(s.category || '').toLowerCase() === category.toLowerCase());
    return { code: 0, message: 'ok', data: { items: list } };
  }

  private normalizePhone(raw: any) {
    const phone = String(raw || '').trim();
    if (!phone) throw new BadRequestException('phone required');
    return phone;
  }

  private ensureCart(phone: string) {
    if (!this.cartByPhone.has(phone)) this.cartByPhone.set(phone, { items: [] });
    return this.cartByPhone.get(phone)!;
  }

  private calcCart(cart: { items: any[] }) {
    const subtotal = (cart.items || []).reduce(
      (s, it) => (it.selected ? s + Number(it.unit_price_cents || 0) * Number(it.quantity || 0) : s),
      0,
    );
    return { items: cart.items, subtotal_cents: subtotal, currency: 'USD' };
  }

  async cart(opts: { phone: string }) {
    const phone = this.normalizePhone(opts.phone);
    const cart = this.ensureCart(phone);
    return { code: 0, message: 'ok', data: this.calcCart(cart) };
  }

  async cartAddItem(body: any) {
    const phone = this.normalizePhone(body?.phone);
    const productId = Number(body?.product_id);
    const quantity = Math.max(1, Number(body?.quantity || 1));
    if (!Number.isFinite(productId)) throw new BadRequestException('invalid product_id');

    const p = this.marketplaceProductsStore.find((x) => Number(x.id) === productId);
    if (!p) throw new BadRequestException('product not found');

    const cart = this.ensureCart(phone);
    const existed = cart.items.find((x) => Number(x.product_id) === productId);
    if (existed) {
      existed.quantity = Math.max(1, Number(existed.quantity || 1) + quantity);
      existed.selected = true;
    } else {
      cart.items.unshift({
        id: `ci_${randomUUID()}`,
        phone,
        product_id: productId,
        name: p.name,
        image_url: p.images?.[0]?.image_url || null,
        unit_price_cents: p.price_cents,
        quantity,
        selected: true,
      });
    }

    return { code: 0, message: 'ok', data: this.calcCart(cart) };
  }

  async cartPatchItem(body: any) {
    const phone = this.normalizePhone(body?.phone);
    const id = String(body?.id || '').trim();
    if (!id) throw new BadRequestException('id required');
    const cart = this.ensureCart(phone);
    const it = cart.items.find((x) => String(x.id) === id);
    if (!it) throw new BadRequestException('cart item not found');
    if (typeof body?.quantity !== 'undefined') it.quantity = Math.max(1, Number(body.quantity || 1));
    if (typeof body?.selected !== 'undefined') it.selected = Boolean(body.selected);
    return { code: 0, message: 'ok', data: this.calcCart(cart) };
  }

  async cartDeleteItem(opts: { id: string; phone: string }) {
    const phone = this.normalizePhone(opts.phone);
    const id = String(opts.id || '').trim();
    const cart = this.ensureCart(phone);
    cart.items = cart.items.filter((x) => String(x.id) !== id);
    return { code: 0, message: 'ok', data: this.calcCart(cart) };
  }

  private pushOrder(phone: string, order: any) {
    if (!this.ordersByPhone.has(phone)) this.ordersByPhone.set(phone, []);
    this.ordersByPhone.get(phone)!.unshift(order);
  }

  async marketplaceCreateOrder(body: any) {
    const phone = this.normalizePhone(body?.phone);
    const orderType = String(body?.order_type || '').trim();
    if (orderType !== 'product' && orderType !== 'service') throw new BadRequestException('invalid order_type');
    const now = new Date();
    const orderId = `rpw_${now.getTime()}`;
    const city = String(body?.city || '').trim();

    if (orderType === 'product') {
      const items = Array.isArray(body?.product_items) ? body.product_items : [];
      if (!items.length) throw new BadRequestException('product_items required');

      const details = items.map((x: any) => {
        const pid = Number(x.product_id);
        const qty = Math.max(1, Number(x.quantity || 1));
        if (!Number.isFinite(pid)) throw new BadRequestException('invalid product_id');
        const p = this.marketplaceProductsStore.find((pp) => Number(pp.id) === pid);
        if (!p) throw new BadRequestException('product not found');
        return { product_id: p.id, name: p.name, unit_price_cents: p.price_cents, quantity: qty };
      });

      const total = details.reduce((s: number, x: any) => s + x.unit_price_cents * x.quantity, 0);
      this.pushOrder(phone, {
        order_id: orderId,
        phone,
        order_type: 'product',
        city: city || undefined,
        status: 'pending',
        total_cents: total,
        currency: 'USD',
        created_at: now.toISOString(),
        items: details,
      });
      return { code: 0, message: 'ok', data: { order_id: orderId } };
    }

    this.pushOrder(phone, {
      order_id: orderId,
      phone,
      order_type: 'service',
      city: city || undefined,
      pickup_address: String(body?.pickup_address || '').trim() || undefined,
      status: 'pending',
      total_cents: 0,
      currency: 'USD',
      created_at: now.toISOString(),
      meta: {
        match_mode: String(body?.match_mode || 'platform'),
        category: String(body?.category || ''),
      },
    });
    return { code: 0, message: 'ok', data: { order_id: orderId } };
  }

  async marketplaceCheckout(body: any) {
    const phone = this.normalizePhone(body?.phone);
    const cart = this.ensureCart(phone);
    const selected = (cart.items || []).filter((x) => x.selected);
    if (!selected.length) throw new BadRequestException('no selected items');

    const now = new Date();
    const orderId = `rpw_${now.getTime()}`;
    const total = selected.reduce(
      (s: number, x: any) => s + Number(x.unit_price_cents || 0) * Number(x.quantity || 0),
      0,
    );
    const items = selected.map((x: any) => ({
      product_id: x.product_id,
      name: x.name,
      unit_price_cents: x.unit_price_cents,
      quantity: x.quantity,
    }));

    this.pushOrder(phone, {
      order_id: orderId,
      phone,
      order_type: 'checkout',
      status: 'pending',
      total_cents: total,
      currency: 'USD',
      created_at: now.toISOString(),
      items,
      pickup_address: String(body?.pickup_address || '').trim() || undefined,
      meta: { conversation_channel: String(body?.conversation_channel || 'web') },
    });

    cart.items = cart.items.filter((x: any) => !x.selected);
    return { code: 0, message: 'ok', data: { order_id: orderId } };
  }

  async adminDashboardSummary() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const startIso = start.toISOString();

    const allOrders = [] as any[];
    for (const list of this.ordersByPhone.values()) {
      if (Array.isArray(list)) allOrders.push(...list);
    }

    const today = allOrders.filter((o) => {
      const created = String(o?.created_at || '');
      return created && created >= startIso;
    });

    const revenueCents = today.reduce((s, o) => s + Number(o?.total_cents || 0), 0);
    const revenueUsd = revenueCents / 100;

    const rewardCostUsd = 0;
    const profitRate = revenueUsd > 0 ? (revenueUsd - rewardCostUsd) / revenueUsd : 0;

    return {
      code: 0,
      message: 'ok',
      data: {
        revenue_usd: Number.isFinite(revenueUsd) ? revenueUsd : 0,
        reward_cost_usd: rewardCostUsd,
        profit_rate: Number.isFinite(profitRate) ? profitRate : 0,
        new_users: 0,
        plays: 0,
        orders: today.length,
      },
    };
  }

  async adminGetBusinessSettings() {
    return { code: 0, message: 'ok', data: this.businessSettings };
  }

  async adminUpdateBusinessSettings(body: any) {
    const next = {
      ...this.businessSettings,
      ...body,
    };

    const normalizeNum = (v: any, fallback: number) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    this.businessSettings = {
      points_per_usd: Math.max(0, Math.floor(normalizeNum(next.points_per_usd, this.businessSettings.points_per_usd))),
      claw_cost_points: Math.max(0, Math.floor(normalizeNum(next.claw_cost_points, this.businessSettings.claw_cost_points))),
      recycle_ratio: Math.min(1, Math.max(0, normalizeNum(next.recycle_ratio, this.businessSettings.recycle_ratio))),
      recycle_locked_ratio: Math.min(1, Math.max(0, normalizeNum(next.recycle_locked_ratio, this.businessSettings.recycle_locked_ratio))),
      recycle_cashable_ratio: Math.min(1, Math.max(0, normalizeNum(next.recycle_cashable_ratio, this.businessSettings.recycle_cashable_ratio))),
      withdraw_min_points: Math.max(0, Math.floor(normalizeNum(next.withdraw_min_points, this.businessSettings.withdraw_min_points))),
      withdraw_fee_ratio: Math.min(1, Math.max(0, normalizeNum(next.withdraw_fee_ratio, this.businessSettings.withdraw_fee_ratio))),
      reward_mode: (['low', 'normal', 'boost'].includes(String(next.reward_mode)) ? String(next.reward_mode) : 'normal') as
        | 'low'
        | 'normal'
        | 'boost',
      legendary_rate: Math.min(1, Math.max(0, normalizeNum(next.legendary_rate, this.businessSettings.legendary_rate))),
    };

    return { code: 0, message: 'ok', data: this.businessSettings };
  }

  async adminUsers(opts: {
    current?: string;
    pageSize?: string;
    keyword?: string;
    petType?: string;
    spendLevel?: string;
    status?: string;
  }) {
    try {
      const res = await this.internalGet<any>(`${this.identityBase()}/admin/users`, {
        current: opts.current,
        pageSize: opts.pageSize,
        keyword: opts.keyword,
        petType: opts.petType,
        spendLevel: opts.spendLevel,
        status: opts.status,
      });
      return res;
    } catch {
      const page = Math.max(1, Number(opts.current || 1));
      const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
      const all = Array.from(this.adminUsersStore.values());
      const start = (page - 1) * size;
      const items = all.slice(start, start + size);
      return { code: 0, message: 'ok', data: { items, total: all.length, current: page, pageSize: size } };
    }
  }

  async adminFreezeUser(opts: { globalUserId: string }) {
    const id = String(opts.globalUserId || '').trim();
    if (id) {
      const existed = this.adminUsersStore.get(id);
      if (existed) this.adminUsersStore.set(id, { ...existed, status: 'frozen' });
    }
    try {
      const res = await this.internalPost<any>(`${this.identityBase()}/admin/users/${encodeURIComponent(id)}/freeze`);
      return res;
    } catch {
      return { code: 0, message: 'ok', data: { global_user_id: id, status: 'frozen' } };
    }
  }

  async adminUnfreezeUser(opts: { globalUserId: string }) {
    const id = String(opts.globalUserId || '').trim();
    if (id) {
      const existed = this.adminUsersStore.get(id);
      if (existed) this.adminUsersStore.set(id, { ...existed, status: 'active' });
    }
    try {
      const res = await this.internalPost<any>(`${this.identityBase()}/admin/users/${encodeURIComponent(id)}/unfreeze`);
      return res;
    } catch {
      return { code: 0, message: 'ok', data: { global_user_id: id, status: 'active' } };
    }
  }

  async adminWithdrawRequests(opts: { current?: string; pageSize?: string; status?: string; globalUserId?: string }) {
    try {
      const res = await this.internalGet<any>(`${this.walletBase()}/admin/withdraw-requests`, {
        current: opts.current,
        pageSize: opts.pageSize,
        status: opts.status,
        globalUserId: opts.globalUserId,
      });
      return res;
    } catch {
      const page = Math.max(1, Number(opts.current || 1));
      const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
      const all = Array.from(this.adminWithdrawRequestsStore.values());
      const start = (page - 1) * size;
      const items = all.slice(start, start + size);
      return { code: 0, message: 'ok', data: { items, total: all.length, current: page, pageSize: size } };
    }
  }

  async adminWithdrawDecision(opts: { id: string; action: 'approve' | 'reject' }) {
    const id = String(opts.id || '').trim();
    const action = opts.action === 'approve' ? 'approve' : 'reject';
    const existed = this.adminWithdrawRequestsStore.get(id);
    if (existed) {
      this.adminWithdrawRequestsStore.set(id, { ...existed, status: action === 'approve' ? 'approved' : 'rejected' });
    }
    try {
      const res = await this.internalPost<any>(`${this.walletBase()}/admin/withdraw-requests/${encodeURIComponent(id)}/${action}`);
      return res;
    } catch {
      return { code: 0, message: 'ok', data: { id, status: action === 'approve' ? 'approved' : 'rejected' } };
    }
  }

  async adminMerchants(opts: { current?: string; pageSize?: string; status?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const st = String(opts.status || '').trim();
    let all = Array.from(this.adminMerchantsStore.values());
    if (st) all = all.filter((m) => m.status === st);
    const start = (page - 1) * size;
    const items = all.slice(start, start + size);
    return { code: 0, message: 'ok', data: { items, total: all.length, current: page, pageSize: size } };
  }

  async adminMerchantDecision(opts: { id: string; action: 'approve' | 'reject' | 'suspend' }) {
    const id = String(opts.id || '').trim();
    const existed = this.adminMerchantsStore.get(id);
    if (!existed) return { code: 0, message: 'ok', data: { id, status: 'unknown' } };
    const nextStatus =
      opts.action === 'approve' ? 'approved' : opts.action === 'reject' ? 'rejected' : ('suspended' as const);
    this.adminMerchantsStore.set(id, { ...existed, status: nextStatus });
    return { code: 0, message: 'ok', data: { id, status: nextStatus } };
  }

  async adminProducts(opts: { current?: string; pageSize?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const all = this.marketplaceProductsStore.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price_cents: p.price_cents,
      currency: p.currency,
      status: (p as any).status || 'published',
      merchant: p.merchant,
      production_time_days: p.production_time_days,
    }));
    const start = (page - 1) * size;
    const items = all.slice(start, start + size);
    return { code: 0, message: 'ok', data: { items, total: all.length, current: page, pageSize: size } };
  }

  async adminUpdateProduct(body: any) {
    const id = Number(body?.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const idx = this.marketplaceProductsStore.findIndex((p) => Number(p.id) === id);
    if (idx < 0) throw new BadRequestException('product not found');
    const existed: any = this.marketplaceProductsStore[idx];
    const next: any = { ...existed };
    if (typeof body?.name === 'string') next.name = String(body.name);
    if (typeof body?.category === 'string') next.category = String(body.category);
    if (typeof body?.price_cents !== 'undefined') {
      const pc = Number(body.price_cents);
      if (Number.isFinite(pc)) next.price_cents = Math.max(0, Math.floor(pc));
    }
    if (typeof body?.status === 'string') next.status = String(body.status);
    this.marketplaceProductsStore[idx] = next;
    return { code: 0, message: 'ok', data: next };
  }

  async adminSetProductStatus(opts: { id: string; status: 'published' | 'unpublished' }) {
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const idx = this.marketplaceProductsStore.findIndex((p) => Number(p.id) === id);
    if (idx < 0) throw new BadRequestException('product not found');
    const existed: any = this.marketplaceProductsStore[idx];
    const next: any = { ...existed, status: opts.status };
    this.marketplaceProductsStore[idx] = next;
    return { code: 0, message: 'ok', data: { id, status: opts.status } };
  }

  async adminServices(opts: { current?: string; pageSize?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const all = this.marketplaceServicesStore.map((s) => ({
      id: s.id,
      city: s.city,
      category: s.category,
      service_name: s.service_name,
      price_cents: s.price_cents,
      currency: s.currency,
      status: 'published',
    }));
    const start = (page - 1) * size;
    const items = all.slice(start, start + size);
    return { code: 0, message: 'ok', data: { items, total: all.length, current: page, pageSize: size } };
  }

  async adminOrders(opts: { current?: string; pageSize?: string; phone?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const phone = String(opts.phone || '').trim();
    const all = [] as any[];
    for (const [p, list] of this.ordersByPhone.entries()) {
      if (phone && p !== phone) continue;
      if (Array.isArray(list)) all.push(...list);
    }
    all.sort((a, b) => String(b?.created_at || '').localeCompare(String(a?.created_at || '')));
    const start = (page - 1) * size;
    const items = all.slice(start, start + size);
    return { code: 0, message: 'ok', data: { items, total: all.length, current: page, pageSize: size } };
  }

  async adminBridgeSummary() {
    return { code: 0, message: 'ok', data: { scenes: [], clicks: 0, conversions: 0 } };
  }

  async adminClawPools(opts: { current?: string; pageSize?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const all = Array.from(this.adminClawPoolsStore.values());
    const start = (page - 1) * size;
    const items = all.slice(start, start + size);
    return { code: 0, message: 'ok', data: { items, total: all.length, current: page, pageSize: size } };
  }

  async adminCreateClawPool(body: any) {
    const id = String(body?.id || `pool_${randomUUID()}`).trim();
    const now = new Date().toISOString();
    const pool = {
      id,
      pool_name: String(body?.pool_name || '新奖池'),
      mode: (['low', 'normal', 'boost'].includes(String(body?.mode)) ? String(body?.mode) : 'normal') as 'low' | 'normal' | 'boost',
      legendary_rate: Math.min(1, Math.max(0, Number(body?.legendary_rate ?? 0.05))),
      recycle_ratio: Math.min(1, Math.max(0, Number(body?.recycle_ratio ?? 0.8))),
      status: (['draft', 'active', 'inactive'].includes(String(body?.status)) ? String(body?.status) : 'draft') as
        | 'draft'
        | 'active'
        | 'inactive',
      updated_at: now,
    };
    this.adminClawPoolsStore.set(id, pool);
    return { code: 0, message: 'ok', data: pool };
  }

  async adminUpdateClawPool(body: any) {
    const id = String(body?.id || '').trim();
    if (!id) throw new BadRequestException('id required');
    const existed = this.adminClawPoolsStore.get(id);
    if (!existed) throw new BadRequestException('pool not found');
    const next = {
      ...existed,
      pool_name: typeof body?.pool_name === 'string' ? String(body.pool_name) : existed.pool_name,
      mode: (['low', 'normal', 'boost'].includes(String(body?.mode)) ? String(body?.mode) : existed.mode) as 'low' | 'normal' | 'boost',
      legendary_rate: typeof body?.legendary_rate !== 'undefined' ? Math.min(1, Math.max(0, Number(body.legendary_rate))) : existed.legendary_rate,
      recycle_ratio: typeof body?.recycle_ratio !== 'undefined' ? Math.min(1, Math.max(0, Number(body.recycle_ratio))) : existed.recycle_ratio,
      status: (['draft', 'active', 'inactive'].includes(String(body?.status)) ? String(body?.status) : existed.status) as
        | 'draft'
        | 'active'
        | 'inactive',
      updated_at: new Date().toISOString(),
    };
    this.adminClawPoolsStore.set(id, next);
    return { code: 0, message: 'ok', data: next };
  }

  async adminDeleteClawPool(opts: { id: string }) {
    const id = String(opts.id || '').trim();
    this.adminClawPoolsStore.delete(id);
    return { code: 0, message: 'ok', data: { id } };
  }

  async adminPublishClawPool(opts: { id: string }) {
    const id = String(opts.id || '').trim();
    const existed = this.adminClawPoolsStore.get(id);
    if (!existed) throw new BadRequestException('pool not found');
    const next = { ...existed, status: 'active' as const, updated_at: new Date().toISOString() };
    this.adminClawPoolsStore.set(id, next);
    return { code: 0, message: 'ok', data: { id, status: 'active' } };
  }

  async adminClawPlays(opts: { current?: string; pageSize?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    return { code: 0, message: 'ok', data: { items: [], total: 0, current: page, pageSize: size } };
  }

  async adminRiskSummary() {
    return {
      code: 0,
      message: 'ok',
      data: {
        highRiskUsers: 0,
        bigPrizeRate: 0,
        abnormalWithdraws: 0,
        abnormalGroups: 0,
      },
    };
  }

  async adminRiskAlerts(opts: { current?: string; pageSize?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const all = this.riskAlertsStore.map((a: any) => {
      const globalUserId = String(a?.global_user_id || '').trim();
      const u = globalUserId ? this.adminUsersStore.get(globalUserId) : null;
      return {
        ...a,
        user_status: u?.status || null,
      };
    });
    const start = (page - 1) * size;
    const items = all.slice(start, start + size);
    return { code: 0, message: 'ok', data: { items, total: all.length, current: page, pageSize: size } };
  }

  async adminAiOpsDaily() {
    if (!this.aiOpsState.last_daily) {
      this.aiOpsState.last_daily = {
        generated_at: new Date().toISOString(),
        summary: '暂无已生成日报。',
        issues: [],
        pool_suggestion: '建议先执行一次日报生成。',
        reactivation_suggestion: '建议先执行一次日报生成。',
        model_hint: 'nvidia_build (preferred) / fallback: stub',
      }
    }
    return { code: 0, message: 'ok', data: this.aiOpsState.last_daily }
  }

  async adminAiOpsGenerateDaily(body: any) {
    const now = new Date().toISOString()
    const focus = String(body?.focus || '').trim()
    const aiBase = this.aiBase()

    if (aiBase) {
      try {
        const res = await this.internalPost<any>(
          `${aiBase}/ai/ops/analyze`,
          {
          report: {
            focus: focus || null,
            generated_at: now,
          },
          metrics: {},
          },
          { 'x-global-user-id': 'admin' },
        )
        const ai = res?.data || {}
        const actions = Array.isArray(ai?.actions) ? ai.actions : []
        const high = actions
          .filter((x: any) => String(x?.priority || '') === 'high')
          .map((x: any) => String(x?.action || '').trim())
          .filter(Boolean)
        const midlow = actions
          .filter((x: any) => String(x?.priority || '') !== 'high')
          .map((x: any) => String(x?.action || '').trim())
          .filter(Boolean)

        const summary = String(ai?.analysis || '').trim() || (focus ? `今日重点：${focus}` : '今日概览：数据不足，先补齐报表。')
        const issues = Array.isArray(ai?.issues) ? ai.issues.map((x: any) => String(x)) : []
        const poolSuggestion = high.length ? high.join('；') : '建议先补齐 claw 抽奖成本/回收数据后再调参。'
        const reactivationSuggestion = midlow.length ? midlow.join('；') : '建议对 7d 未活跃用户做分层召回 A/B。'
        const modelHint = String(ai?.model_hint || ai?.model || 'ai-orchestrator')

        this.aiOpsState.last_daily = {
          generated_at: now,
          summary,
          issues,
          pool_suggestion: poolSuggestion,
          reactivation_suggestion: reactivationSuggestion,
          model_hint: modelHint,
        }
        return { code: 0, message: 'ok', data: this.aiOpsState.last_daily }
      } catch {
      }
    }

    const summary = focus ? `今日重点：${focus}` : '今日概览：运营保持稳定，建议关注异常提现与大奖比例。'
    const issues = ['利润率过低预警：建议检查奖励模式与回收比例', '提现异常预警：建议对高频用户进行复核']
    const poolSuggestion = '建议将 reward_mode 维持 normal；legendary_rate 保持在 0.03–0.06 区间并观察 24h。'
    const reactivationSuggestion = '建议对 7d 未活跃且 points_cashable > 阈值 的用户投放召回文案（分层 A/B）。'
    const modelHint = 'nvidia_build (preferred) / fallback: stub'

    this.aiOpsState.last_daily = {
      generated_at: now,
      summary,
      issues,
      pool_suggestion: poolSuggestion,
      reactivation_suggestion: reactivationSuggestion,
      model_hint: modelHint,
    }
    return { code: 0, message: 'ok', data: this.aiOpsState.last_daily }
  }

  async adminAiOpsPublish(body: any) {
    const title = String(body?.title || 'AI 建议发布').trim()
    this.aiOpsState.last_publish = { published_at: new Date().toISOString(), title, payload: body }
    return { code: 0, message: 'ok', data: this.aiOpsState.last_publish }
  }

  async adminAiOpsSmoke(_body: any) {
    const aiBase = this.aiBase()
    const details = ['api-gateway /api 健康：ok', 'admin ai endpoints：ok']
    if (aiBase) {
      try {
        await this.internalPost<any>(
          `${aiBase}/ai/ops/analyze`,
          { report: { smoke: true }, metrics: {} },
          { 'x-global-user-id': 'admin' },
        )
        details.push('ai-orchestrator：ok')
      } catch {
        details.push('ai-orchestrator：fail')
      }
    } else {
      details.push('ai-orchestrator：not_configured')
    }
    this.aiOpsState.last_smoke = {
      ran_at: new Date().toISOString(),
      status: 'pass',
      details: [...details, 'fallback 模式：ok'],
    }
    return { code: 0, message: 'ok', data: this.aiOpsState.last_smoke }
  }

  async adminAiGrowthGenerate(body: any) {
    const kind = String(body?.kind || 'push').trim()
    const tone = String(body?.tone || 'warm').trim()
    const topic = String(body?.topic || '拼团召回').trim()

    const aiBase = this.aiBase()
    if (aiBase) {
      try {
        const res = await this.internalPost<any>(
          `${aiBase}/ai/growth/generate`,
          {
          campaign: { topic, kind, tone },
          metrics: {},
          goal: `生成${kind}内容，语气=${tone}，主题=${topic}`,
          },
          { 'x-global-user-id': 'admin' },
        )
        const ai = res?.data || {}
        const video = ai?.video_script || {}
        const content =
          kind === 'tiktok'
            ? `【短视频脚本｜${topic}】\nhook：${String(video?.hook || '')}\ncontent：${String(video?.content || '')}\ncta：${String(
                video?.cta || '',
              )}\n\n裂变：${String(ai?.viral_copy || '')}\n\n策略：${String(ai?.strategy || '')}`
            : `【Push｜${topic}】\n${String(ai?.push_message || '')}\n\n裂变：${String(ai?.viral_copy || '')}\n\n策略：${String(
                ai?.strategy || '',
              )}`
        return {
          code: 0,
          message: 'ok',
          data: {
            kind,
            tone,
            topic,
            generated_at: new Date().toISOString(),
            content,
            raw_json: ai,
            model_hint: String(ai?.model_hint || 'ai-orchestrator'),
          },
        }
      } catch {
      }
    }

    const out = {
      kind,
      tone,
      topic,
      generated_at: new Date().toISOString(),
      content:
        kind === 'tiktok'
          ? `【短视频脚本｜${topic}】\n开场3秒：一个温柔的提醒…\n中段：讲清楚利益点与截止时间\n结尾CTA：点进来完成拼团，领取奖励。\n语气：${tone}`
          : `【Push｜${topic}】\n别让奖励过期～你的拼团还差最后一步，点我立即完成。\n语气：${tone}`,
      model_hint: 'nvidia_build (preferred) / fallback: stub',
    }
    return { code: 0, message: 'ok', data: out }
  }

  async adminAiRiskSummarize(body: any) {
    const globalUserId = String(body?.global_user_id || '').trim()

    const aiBase = this.aiBase()
    if (aiBase) {
      try {
        const walletLogs = globalUserId ? await this.getWalletLogs(globalUserId, 50) : []
        const res = await this.internalPost<any>(
          `${aiBase}/ai/risk/analyze`,
          {
          user_behavior: { global_user_id: globalUserId || null },
          wallet_logs: walletLogs,
          claw_plays: [],
          },
          { 'x-global-user-id': globalUserId || 'admin' },
        )
        const ai = res?.data || {}
        const flags = Array.isArray(ai?.flags) ? ai.flags.map((x: any) => String(x)) : []
        const action = ai?.action || {}
        const suggested = [
          action?.freeze ? '冻结账户（需要二次确认与审计）' : null,
          action?.delay_withdraw ? '延迟提现审核并复核' : null,
          action?.monitor ? '进入 24h 观察队列' : null,
        ].filter(Boolean)
        const out = {
          global_user_id: globalUserId || null,
          generated_at: new Date().toISOString(),
          summary: String(ai?.evidence || '').trim() || '暂无足够证据',
          suggested_actions: suggested.length ? suggested : ['复核提现记录', '观察 24h 行为是否恢复正常'],
          flags,
          risk_level: String(ai?.risk_level || '').trim() || null,
          risk_score: typeof ai?.risk_score === 'number' ? ai.risk_score : null,
          model_hint: String(ai?.model_hint || 'ai-orchestrator'),
        }
        return { code: 0, message: 'ok', data: out }
      } catch {
      }
    }

    const reason = globalUserId ? `用户 ${globalUserId} 存在异常模式：高频提现/短期大奖集中。` : '暂无指定用户，返回全局摘要（示例）。'
    const out = {
      global_user_id: globalUserId || null,
      generated_at: new Date().toISOString(),
      summary: reason,
      suggested_actions: ['复核提现记录', '必要时冻结账户并记录原因', '观察 24h 行为是否恢复正常'],
      model_hint: 'nvidia_build (preferred) / fallback: stub',
    }
    return { code: 0, message: 'ok', data: out }
  }

  async adminUserDetail(opts: { globalUserId: string }) {
    const id = String(opts.globalUserId || '').trim();
    if (!id) throw new BadRequestException('globalUserId required');
    try {
      const res = await this.internalGet<any>(`${this.identityBase()}/admin/users/${encodeURIComponent(id)}`);
      return res;
    } catch {
      const u = this.adminUsersStore.get(id);
      if (!u) throw new BadRequestException('user not found');
      return {
        code: 0,
        message: 'ok',
        data: {
          ...u,
          tags: [],
          wallet: {
            points_locked: 0,
            points_cashable: 0,
            wallet_cash: 0,
            credit_balance: 0,
          },
          recent_orders: [],
        },
      };
    }
  }

  async adminWalletOverview() {
    try {
      const res = await this.internalGet<any>(`${this.walletBase()}/admin/wallet/overview`);
      return res;
    } catch {
      return {
        code: 0,
        message: 'ok',
        data: {
          points_locked: 0,
          points_cashable: 0,
          wallet_cash: 0,
          total_earned: 0,
          total_spent: 0,
        },
      };
    }
  }

  async adminWalletLogs(opts: {
    current?: string;
    pageSize?: string;
    globalUserId?: string;
    bizType?: string;
    assetType?: string;
    refId?: string;
  }) {
    try {
      const res = await this.internalGet<any>(`${this.walletBase()}/admin/wallet/logs`, {
        current: opts.current,
        pageSize: opts.pageSize,
        globalUserId: opts.globalUserId,
        bizType: opts.bizType,
        assetType: opts.assetType,
        refId: opts.refId,
      });
      return res;
    } catch {
      const page = Math.max(1, Number(opts.current || 1));
      const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
      return { code: 0, message: 'ok', data: { items: [], total: 0, current: page, pageSize: size } };
    }
  }

  async orders(opts: { limit: number }) {
    return { code: 0, message: 'ok', data: { orders: [] } };
  }

  async groupsActive() {
    return { code: 0, message: 'ok', data: { groups: [] } };
  }

  async groupsDiscover() {
    return { code: 0, message: 'ok', data: { groups: [] } };
  }

  async createPlaysPayment(opts: { bundle: number }) {
    const b = Math.max(1, Math.min(10, Number(opts.bundle || 1)));
    const amount = b === 10 ? 13 : b === 3 ? 4 : 1.5;
    return {
      code: 0,
      message: 'ok',
      data: {
        display_id: `pay_${Date.now()}`,
        payment: { amount },
        pay: { usdtTrc20Address: '', abaName: '', abaId: '' },
      },
    };
  }

  async payment(opts: { id: string }) {
    return { code: 0, message: 'ok', data: { display_id: opts.id, payment: { id: opts.id, amount: 0, status: 'pending' } } };
  }

  async submitProof(opts: { id: string; proof_text: string }) {
    return { code: 0, message: 'ok', data: { id: opts.id, status: 'pending' } };
  }

  async submitProofFile(opts: { id: string; mime_type: string; file_base64: string }) {
    if (!opts.file_base64) throw new BadRequestException('file_base64 required');
    this.paymentProofFiles.set(opts.id, { mime_type: opts.mime_type, file_base64: opts.file_base64 });
    return { code: 0, message: 'ok', data: { id: opts.id, status: 'pending' } };
  }

  getProofFile(id: string) {
    return this.paymentProofFiles.get(id) || null;
  }

  async saveShipping(opts: {
    devTelegramId: string;
    telegramInitData: string;
    name: string;
    phone: string;
    address: string;
  }) {
    const tgId = this.getTelegramId(opts.devTelegramId, opts.telegramInitData);
    if (!tgId) throw new BadRequestException('missing telegram id');
    if (!opts.name || !opts.phone || !opts.address) throw new BadRequestException('invalid shipping');
    this.shippingByTelegramId.set(tgId, { name: opts.name, phone: opts.phone, address: opts.address });
    return { code: 0, message: 'ok', data: { saved: true } };
  }

  private findProductPoints(productId: number) {
    const list = [
      { id: 101, points: 10 },
      { id: 102, points: 25 },
    ];
    return list.find((p) => p.id === productId) || null;
  }

  async purchaseDirect(opts: { devTelegramId: string; telegramInitData: string; product_id: number }) {
    const tgId = this.getTelegramId(opts.devTelegramId, opts.telegramInitData);
    if (!tgId) throw new BadRequestException('missing telegram id');
    const linked = await this.linkUser(tgId);
    const p = this.findProductPoints(opts.product_id);
    if (!p) throw new BadRequestException('invalid product_id');

    await this.walletSpend(linked.global_user_id, p.points, `direct:${linked.global_user_id}:${opts.product_id}:${Date.now()}`, 'store_consume');
    const wallet = await this.getWallet(linked.global_user_id);
    return { code: 0, message: 'ok', data: { order_id: `so_${Date.now()}`, wallet } };
  }

  async purchaseGroup(opts: { devTelegramId: string; telegramInitData: string; product_id: number }) {
    const tgId = this.getTelegramId(opts.devTelegramId, opts.telegramInitData);
    if (!tgId) throw new BadRequestException('missing telegram id');
    const linked = await this.linkUser(tgId);
    const p = this.findProductPoints(opts.product_id);
    if (!p) throw new BadRequestException('invalid product_id');
    return {
      code: 0,
      message: 'ok',
      data: {
        group_id: `g_${Date.now()}`,
        product_id: p.id,
        points: p.points,
        global_user_id: linked.global_user_id,
      },
    };
  }

  async createGroup(opts: { product_id: number }) {
    const p = this.findProductPoints(opts.product_id);
    if (!p) throw new BadRequestException('invalid product_id');
    return { code: 0, message: 'ok', data: { group_id: `g_${Date.now()}`, product_id: p.id } };
  }

  async joinGroup(opts: { groupId: string }) {
    return { code: 0, message: 'ok', data: { joined: true, group_id: opts.groupId } };
  }

  async joinGroupPay(opts: { groupId: string }) {
    return { code: 0, message: 'ok', data: { status: 'pending', group_id: opts.groupId } };
  }

  private v1RandomId(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  }

  private v1BearerFromAuth(authHeader: string | undefined | null) {
    const h = String(authHeader || '').trim();
    if (!h) return '';
    if (h.toLowerCase().startsWith('bearer ')) return h.slice('bearer '.length).trim();
    return h;
  }

  async v1AuthTelegramLogin(body: any) {
    const telegramId = String(body?.telegram_id || '').trim();
    const role = String(body?.role || 'owner').trim();
    if (!telegramId) throw new BadRequestException('telegram_id required');
    const merchantId = `m_${telegramId}`;
    const merchant = { id: merchantId, telegram_id: telegramId, name: String(body?.name || '').trim() || merchantId, status: 'approved' };
    this.v1MerchantsById.set(merchantId, merchant);
    const token = `mtk_${randomUUID()}`;
    this.v1MerchantTokenToId.set(token, merchantId);
    if (role === 'merchant') {
      return { code: 0, message: 'ok', data: { pending_approval: false, token, merchant } };
    }
    const phone = this.normalizePhone(body?.phone || `tg_${telegramId}`);
    const user = { id: `u_${telegramId}`, phone, telegram_id: telegramId, name: String(body?.name || '').trim() || `用户_${telegramId}` };
    this.v1UsersByPhone.set(phone, user);
    return { code: 0, message: 'ok', data: { pending_approval: false, token: `utk_${randomUUID()}`, user } };
  }

  async v1AuthTelegramWebappLogin(body: any) {
    const role = String(body?.role || 'owner').trim();
    const initData = String(body?.init_data || '').trim();
    if (!initData) throw new BadRequestException('init_data required');
    const phone = this.normalizePhone(`tg_${Date.now()}`);
    const user = { id: this.v1RandomId('u'), phone, role, name: 'Telegram 用户' };
    this.v1UsersByPhone.set(phone, user);
    return { code: 0, message: 'ok', data: { token: `utk_${randomUUID()}`, user } };
  }

  async v1AuthTelegramWebappBindPhone(body: any) {
    const initData = String(body?.init_data || '').trim();
    if (!initData) throw new BadRequestException('init_data required');
    const phone = this.normalizePhone(body?.phone);
    if (!phone) throw new BadRequestException('phone required');
    const u = {
      id: this.v1RandomId('u'),
      phone,
      name: String(body?.name || '').trim() || phone,
      email: body?.email ? String(body.email) : null,
      language: body?.language ? String(body.language) : null,
      telegram_bound: true,
    };
    this.v1UsersByPhone.set(phone, u);
    return { code: 0, message: 'ok', data: { token: `utk_${randomUUID()}`, user: u } };
  }

  async v1UserByPhone(phone: string) {
    const p = this.normalizePhone(phone);
    const u = this.v1UsersByPhone.get(p) || null;
    return { code: 0, message: 'ok', data: u };
  }

  async v1CreateUser(body: any) {
    const phone = this.normalizePhone(body?.phone);
    if (!phone) throw new BadRequestException('phone required');
    const u = {
      id: this.v1RandomId('u'),
      phone,
      name: String(body?.name || '').trim() || phone,
      email: body?.email ? String(body.email) : null,
      language: body?.language ? String(body.language) : null,
      telegram_id: body?.telegram_id ? String(body.telegram_id) : null,
    };
    this.v1UsersByPhone.set(phone, u);
    return { code: 0, message: 'ok', data: u };
  }

  async v1PetsList(phone: string) {
    const p = this.normalizePhone(phone);
    const items = this.v1PetsByPhone.get(p) || [];
    return { code: 0, message: 'ok', data: { items } };
  }

  async v1PetUpsert(body: any) {
    const phone = this.normalizePhone(body?.phone);
    if (!phone) throw new BadRequestException('phone required');
    const list = this.v1PetsByPhone.get(phone) || [];
    const id = body?.id ? Number(body.id) : null;
    if (id != null && Number.isFinite(id)) {
      const idx = list.findIndex((x: any) => Number(x.id) === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...(body || {}) };
        this.v1PetsByPhone.set(phone, list);
        return { code: 0, message: 'ok', data: list[idx] };
      }
    }
    const next = { id: Date.now(), phone, name: String(body?.name || '').trim() || '宠物', type: body?.type || null, ...body };
    list.unshift(next);
    this.v1PetsByPhone.set(phone, list);
    return { code: 0, message: 'ok', data: next };
  }

  async v1PetDelete(opts: { id: string; phone: string }) {
    const phone = this.normalizePhone(opts.phone);
    const id = Number(opts.id);
    const list = this.v1PetsByPhone.get(phone) || [];
    this.v1PetsByPhone.set(
      phone,
      list.filter((x: any) => Number(x.id) !== id),
    );
    return { code: 0, message: 'ok', data: { deleted: true } };
  }

  async v1OrdersByPhone(phone: string) {
    const p = this.normalizePhone(phone);
    const items = (this.ordersByPhone.get(p) || []).map((o: any) => ({
      id: o.order_id,
      order_id: o.order_id,
      phone: o.phone,
      order_type: o.order_type,
      status: o.status,
      total_cents: o.total_cents,
      currency: o.currency,
      created_at: o.created_at,
      items: o.items,
      meta: o.meta,
    }));
    return { code: 0, message: 'ok', data: { items } };
  }

  async v1OrderDetail(orderId: string) {
    const id = String(orderId || '').trim();
    if (!id) throw new BadRequestException('orderId required');
    for (const list of this.ordersByPhone.values()) {
      const hit = (list || []).find((x: any) => String(x?.order_id) === id);
      if (hit) return { code: 0, message: 'ok', data: hit };
    }
    throw new BadRequestException('order not found');
  }

  async v1PaymentsByPhone(phone: string) {
    const p = this.normalizePhone(phone);
    const items = this.v1PaymentsStoreByPhone.get(p) || [];
    return { code: 0, message: 'ok', data: { items } };
  }

  async v1PaymentsByOrder(orderId: string) {
    const id = String(orderId || '').trim();
    if (!id) throw new BadRequestException('orderId required');
    const payments: any[] = [];
    for (const list of this.v1PaymentsStoreByPhone.values()) {
      for (const p of list) {
        if (String(p?.order_id || '') === id) payments.push(p);
      }
    }
    return { code: 0, message: 'ok', data: { items: payments } };
  }

  async v1OrdersIntake(body: any) {
    const phone = this.normalizePhone(body?.phone || body?.meta?.phone);
    if (!phone) throw new BadRequestException('phone required');
    const orderType = String(body?.order_type || body?.meta?.order_type || 'service');
    if (orderType === 'product') {
      return this.marketplaceCreateOrder({
        order_type: 'product',
        phone,
        city: body?.city || body?.meta?.city,
        conversation_channel: 'webapp',
        product_items: body?.product_items || body?.meta?.product_items || [],
      });
    }
    return this.marketplaceCreateOrder({
      order_type: 'service',
      phone,
      city: body?.city || body?.meta?.city,
      pickup_address: body?.pickup_address || body?.meta?.pickup_address,
      match_mode: body?.match_mode || body?.meta?.match_mode || 'platform',
      category: body?.category || body?.meta?.category || 'cremation',
      conversation_channel: 'webapp',
    });
  }

  async v1MarketplaceCategories() {
    const items = [
      { key: 'urn', label: '骨灰盒' },
      { key: 'jewelry', label: '骨灰首饰' },
      { key: 'frame', label: '纪念相框' },
      { key: 'art', label: '纪念艺术' },
      { key: 'service', label: '服务' },
    ];
    return { code: 0, message: 'ok', data: { items } };
  }

  async v1CemeteryLayout() {
    return { code: 0, message: 'ok', data: { rows: 6, cols: 10, reserved: [] } };
  }

  async v1GeoReverse(_opts: { lat: string; lng: string }) {
    return { code: 0, message: 'ok', data: { address: 'Phnom Penh', city: 'Phnom Penh' } };
  }

  async v1MemorialFavoritesList(phone: string) {
    const p = this.normalizePhone(phone);
    const set = this.v1MemorialFavoritesByPhone.get(p) || new Set<number>();
    const items = Array.from(set.values()).map((id) => ({ memorial_id: id }));
    return { code: 0, message: 'ok', data: { items } };
  }

  async v1MemorialFavoritesAdd(body: any) {
    const phone = this.normalizePhone(body?.phone);
    const memorialId = Number(body?.memorial_id);
    if (!phone) throw new BadRequestException('phone required');
    if (!Number.isFinite(memorialId)) throw new BadRequestException('memorial_id required');
    const set = this.v1MemorialFavoritesByPhone.get(phone) || new Set<number>();
    set.add(memorialId);
    this.v1MemorialFavoritesByPhone.set(phone, set);
    return { code: 0, message: 'ok', data: { ok: true } };
  }

  async v1MemorialFavoritesDelete(opts: { phone: string; memorialId: string }) {
    const phone = this.normalizePhone(opts.phone);
    const memorialId = Number(opts.memorialId);
    if (!phone) throw new BadRequestException('phone required');
    if (!Number.isFinite(memorialId)) throw new BadRequestException('memorial_id required');
    const set = this.v1MemorialFavoritesByPhone.get(phone) || new Set<number>();
    set.delete(memorialId);
    this.v1MemorialFavoritesByPhone.set(phone, set);
    return { code: 0, message: 'ok', data: { ok: true } };
  }

  private v1MerchantFromReq(req: any) {
    const token = this.v1BearerFromAuth(req?.headers?.authorization);
    const id = this.v1MerchantTokenToId.get(token) || '';
    const m = id ? this.v1MerchantsById.get(id) : null;
    if (!m) throw new BadRequestException('unauthorized');
    return m;
  }

  async v1MerchantMe(req: any) {
    const m = this.v1MerchantFromReq(req);
    return { code: 0, message: 'ok', data: m };
  }

  async v1MerchantOrders(_req: any) {
    return { code: 0, message: 'ok', data: { items: [] } };
  }

  async v1MerchantOrderDetail(_req: any, orderId: string) {
    const id = String(orderId || '').trim();
    if (!id) throw new BadRequestException('orderId required');
    return { code: 0, message: 'ok', data: { id, status: 'pending', items: [] } };
  }

  async v1MerchantProducts(req: any) {
    const m = this.v1MerchantFromReq(req);
    const items = this.marketplaceProductsStore
      .filter((p: any) => String(p?.merchant?.id || '') === String(m.id))
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        price_cents: p.price_cents,
        currency: p.currency,
        stock: p.stock ?? 0,
        status: p.status || 'published',
        images: p.images || [],
      }));
    return { code: 0, message: 'ok', data: { items } };
  }

  async v1MerchantCreateProduct(req: any, body: any) {
    const m = this.v1MerchantFromReq(req);
    const id = Number(Date.now());
    const next: any = {
      id,
      category: String(body?.category || 'urn'),
      name: String(body?.name || '').trim() || `商品_${id}`,
      description: body?.description ? String(body.description) : null,
      price_cents: Math.max(0, Math.floor(Number(body?.price_cents || 0))),
      currency: String(body?.currency || 'USD'),
      images: [],
      merchant: { id: m.id, name: m.name },
      production_time_days: Math.max(0, Math.floor(Number(body?.production_time_days || 3))),
      delivery_type: String(body?.delivery_type || 'shipment'),
      stock: Math.max(0, Math.floor(Number(body?.stock || 0))),
      status: 'draft',
      sales_7d: 0,
    };
    this.marketplaceProductsStore.unshift(next);
    return { code: 0, message: 'ok', data: next };
  }

  async v1MerchantUpdateProduct(req: any, opts: { id: string; body: any }) {
    const m = this.v1MerchantFromReq(req);
    const id = Number(opts.id);
    const idx = this.marketplaceProductsStore.findIndex((p: any) => Number(p.id) === id);
    if (idx < 0) throw new BadRequestException('product not found');
    const existed: any = this.marketplaceProductsStore[idx];
    if (String(existed?.merchant?.id || '') !== String(m.id)) throw new BadRequestException('forbidden');
    const next: any = { ...existed };
    if (typeof opts.body?.price_cents !== 'undefined') next.price_cents = Math.max(0, Math.floor(Number(opts.body.price_cents || 0)));
    if (typeof opts.body?.name === 'string') next.name = String(opts.body.name);
    if (typeof opts.body?.description === 'string' || opts.body?.description === null) next.description = opts.body.description;
    this.marketplaceProductsStore[idx] = next;
    return { code: 0, message: 'ok', data: next };
  }

  async v1MerchantSetStatus(req: any, opts: { id: string; status: string }) {
    const m = this.v1MerchantFromReq(req);
    const id = Number(opts.id);
    const idx = this.marketplaceProductsStore.findIndex((p: any) => Number(p.id) === id);
    if (idx < 0) throw new BadRequestException('product not found');
    const existed: any = this.marketplaceProductsStore[idx];
    if (String(existed?.merchant?.id || '') !== String(m.id)) throw new BadRequestException('forbidden');
    existed.status = String(opts.status || 'draft');
    this.marketplaceProductsStore[idx] = existed;
    return { code: 0, message: 'ok', data: { id, status: existed.status } };
  }

  async v1MerchantSetStock(req: any, opts: { id: string; stock: number }) {
    const m = this.v1MerchantFromReq(req);
    const id = Number(opts.id);
    const idx = this.marketplaceProductsStore.findIndex((p: any) => Number(p.id) === id);
    if (idx < 0) throw new BadRequestException('product not found');
    const existed: any = this.marketplaceProductsStore[idx];
    if (String(existed?.merchant?.id || '') !== String(m.id)) throw new BadRequestException('forbidden');
    existed.stock = Math.max(0, Math.floor(Number(opts.stock || 0)));
    this.marketplaceProductsStore[idx] = existed;
    return { code: 0, message: 'ok', data: { id, stock: existed.stock } };
  }

  async v1MerchantAddImage(req: any, opts: { id: string; image_url: string }) {
    const m = this.v1MerchantFromReq(req);
    const id = Number(opts.id);
    const idx = this.marketplaceProductsStore.findIndex((p: any) => Number(p.id) === id);
    if (idx < 0) throw new BadRequestException('product not found');
    const existed: any = this.marketplaceProductsStore[idx];
    if (String(existed?.merchant?.id || '') !== String(m.id)) throw new BadRequestException('forbidden');
    const url = String(opts.image_url || '').trim();
    if (!url) throw new BadRequestException('image_url required');
    if (!Array.isArray(existed.images)) existed.images = [];
    existed.images.push({ id: this.v1RandomId('img'), image_url: url });
    this.marketplaceProductsStore[idx] = existed;
    return { code: 0, message: 'ok', data: { ok: true } };
  }

  async v1MerchantSortImages(req: any, opts: { id: string; image_ids: string[] }) {
    const m = this.v1MerchantFromReq(req);
    const id = Number(opts.id);
    const idx = this.marketplaceProductsStore.findIndex((p: any) => Number(p.id) === id);
    if (idx < 0) throw new BadRequestException('product not found');
    const existed: any = this.marketplaceProductsStore[idx];
    if (String(existed?.merchant?.id || '') !== String(m.id)) throw new BadRequestException('forbidden');
    const ids = Array.isArray(opts.image_ids) ? opts.image_ids.map(String) : [];
    const current = Array.isArray(existed.images) ? existed.images : [];
    const byId = new Map(current.map((x: any) => [String(x.id || ''), x]));
    const next = ids.map((i) => byId.get(String(i))).filter(Boolean);
    existed.images = next.length ? next : current;
    this.marketplaceProductsStore[idx] = existed;
    return { code: 0, message: 'ok', data: { ok: true } };
  }

  async v1MerchantDeleteImage(req: any, opts: { id: string; imageId: string }) {
    const m = this.v1MerchantFromReq(req);
    const id = Number(opts.id);
    const idx = this.marketplaceProductsStore.findIndex((p: any) => Number(p.id) === id);
    if (idx < 0) throw new BadRequestException('product not found');
    const existed: any = this.marketplaceProductsStore[idx];
    if (String(existed?.merchant?.id || '') !== String(m.id)) throw new BadRequestException('forbidden');
    const imageId = String(opts.imageId || '').trim();
    existed.images = (Array.isArray(existed.images) ? existed.images : []).filter((x: any) => String(x.id || '') !== imageId);
    this.marketplaceProductsStore[idx] = existed;
    return { code: 0, message: 'ok', data: { ok: true } };
  }

  async v1MerchantRevenue(_req: any) {
    return { code: 0, message: 'ok', data: { total_amount_cents: 0, platform_fee_cents: 0, merchant_payout_cents: 0, items: [] } };
  }

  async v1MerchantNotifications(_req: any) {
    return { code: 0, message: 'ok', data: { items: [] } };
  }

  async v1MerchantReviewHistory(_req: any) {
    return { code: 0, message: 'ok', data: { items: [] } };
  }

  async v1MerchantSettlementRequests(_req: any) {
    return { code: 0, message: 'ok', data: { items: [] } };
  }

  async v1MerchantCreateSettlementRequest(_req: any, _body?: any) {
    return { code: 0, message: 'ok', data: { id: this.v1RandomId('settle'), status: 'pending' } };
  }

  async v1MerchantOrderAction(_req: any) {
    return { code: 0, message: 'ok', data: { ok: true } };
  }

  private opsActor(req: any) {
    const actor = String(req?.headers?.['x-admin-actor'] || '').trim();
    const role = String(req?.headers?.['x-admin-role'] || '').trim();
    const v = actor || 'admin';
    return role ? `${v}(${role})` : v;
  }

  private getOpsPg() {
    if (this.opsPg) return this.opsPg;
    const host = String(process.env.POSTGRES_HOST || '').trim();
    const db = String(process.env.POSTGRES_DB || '').trim();
    const user = String(process.env.POSTGRES_USER || '').trim();
    const password = String(process.env.POSTGRES_PASSWORD || '').trim();
    const port = Number(process.env.POSTGRES_PORT || 5432);
    if (!host || !db || !user) return null;
    this.opsPg = new Pool({ host, port, database: db, user, password, max: 5 });
    return this.opsPg;
  }

  private async opsQuery<T extends QueryResultRow = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    const pg = this.getOpsPg();
    if (!pg) throw new BadRequestException('db not configured');
    return pg.query<T>(text, params);
  }

  private iso(v: any) {
    if (v == null) return null;
    const d = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toISOString();
  }

  private async opsAudit(req: any, module: string, action: string, targetType: string, targetId: any, reason: string, requestJson: any, resultJson: any, success: boolean) {
    try {
      await this.opsQuery(
        `INSERT INTO ops.admin_audit_logs(actor,module,action,target_type,target_id,reason,request_json,result_json,success)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [this.opsActor(req), module, action, targetType, targetId != null ? String(targetId) : null, reason || null, requestJson ?? null, resultJson ?? null, success],
      );
    } catch {
      return;
    }
  }

  async adminCampaigns(opts: { current?: string; pageSize?: string; status?: string; type?: string; keyword?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const status = String(opts.status || '').trim();
    const type = String(opts.type || '').trim();
    const keyword = String(opts.keyword || '').trim();
    const where: string[] = [];
    const params: any[] = [];
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (type) {
      params.push(type);
      where.push(`type = $${params.length}`);
    }
    if (keyword) {
      params.push(`%${keyword}%`);
      where.push(`name ILIKE $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRes = await this.opsQuery<{ total: string }>(`SELECT COUNT(*)::text AS total FROM ops.activity_configs ${whereSql}`, params);
    const total = Number(countRes.rows?.[0]?.total || 0);
    const listRes = await this.opsQuery<any>(
      `SELECT id,type,name,start_at,end_at,scope_json,status,version,created_at,updated_at
       FROM ops.activity_configs ${whereSql}
       ORDER BY updated_at DESC, id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, size, (page - 1) * size],
    );
    const items = listRes.rows.map((r: any) => ({
      id: Number(r.id),
      type: r.type,
      name: r.name,
      start_at: this.iso(r.start_at),
      end_at: this.iso(r.end_at),
      scope_json: r.scope_json || {},
      status: r.status,
      version: Number(r.version || 1),
      created_at: this.iso(r.created_at),
      updated_at: this.iso(r.updated_at),
    }));
    return { code: 0, message: 'ok', data: { items, total, current: page, pageSize: size } };
  }

  async adminCampaignDetail(opts: { id: string }) {
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const res = await this.opsQuery<any>(
      `SELECT id,type,name,start_at,end_at,scope_json,status,version,created_at,updated_at
       FROM ops.activity_configs WHERE id = $1`,
      [id],
    );
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    return {
      code: 0,
      message: 'ok',
      data: {
        id: Number(r.id),
        type: r.type,
        name: r.name,
        start_at: this.iso(r.start_at),
        end_at: this.iso(r.end_at),
        scope_json: r.scope_json || {},
        status: r.status,
        version: Number(r.version || 1),
        created_at: this.iso(r.created_at),
        updated_at: this.iso(r.updated_at),
      },
    };
  }

  async adminCampaignCreate(req: any, body: any) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const type = String(body?.type || 'other').trim();
    const name = String(body?.name || '').trim();
    const startAt = body?.start_at ? new Date(body.start_at) : null;
    const endAt = body?.end_at ? new Date(body.end_at) : null;
    if (!name) throw new BadRequestException('name required');
    if (!startAt || Number.isNaN(startAt.getTime())) throw new BadRequestException('start_at required');
    if (!endAt || Number.isNaN(endAt.getTime())) throw new BadRequestException('end_at required');
    if (endAt <= startAt) throw new BadRequestException('invalid time range');
    const scope = body?.scope_json && typeof body.scope_json === 'object' ? body.scope_json : {};
    const status = ['draft', 'active', 'inactive', 'archived'].includes(String(body?.status || 'draft')) ? String(body.status || 'draft') : 'draft';
    const res = await this.opsQuery<any>(
      `INSERT INTO ops.activity_configs(type,name,start_at,end_at,scope_json,status,version,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,1,now(),now())
       RETURNING id,type,name,start_at,end_at,scope_json,status,version,created_at,updated_at`,
      [type, name, startAt.toISOString(), endAt.toISOString(), scope, status],
    );
    const r = res.rows[0];
    const data = {
      id: Number(r.id),
      type: r.type,
      name: r.name,
      start_at: this.iso(r.start_at),
      end_at: this.iso(r.end_at),
      scope_json: r.scope_json || {},
      status: r.status,
      version: Number(r.version || 1),
      created_at: this.iso(r.created_at),
      updated_at: this.iso(r.updated_at),
    };
    await this.opsAudit(req, 'activity', 'create', 'activity_config', data.id, reason, body, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminCampaignUpdate(req: any, opts: { id: string; body: any }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const body = opts.body || {};
    const existed = await this.opsQuery<any>(`SELECT * FROM ops.activity_configs WHERE id=$1`, [id]);
    const row = existed.rows?.[0];
    if (!row) throw new BadRequestException('not found');
    const type = typeof body.type === 'string' ? String(body.type) : String(row.type);
    const name = typeof body.name === 'string' ? String(body.name).trim() : String(row.name);
    const startAt = typeof body.start_at !== 'undefined' ? new Date(body.start_at) : new Date(row.start_at);
    const endAt = typeof body.end_at !== 'undefined' ? new Date(body.end_at) : new Date(row.end_at);
    if (!name) throw new BadRequestException('name required');
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) throw new BadRequestException('invalid time range');
    const scope = body?.scope_json && typeof body.scope_json === 'object' ? body.scope_json : row.scope_json || {};
    const status = typeof body.status === 'string' && ['draft', 'active', 'inactive', 'archived'].includes(String(body.status)) ? String(body.status) : String(row.status);
    const res = await this.opsQuery<any>(
      `UPDATE ops.activity_configs
       SET type=$2,name=$3,start_at=$4,end_at=$5,scope_json=$6,status=$7,updated_at=now()
       WHERE id=$1
       RETURNING id,type,name,start_at,end_at,scope_json,status,version,created_at,updated_at`,
      [id, type, name, startAt.toISOString(), endAt.toISOString(), scope, status],
    );
    const r = res.rows[0];
    const data = {
      id: Number(r.id),
      type: r.type,
      name: r.name,
      start_at: this.iso(r.start_at),
      end_at: this.iso(r.end_at),
      scope_json: r.scope_json || {},
      status: r.status,
      version: Number(r.version || 1),
      created_at: this.iso(r.created_at),
      updated_at: this.iso(r.updated_at),
    };
    await this.opsAudit(req, 'activity', 'update', 'activity_config', data.id, reason, body, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminCampaignDelete(req: any, opts: { id: string }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const res = await this.opsQuery<any>(
      `UPDATE ops.activity_configs SET status='archived', updated_at=now() WHERE id=$1 RETURNING id,status`,
      [id],
    );
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    const data = { id: Number(r.id), status: String(r.status) };
    await this.opsAudit(req, 'activity', 'delete', 'activity_config', data.id, reason, { id }, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminCampaignPublish(req: any, opts: { id: string }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const res = await this.opsQuery<any>(
      `UPDATE ops.activity_configs
       SET status='active', version=version+1, updated_at=now()
       WHERE id=$1
       RETURNING id,status,version,updated_at`,
      [id],
    );
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    const data = { id: Number(r.id), status: String(r.status), version: Number(r.version || 1), updated_at: this.iso(r.updated_at) };
    await this.opsAudit(req, 'activity', 'publish', 'activity_config', data.id, reason, { id }, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminCampaignDeactivate(req: any, opts: { id: string }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const res = await this.opsQuery<any>(
      `UPDATE ops.activity_configs
       SET status='inactive', updated_at=now()
       WHERE id=$1
       RETURNING id,status,updated_at`,
      [id],
    );
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    const data = { id: Number(r.id), status: String(r.status), updated_at: this.iso(r.updated_at) };
    await this.opsAudit(req, 'activity', 'deactivate', 'activity_config', data.id, reason, { id }, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminGroups(opts: { current?: string; pageSize?: string; status?: string; keyword?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const status = String(opts.status || '').trim();
    const keyword = String(opts.keyword || '').trim();
    const where: string[] = [];
    const params: any[] = [];
    if (status) {
      params.push(status);
      where.push(`c.status = $${params.length}`);
    }
    if (keyword) {
      params.push(`%${keyword}%`);
      where.push(`c.name ILIKE $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRes = await this.opsQuery<{ total: string }>(`SELECT COUNT(*)::text AS total FROM ops.groupbuy_campaigns c ${whereSql}`, params);
    const total = Number(countRes.rows?.[0]?.total || 0);
    const listRes = await this.opsQuery<any>(
      `SELECT c.id,c.activity_config_id,c.name,c.group_size,c.valid_minutes,c.stock,c.status,c.created_at,c.updated_at,
              ac.name AS activity_config_name
       FROM ops.groupbuy_campaigns c
       LEFT JOIN ops.activity_configs ac ON ac.id = c.activity_config_id
       ${whereSql}
       ORDER BY c.updated_at DESC, c.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, size, (page - 1) * size],
    );
    const items = listRes.rows.map((r: any) => ({
      id: Number(r.id),
      activity_config_id: r.activity_config_id != null ? Number(r.activity_config_id) : null,
      activity_config_name: r.activity_config_name || null,
      name: r.name,
      group_size: Number(r.group_size || 0),
      valid_minutes: Number(r.valid_minutes || 0),
      stock: Number(r.stock || 0),
      status: r.status,
      created_at: this.iso(r.created_at),
      updated_at: this.iso(r.updated_at),
    }));
    return { code: 0, message: 'ok', data: { items, total, current: page, pageSize: size } };
  }

  async adminGroupDetail(opts: { id: string }) {
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const res = await this.opsQuery<any>(
      `SELECT c.id,c.activity_config_id,c.name,c.group_size,c.valid_minutes,c.stock,c.status,c.created_at,c.updated_at,
              ac.name AS activity_config_name
       FROM ops.groupbuy_campaigns c
       LEFT JOIN ops.activity_configs ac ON ac.id = c.activity_config_id
       WHERE c.id = $1`,
      [id],
    );
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    return {
      code: 0,
      message: 'ok',
      data: {
        id: Number(r.id),
        activity_config_id: r.activity_config_id != null ? Number(r.activity_config_id) : null,
        activity_config_name: r.activity_config_name || null,
        name: r.name,
        group_size: Number(r.group_size || 0),
        valid_minutes: Number(r.valid_minutes || 0),
        stock: Number(r.stock || 0),
        status: r.status,
        created_at: this.iso(r.created_at),
        updated_at: this.iso(r.updated_at),
      },
    };
  }

  async adminGroupCreate(req: any, body: any) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const name = String(body?.name || '').trim();
    const activityConfigId = body?.activity_config_id != null ? Number(body.activity_config_id) : null;
    const groupSize = Math.max(2, Math.floor(Number(body?.group_size || 2)));
    const validMinutes = Math.max(5, Math.floor(Number(body?.valid_minutes || 60)));
    const stock = Math.max(0, Math.floor(Number(body?.stock || 0)));
    const status = ['draft', 'active', 'inactive', 'archived'].includes(String(body?.status || 'draft')) ? String(body.status || 'draft') : 'draft';
    if (!name) throw new BadRequestException('name required');
    if (activityConfigId != null && !Number.isFinite(activityConfigId)) throw new BadRequestException('invalid activity_config_id');
    const res = await this.opsQuery<any>(
      `INSERT INTO ops.groupbuy_campaigns(activity_config_id,name,group_size,valid_minutes,stock,status,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,now(),now())
       RETURNING id,activity_config_id,name,group_size,valid_minutes,stock,status,created_at,updated_at`,
      [activityConfigId, name, groupSize, validMinutes, stock, status],
    );
    const r = res.rows[0];
    const data = {
      id: Number(r.id),
      activity_config_id: r.activity_config_id != null ? Number(r.activity_config_id) : null,
      name: r.name,
      group_size: Number(r.group_size || 0),
      valid_minutes: Number(r.valid_minutes || 0),
      stock: Number(r.stock || 0),
      status: r.status,
      created_at: this.iso(r.created_at),
      updated_at: this.iso(r.updated_at),
    };
    await this.opsAudit(req, 'groupbuy', 'create', 'groupbuy_campaign', data.id, reason, body, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminGroupUpdate(req: any, opts: { id: string; body: any }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const body = opts.body || {};
    const existed = await this.opsQuery<any>(`SELECT * FROM ops.groupbuy_campaigns WHERE id=$1`, [id]);
    const row = existed.rows?.[0];
    if (!row) throw new BadRequestException('not found');
    const name = typeof body.name === 'string' ? String(body.name).trim() : String(row.name);
    const activityConfigId = typeof body.activity_config_id !== 'undefined' ? (body.activity_config_id != null ? Number(body.activity_config_id) : null) : row.activity_config_id;
    const groupSize = typeof body.group_size !== 'undefined' ? Math.max(2, Math.floor(Number(body.group_size || 2))) : Number(row.group_size || 2);
    const validMinutes = typeof body.valid_minutes !== 'undefined' ? Math.max(5, Math.floor(Number(body.valid_minutes || 60))) : Number(row.valid_minutes || 60);
    const stock = typeof body.stock !== 'undefined' ? Math.max(0, Math.floor(Number(body.stock || 0))) : Number(row.stock || 0);
    const status = typeof body.status === 'string' && ['draft', 'active', 'inactive', 'archived'].includes(String(body.status)) ? String(body.status) : String(row.status);
    if (!name) throw new BadRequestException('name required');
    if (activityConfigId != null && !Number.isFinite(Number(activityConfigId))) throw new BadRequestException('invalid activity_config_id');
    const res = await this.opsQuery<any>(
      `UPDATE ops.groupbuy_campaigns
       SET activity_config_id=$2,name=$3,group_size=$4,valid_minutes=$5,stock=$6,status=$7,updated_at=now()
       WHERE id=$1
       RETURNING id,activity_config_id,name,group_size,valid_minutes,stock,status,created_at,updated_at`,
      [id, activityConfigId, name, groupSize, validMinutes, stock, status],
    );
    const r = res.rows[0];
    const data = {
      id: Number(r.id),
      activity_config_id: r.activity_config_id != null ? Number(r.activity_config_id) : null,
      name: r.name,
      group_size: Number(r.group_size || 0),
      valid_minutes: Number(r.valid_minutes || 0),
      stock: Number(r.stock || 0),
      status: r.status,
      created_at: this.iso(r.created_at),
      updated_at: this.iso(r.updated_at),
    };
    await this.opsAudit(req, 'groupbuy', 'update', 'groupbuy_campaign', data.id, reason, body, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminGroupDelete(req: any, opts: { id: string }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const res = await this.opsQuery<any>(`UPDATE ops.groupbuy_campaigns SET status='archived', updated_at=now() WHERE id=$1 RETURNING id,status`, [id]);
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    const data = { id: Number(r.id), status: String(r.status) };
    await this.opsAudit(req, 'groupbuy', 'delete', 'groupbuy_campaign', data.id, reason, { id }, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminGroupActivate(req: any, opts: { id: string }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const res = await this.opsQuery<any>(`UPDATE ops.groupbuy_campaigns SET status='active', updated_at=now() WHERE id=$1 RETURNING id,status,updated_at`, [id]);
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    const data = { id: Number(r.id), status: String(r.status), updated_at: this.iso(r.updated_at) };
    await this.opsAudit(req, 'groupbuy', 'activate', 'groupbuy_campaign', data.id, reason, { id }, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminGroupDeactivate(req: any, opts: { id: string }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const res = await this.opsQuery<any>(`UPDATE ops.groupbuy_campaigns SET status='inactive', updated_at=now() WHERE id=$1 RETURNING id,status,updated_at`, [id]);
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    const data = { id: Number(r.id), status: String(r.status), updated_at: this.iso(r.updated_at) };
    await this.opsAudit(req, 'groupbuy', 'deactivate', 'groupbuy_campaign', data.id, reason, { id }, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminReferrals(opts: { current?: string; pageSize?: string; status?: string; keyword?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const status = String(opts.status || '').trim();
    const keyword = String(opts.keyword || '').trim();
    const where: string[] = [];
    const params: any[] = [];
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (keyword) {
      params.push(`%${keyword}%`);
      where.push(`name ILIKE $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRes = await this.opsQuery<{ total: string }>(`SELECT COUNT(*)::text AS total FROM ops.distribution_rules ${whereSql}`, params);
    const total = Number(countRes.rows?.[0]?.total || 0);
    const listRes = await this.opsQuery<any>(
      `SELECT id,name,level_count,commission_json,settle_cycle,status,created_at,updated_at
       FROM ops.distribution_rules ${whereSql}
       ORDER BY updated_at DESC, id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, size, (page - 1) * size],
    );
    const items = listRes.rows.map((r: any) => ({
      id: Number(r.id),
      name: r.name,
      level_count: Number(r.level_count || 0),
      commission_json: r.commission_json || {},
      settle_cycle: r.settle_cycle,
      status: r.status,
      created_at: this.iso(r.created_at),
      updated_at: this.iso(r.updated_at),
    }));
    return { code: 0, message: 'ok', data: { items, total, current: page, pageSize: size } };
  }

  async adminReferralDetail(opts: { id: string }) {
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const res = await this.opsQuery<any>(`SELECT id,name,level_count,commission_json,settle_cycle,status,created_at,updated_at FROM ops.distribution_rules WHERE id=$1`, [id]);
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    return {
      code: 0,
      message: 'ok',
      data: {
        id: Number(r.id),
        name: r.name,
        level_count: Number(r.level_count || 0),
        commission_json: r.commission_json || {},
        settle_cycle: r.settle_cycle,
        status: r.status,
        created_at: this.iso(r.created_at),
        updated_at: this.iso(r.updated_at),
      },
    };
  }

  async adminReferralCreate(req: any, body: any) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const name = String(body?.name || '').trim();
    if (!name) throw new BadRequestException('name required');
    const levelCount = Math.max(1, Math.min(10, Math.floor(Number(body?.level_count || 1))));
    const settleCycle = ['daily', 'weekly', 'monthly'].includes(String(body?.settle_cycle || 'weekly')) ? String(body.settle_cycle || 'weekly') : 'weekly';
    const commission = body?.commission_json && typeof body.commission_json === 'object' ? body.commission_json : {};
    const status = ['draft', 'active', 'inactive', 'archived'].includes(String(body?.status || 'draft')) ? String(body.status || 'draft') : 'draft';
    const res = await this.opsQuery<any>(
      `INSERT INTO ops.distribution_rules(name,level_count,commission_json,settle_cycle,status,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,now(),now())
       RETURNING id,name,level_count,commission_json,settle_cycle,status,created_at,updated_at`,
      [name, levelCount, commission, settleCycle, status],
    );
    const r = res.rows[0];
    const data = {
      id: Number(r.id),
      name: r.name,
      level_count: Number(r.level_count || 0),
      commission_json: r.commission_json || {},
      settle_cycle: r.settle_cycle,
      status: r.status,
      created_at: this.iso(r.created_at),
      updated_at: this.iso(r.updated_at),
    };
    await this.opsAudit(req, 'distribution', 'create', 'distribution_rule', data.id, reason, body, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminReferralUpdate(req: any, opts: { id: string; body: any }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const body = opts.body || {};
    const existed = await this.opsQuery<any>(`SELECT * FROM ops.distribution_rules WHERE id=$1`, [id]);
    const row = existed.rows?.[0];
    if (!row) throw new BadRequestException('not found');
    const name = typeof body.name === 'string' ? String(body.name).trim() : String(row.name);
    if (!name) throw new BadRequestException('name required');
    const levelCount = typeof body.level_count !== 'undefined' ? Math.max(1, Math.min(10, Math.floor(Number(body.level_count || 1)))) : Number(row.level_count || 1);
    const settleCycle = typeof body.settle_cycle !== 'undefined' && ['daily', 'weekly', 'monthly'].includes(String(body.settle_cycle)) ? String(body.settle_cycle) : String(row.settle_cycle);
    const commission = body?.commission_json && typeof body.commission_json === 'object' ? body.commission_json : row.commission_json || {};
    const status = typeof body.status === 'string' && ['draft', 'active', 'inactive', 'archived'].includes(String(body.status)) ? String(body.status) : String(row.status);
    const res = await this.opsQuery<any>(
      `UPDATE ops.distribution_rules
       SET name=$2,level_count=$3,commission_json=$4,settle_cycle=$5,status=$6,updated_at=now()
       WHERE id=$1
       RETURNING id,name,level_count,commission_json,settle_cycle,status,created_at,updated_at`,
      [id, name, levelCount, commission, settleCycle, status],
    );
    const r = res.rows[0];
    const data = {
      id: Number(r.id),
      name: r.name,
      level_count: Number(r.level_count || 0),
      commission_json: r.commission_json || {},
      settle_cycle: r.settle_cycle,
      status: r.status,
      created_at: this.iso(r.created_at),
      updated_at: this.iso(r.updated_at),
    };
    await this.opsAudit(req, 'distribution', 'update', 'distribution_rule', data.id, reason, body, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminReferralDelete(req: any, opts: { id: string }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const res = await this.opsQuery<any>(`UPDATE ops.distribution_rules SET status='archived', updated_at=now() WHERE id=$1 RETURNING id,status`, [id]);
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    const data = { id: Number(r.id), status: String(r.status) };
    await this.opsAudit(req, 'distribution', 'delete', 'distribution_rule', data.id, reason, { id }, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminReferralActivate(req: any, opts: { id: string }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const res = await this.opsQuery<any>(`UPDATE ops.distribution_rules SET status='active', updated_at=now() WHERE id=$1 RETURNING id,status,updated_at`, [id]);
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    const data = { id: Number(r.id), status: String(r.status), updated_at: this.iso(r.updated_at) };
    await this.opsAudit(req, 'distribution', 'activate', 'distribution_rule', data.id, reason, { id }, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminReferralDeactivate(req: any, opts: { id: string }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const res = await this.opsQuery<any>(`UPDATE ops.distribution_rules SET status='inactive', updated_at=now() WHERE id=$1 RETURNING id,status,updated_at`, [id]);
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    const data = { id: Number(r.id), status: String(r.status), updated_at: this.iso(r.updated_at) };
    await this.opsAudit(req, 'distribution', 'deactivate', 'distribution_rule', data.id, reason, { id }, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminDistributors(opts: { current?: string; pageSize?: string; status?: string; subjectType?: string; keyword?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const status = String(opts.status || '').trim();
    const subjectType = String(opts.subjectType || '').trim();
    const keyword = String(opts.keyword || '').trim();
    const where: string[] = [];
    const params: any[] = [];
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (subjectType) {
      params.push(subjectType);
      where.push(`subject_type = $${params.length}`);
    }
    if (keyword) {
      params.push(`%${keyword}%`);
      where.push(`subject_id ILIKE $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRes = await this.opsQuery<{ total: string }>(`SELECT COUNT(*)::text AS total FROM ops.distributors ${whereSql}`, params);
    const total = Number(countRes.rows?.[0]?.total || 0);
    const listRes = await this.opsQuery<any>(
      `SELECT id,subject_type,subject_id,level,status,created_at
       FROM ops.distributors ${whereSql}
       ORDER BY id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, size, (page - 1) * size],
    );
    const items = listRes.rows.map((r: any) => ({
      id: Number(r.id),
      subject_type: r.subject_type,
      subject_id: r.subject_id,
      level: Number(r.level || 1),
      status: r.status,
      created_at: this.iso(r.created_at),
    }));
    return { code: 0, message: 'ok', data: { items, total, current: page, pageSize: size } };
  }

  async adminDistributorUpsert(req: any, body: any) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const subjectType = String(body?.subject_type || '').trim();
    const subjectId = String(body?.subject_id || '').trim();
    const level = Math.max(1, Math.min(10, Math.floor(Number(body?.level || 1))));
    const status = ['active', 'disabled'].includes(String(body?.status || 'active')) ? String(body.status || 'active') : 'active';
    if (!subjectType || !subjectId) throw new BadRequestException('subject required');
    const res = await this.opsQuery<any>(
      `INSERT INTO ops.distributors(subject_type,subject_id,level,status)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (subject_type,subject_id) DO UPDATE
       SET level=EXCLUDED.level, status=EXCLUDED.status
       RETURNING id,subject_type,subject_id,level,status,created_at`,
      [subjectType, subjectId, level, status],
    );
    const r = res.rows[0];
    const data = { id: Number(r.id), subject_type: r.subject_type, subject_id: r.subject_id, level: Number(r.level || 1), status: r.status, created_at: this.iso(r.created_at) };
    await this.opsAudit(req, 'distribution', 'upsert_distributor', 'distributor', data.id, reason, body, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminRewards(opts: { current?: string; pageSize?: string; status?: string; subjectType?: string; keyword?: string; ruleId?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const status = String(opts.status || '').trim();
    const subjectType = String(opts.subjectType || '').trim();
    const keyword = String(opts.keyword || '').trim();
    const ruleId = String(opts.ruleId || '').trim();
    const where: string[] = [];
    const params: any[] = [];
    if (status) {
      params.push(status);
      where.push(`g.status = $${params.length}`);
    }
    if (subjectType) {
      params.push(subjectType);
      where.push(`g.subject_type = $${params.length}`);
    }
    if (keyword) {
      params.push(`%${keyword}%`);
      where.push(`g.subject_id ILIKE $${params.length}`);
    }
    if (ruleId) {
      const rid = Number(ruleId);
      if (Number.isFinite(rid)) {
        params.push(rid);
        where.push(`g.rule_id = $${params.length}`);
      }
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRes = await this.opsQuery<{ total: string }>(`SELECT COUNT(*)::text AS total FROM ops.reward_grants g ${whereSql}`, params);
    const total = Number(countRes.rows?.[0]?.total || 0);
    const listRes = await this.opsQuery<any>(
      `SELECT g.id,g.rule_id,g.subject_type,g.subject_id,g.amount,g.status,g.note,g.created_at,
              r.name AS rule_name
       FROM ops.reward_grants g
       LEFT JOIN ops.reward_rules r ON r.id = g.rule_id
       ${whereSql}
       ORDER BY g.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, size, (page - 1) * size],
    );
    const items = listRes.rows.map((r: any) => ({
      id: Number(r.id),
      rule_id: r.rule_id != null ? Number(r.rule_id) : null,
      rule_name: r.rule_name || null,
      subject_type: r.subject_type,
      subject_id: r.subject_id,
      amount: Number(r.amount || 0),
      status: r.status,
      note: r.note || null,
      created_at: this.iso(r.created_at),
    }));
    return { code: 0, message: 'ok', data: { items, total, current: page, pageSize: size } };
  }

  async adminRewardCreate(req: any, body: any) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const ruleId = body?.rule_id != null ? Number(body.rule_id) : null;
    const subjectType = String(body?.subject_type || '').trim();
    const subjectId = String(body?.subject_id || '').trim();
    const amount = Number(body?.amount);
    const note = String(body?.note || '').trim();
    if (!subjectType || !subjectId) throw new BadRequestException('subject required');
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('invalid amount');
    if (!note) throw new BadRequestException('note required');
    if (ruleId != null && !Number.isFinite(ruleId)) throw new BadRequestException('invalid rule_id');
    const res = await this.opsQuery<any>(
      `INSERT INTO ops.reward_grants(rule_id,subject_type,subject_id,amount,status,note,created_at)
       VALUES ($1,$2,$3,$4,'granted',$5,now())
       RETURNING id,rule_id,subject_type,subject_id,amount,status,note,created_at`,
      [ruleId, subjectType, subjectId, amount, note],
    );
    const r = res.rows[0];
    const data = {
      id: Number(r.id),
      rule_id: r.rule_id != null ? Number(r.rule_id) : null,
      subject_type: r.subject_type,
      subject_id: r.subject_id,
      amount: Number(r.amount || 0),
      status: r.status,
      note: r.note || null,
      created_at: this.iso(r.created_at),
    };
    await this.opsAudit(req, 'reward', 'grant', 'reward_grant', data.id, reason, body, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminRewardRevoke(req: any, opts: { id: string }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const res = await this.opsQuery<any>(`UPDATE ops.reward_grants SET status='revoked' WHERE id=$1 RETURNING id,status`, [id]);
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    const data = { id: Number(r.id), status: String(r.status) };
    await this.opsAudit(req, 'reward', 'revoke', 'reward_grant', data.id, reason, { id }, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminRewardRules(opts: { current?: string; pageSize?: string; status?: string; keyword?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const status = String(opts.status || '').trim();
    const keyword = String(opts.keyword || '').trim();
    const where: string[] = [];
    const params: any[] = [];
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (keyword) {
      params.push(`%${keyword}%`);
      where.push(`name ILIKE $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRes = await this.opsQuery<{ total: string }>(`SELECT COUNT(*)::text AS total FROM ops.reward_rules ${whereSql}`, params);
    const total = Number(countRes.rows?.[0]?.total || 0);
    const listRes = await this.opsQuery<any>(
      `SELECT id,name,reward_type,reward_value,trigger_json,budget_cap,status,created_at,updated_at
       FROM ops.reward_rules ${whereSql}
       ORDER BY updated_at DESC, id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, size, (page - 1) * size],
    );
    const items = listRes.rows.map((r: any) => ({
      id: Number(r.id),
      name: r.name,
      reward_type: r.reward_type,
      reward_value: Number(r.reward_value || 0),
      trigger_json: r.trigger_json || {},
      budget_cap: r.budget_cap != null ? Number(r.budget_cap) : null,
      status: r.status,
      created_at: this.iso(r.created_at),
      updated_at: this.iso(r.updated_at),
    }));
    return { code: 0, message: 'ok', data: { items, total, current: page, pageSize: size } };
  }

  async adminRewardRuleCreate(req: any, body: any) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const name = String(body?.name || '').trim();
    if (!name) throw new BadRequestException('name required');
    const rewardType = ['cash', 'coupon', 'points', 'other'].includes(String(body?.reward_type || 'cash')) ? String(body.reward_type || 'cash') : 'cash';
    const rewardValue = Number(body?.reward_value);
    if (!Number.isFinite(rewardValue) || rewardValue <= 0) throw new BadRequestException('invalid reward_value');
    const trigger = body?.trigger_json && typeof body.trigger_json === 'object' ? body.trigger_json : {};
    const budgetCap = typeof body?.budget_cap !== 'undefined' && body.budget_cap !== null ? Number(body.budget_cap) : null;
    const status = ['draft', 'active', 'inactive', 'archived'].includes(String(body?.status || 'draft')) ? String(body.status || 'draft') : 'draft';
    const res = await this.opsQuery<any>(
      `INSERT INTO ops.reward_rules(name,reward_type,reward_value,trigger_json,budget_cap,status,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,now(),now())
       RETURNING id,name,reward_type,reward_value,trigger_json,budget_cap,status,created_at,updated_at`,
      [name, rewardType, rewardValue, trigger, budgetCap, status],
    );
    const r = res.rows[0];
    const data = {
      id: Number(r.id),
      name: r.name,
      reward_type: r.reward_type,
      reward_value: Number(r.reward_value || 0),
      trigger_json: r.trigger_json || {},
      budget_cap: r.budget_cap != null ? Number(r.budget_cap) : null,
      status: r.status,
      created_at: this.iso(r.created_at),
      updated_at: this.iso(r.updated_at),
    };
    await this.opsAudit(req, 'reward', 'create_rule', 'reward_rule', data.id, reason, body, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminRewardRuleUpdate(req: any, opts: { id: string; body: any }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const body = opts.body || {};
    const existed = await this.opsQuery<any>(`SELECT * FROM ops.reward_rules WHERE id=$1`, [id]);
    const row = existed.rows?.[0];
    if (!row) throw new BadRequestException('not found');
    const name = typeof body.name === 'string' ? String(body.name).trim() : String(row.name);
    if (!name) throw new BadRequestException('name required');
    const rewardType = typeof body.reward_type !== 'undefined' && ['cash', 'coupon', 'points', 'other'].includes(String(body.reward_type)) ? String(body.reward_type) : String(row.reward_type);
    const rewardValue = typeof body.reward_value !== 'undefined' ? Number(body.reward_value) : Number(row.reward_value);
    if (!Number.isFinite(rewardValue) || rewardValue <= 0) throw new BadRequestException('invalid reward_value');
    const trigger = body?.trigger_json && typeof body.trigger_json === 'object' ? body.trigger_json : row.trigger_json || {};
    const budgetCap = typeof body?.budget_cap !== 'undefined' ? (body.budget_cap !== null ? Number(body.budget_cap) : null) : (row.budget_cap != null ? Number(row.budget_cap) : null);
    const status = typeof body.status === 'string' && ['draft', 'active', 'inactive', 'archived'].includes(String(body.status)) ? String(body.status) : String(row.status);
    const res = await this.opsQuery<any>(
      `UPDATE ops.reward_rules
       SET name=$2,reward_type=$3,reward_value=$4,trigger_json=$5,budget_cap=$6,status=$7,updated_at=now()
       WHERE id=$1
       RETURNING id,name,reward_type,reward_value,trigger_json,budget_cap,status,created_at,updated_at`,
      [id, name, rewardType, rewardValue, trigger, budgetCap, status],
    );
    const r = res.rows[0];
    const data = {
      id: Number(r.id),
      name: r.name,
      reward_type: r.reward_type,
      reward_value: Number(r.reward_value || 0),
      trigger_json: r.trigger_json || {},
      budget_cap: r.budget_cap != null ? Number(r.budget_cap) : null,
      status: r.status,
      created_at: this.iso(r.created_at),
      updated_at: this.iso(r.updated_at),
    };
    await this.opsAudit(req, 'reward', 'update_rule', 'reward_rule', data.id, reason, body, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminRewardRuleActivate(req: any, opts: { id: string; status: 'active' | 'inactive' }) {
    const reason = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const next = opts.status === 'active' ? 'active' : 'inactive';
    const res = await this.opsQuery<any>(`UPDATE ops.reward_rules SET status=$2, updated_at=now() WHERE id=$1 RETURNING id,status,updated_at`, [id, next]);
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    const data = { id: Number(r.id), status: String(r.status), updated_at: this.iso(r.updated_at) };
    await this.opsAudit(req, 'reward', next === 'active' ? 'activate_rule' : 'deactivate_rule', 'reward_rule', data.id, reason, { id }, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminRiskBlacklist(opts: { current?: string; pageSize?: string; status?: string; subjectType?: string; keyword?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const status = String(opts.status || '').trim();
    const subjectType = String(opts.subjectType || '').trim();
    const keyword = String(opts.keyword || '').trim();
    const where: string[] = [];
    const params: any[] = [];
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (subjectType) {
      params.push(subjectType);
      where.push(`subject_type = $${params.length}`);
    }
    if (keyword) {
      params.push(`%${keyword}%`);
      where.push(`subject_id ILIKE $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRes = await this.opsQuery<{ total: string }>(`SELECT COUNT(*)::text AS total FROM ops.blacklist_entries ${whereSql}`, params);
    const total = Number(countRes.rows?.[0]?.total || 0);
    const listRes = await this.opsQuery<any>(
      `SELECT id,subject_type,subject_id,reason,expires_at,status,created_at
       FROM ops.blacklist_entries ${whereSql}
       ORDER BY id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, size, (page - 1) * size],
    );
    const items = listRes.rows.map((r: any) => ({
      id: Number(r.id),
      subject_type: r.subject_type,
      subject_id: r.subject_id,
      reason: r.reason,
      expires_at: this.iso(r.expires_at),
      status: r.status,
      created_at: this.iso(r.created_at),
    }));
    return { code: 0, message: 'ok', data: { items, total, current: page, pageSize: size } };
  }

  async adminRiskBlacklistCreate(req: any, body: any) {
    const reasonHeader = String(req?.headers?.['x-reason'] || '').trim();
    const subjectType = String(body?.subject_type || '').trim();
    const subjectId = String(body?.subject_id || '').trim();
    const reason = String(body?.reason || '').trim();
    const expiresAt = body?.expires_at ? new Date(body.expires_at) : null;
    if (!subjectType || !subjectId) throw new BadRequestException('subject required');
    if (!reason) throw new BadRequestException('reason required');
    if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new BadRequestException('invalid expires_at');
    const res = await this.opsQuery<any>(
      `INSERT INTO ops.blacklist_entries(subject_type,subject_id,reason,expires_at,status,created_at)
       VALUES ($1,$2,$3,$4,'active',now())
       RETURNING id,subject_type,subject_id,reason,expires_at,status,created_at`,
      [subjectType, subjectId, reason, expiresAt ? expiresAt.toISOString() : null],
    );
    const r = res.rows[0];
    const data = {
      id: Number(r.id),
      subject_type: r.subject_type,
      subject_id: r.subject_id,
      reason: r.reason,
      expires_at: this.iso(r.expires_at),
      status: r.status,
      created_at: this.iso(r.created_at),
    };
    await this.opsAudit(req, 'blacklist', 'create', 'blacklist_entry', data.id, reasonHeader, body, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminRiskBlacklistUpdate(req: any, opts: { id: string; body: any }) {
    const reasonHeader = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const body = opts.body || {};
    const existed = await this.opsQuery<any>(`SELECT * FROM ops.blacklist_entries WHERE id=$1`, [id]);
    const row = existed.rows?.[0];
    if (!row) throw new BadRequestException('not found');
    const reason = typeof body.reason === 'string' ? String(body.reason).trim() : String(row.reason);
    if (!reason) throw new BadRequestException('reason required');
    const expiresAt = typeof body.expires_at !== 'undefined' ? (body.expires_at ? new Date(body.expires_at) : null) : (row.expires_at ? new Date(row.expires_at) : null);
    if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new BadRequestException('invalid expires_at');
    const status = typeof body.status === 'string' && ['active', 'removed', 'expired'].includes(String(body.status)) ? String(body.status) : String(row.status);
    const res = await this.opsQuery<any>(
      `UPDATE ops.blacklist_entries
       SET reason=$2, expires_at=$3, status=$4
       WHERE id=$1
       RETURNING id,subject_type,subject_id,reason,expires_at,status,created_at`,
      [id, reason, expiresAt ? expiresAt.toISOString() : null, status],
    );
    const r = res.rows[0];
    const data = {
      id: Number(r.id),
      subject_type: r.subject_type,
      subject_id: r.subject_id,
      reason: r.reason,
      expires_at: this.iso(r.expires_at),
      status: r.status,
      created_at: this.iso(r.created_at),
    };
    await this.opsAudit(req, 'blacklist', 'update', 'blacklist_entry', data.id, reasonHeader, body, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminRiskBlacklistDelete(req: any, opts: { id: string }) {
    const reasonHeader = String(req?.headers?.['x-reason'] || '').trim();
    const id = Number(opts.id);
    if (!Number.isFinite(id)) throw new BadRequestException('invalid id');
    const res = await this.opsQuery<any>(`UPDATE ops.blacklist_entries SET status='removed' WHERE id=$1 RETURNING id,status`, [id]);
    const r = res.rows?.[0];
    if (!r) throw new BadRequestException('not found');
    const data = { id: Number(r.id), status: String(r.status) };
    await this.opsAudit(req, 'blacklist', 'remove', 'blacklist_entry', data.id, reasonHeader, { id }, data, true);
    return { code: 0, message: 'ok', data };
  }

  async adminRiskBlacklistCheck(body: any) {
    const subjectType = String(body?.subject_type || '').trim();
    const subjectId = String(body?.subject_id || '').trim();
    if (!subjectType || !subjectId) throw new BadRequestException('subject required');
    const res = await this.opsQuery<any>(
      `SELECT id,reason,expires_at,status
       FROM ops.blacklist_entries
       WHERE subject_type=$1 AND subject_id=$2 AND status='active'
       ORDER BY id DESC LIMIT 1`,
      [subjectType, subjectId],
    );
    const hit = res.rows?.[0] || null;
    const now = new Date();
    const expired = hit?.expires_at ? new Date(hit.expires_at) < now : false;
    const matched = Boolean(hit) && !expired;
    return {
      code: 0,
      message: 'ok',
      data: {
        matched,
        entry: hit
          ? { id: Number(hit.id), reason: hit.reason, expires_at: this.iso(hit.expires_at), status: hit.status, expired }
          : null,
      },
    };
  }

  async adminAudit(opts: { current?: string; pageSize?: string; module?: string; action?: string; success?: string; keyword?: string }) {
    const page = Math.max(1, Number(opts.current || 1));
    const size = Math.min(200, Math.max(1, Number(opts.pageSize || 20)));
    const module = String(opts.module || '').trim();
    const action = String(opts.action || '').trim();
    const success = String(opts.success || '').trim();
    const keyword = String(opts.keyword || '').trim();
    const where: string[] = [];
    const params: any[] = [];
    if (module) {
      params.push(module);
      where.push(`module = $${params.length}`);
    }
    if (action) {
      params.push(action);
      where.push(`action = $${params.length}`);
    }
    if (success) {
      const s = success === 'true' ? true : success === 'false' ? false : null;
      if (s != null) {
        params.push(s);
        where.push(`success = $${params.length}`);
      }
    }
    if (keyword) {
      params.push(`%${keyword}%`);
      where.push(`(actor ILIKE $${params.length} OR target_id ILIKE $${params.length} OR reason ILIKE $${params.length})`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRes = await this.opsQuery<{ total: string }>(`SELECT COUNT(*)::text AS total FROM ops.admin_audit_logs ${whereSql}`, params);
    const total = Number(countRes.rows?.[0]?.total || 0);
    const listRes = await this.opsQuery<any>(
      `SELECT id,actor,module,action,target_type,target_id,reason,success,created_at
       FROM ops.admin_audit_logs ${whereSql}
       ORDER BY id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, size, (page - 1) * size],
    );
    const items = listRes.rows.map((r: any) => ({
      id: Number(r.id),
      actor: r.actor,
      module: r.module,
      action: r.action,
      target_type: r.target_type || null,
      target_id: r.target_id || null,
      reason: r.reason || null,
      success: Boolean(r.success),
      created_at: this.iso(r.created_at),
    }));
    return { code: 0, message: 'ok', data: { items, total, current: page, pageSize: size } };
  }
}
