import { BadRequestException } from '@nestjs/common';
import { AppService } from './app.service';

describe('Settlecore payment_settled', () => {
  it('plays: should mint points and create paid claw order', async () => {
    const svc = new AppService();
    (svc as any).settlecoreDbReady = () => false;

    const walletEarnAsset = jest.fn().mockResolvedValue(null);
    const orderCreate = jest.fn().mockResolvedValue({ order_id: 'ord_x' });
    (svc as any).walletEarnAsset = walletEarnAsset;
    (svc as any).orderCreate = orderCreate;

    const body = {
      event: 'payment_settled',
      status: 'settled',
      partner_order_id: 'rpplays_3_gid_abc',
      payment_order_id: 123,
      amount: 4,
      currency: 'USDT',
    };

    await (svc as any).handleSettlecorePaymentSettled({
      body,
      idempotencyKey: 'pay:123:settled',
    });

    expect(walletEarnAsset).toHaveBeenCalledTimes(1);
    const earnArg = walletEarnAsset.mock.calls[0][0];
    expect(earnArg.globalUserId).toBe('gid');
    expect(earnArg.amount).toBe(9);

    expect(orderCreate).toHaveBeenCalledTimes(1);
    const [orderBody, idem] = orderCreate.mock.calls[0];
    expect(idem).toBe('pay:123:settled');
    expect(orderBody.type).toBe('claw');
    expect(orderBody.status).toBe('paid');
    expect(orderBody.flow).toBe('income');
    expect(orderBody.amount).toBe(4);
    expect(orderBody.currency).toBe('usd');
  });

  it('miniapp: should create paid product order and not mint points', async () => {
    const svc = new AppService();
    (svc as any).settlecoreDbReady = () => false;

    const walletEarnAsset = jest.fn().mockResolvedValue(null);
    const orderCreate = jest.fn().mockResolvedValue({ order_id: 'ord_x' });
    (svc as any).walletEarnAsset = walletEarnAsset;
    (svc as any).orderCreate = orderCreate;

    const body = {
      event: 'payment_settled',
      status: 'settled',
      partner_order_id: 'rpmini_usdt_gid_abc',
      payment_order_id: 456,
      amount: 12.5,
      currency: 'USDT',
    };

    await (svc as any).handleSettlecorePaymentSettled({
      body,
      idempotencyKey: 'pay:456:settled',
    });

    expect(walletEarnAsset).toHaveBeenCalledTimes(0);
    expect(orderCreate).toHaveBeenCalledTimes(1);
    const [orderBody] = orderCreate.mock.calls[0];
    expect(orderBody.type).toBe('product');
    expect(orderBody.status).toBe('paid');
    expect(orderBody.user_id).toBe('gid');
    expect(orderBody.amount).toBe(12.5);
  });

  it('plays: should reject mismatched amount', async () => {
    const svc = new AppService();
    (svc as any).settlecoreDbReady = () => false;

    const body = {
      event: 'payment_settled',
      status: 'settled',
      partner_order_id: 'rpplays_3_gid_abc',
      payment_order_id: 789,
      amount: 999,
      currency: 'USDT',
    };

    await expect(
      (svc as any).handleSettlecorePaymentSettled({
        body,
        idempotencyKey: 'pay:789:settled',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

