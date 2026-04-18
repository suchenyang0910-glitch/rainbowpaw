import { WalletService } from './wallet.service';

describe('WalletService wallet_usdt minor units', () => {
  const svc = new WalletService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  it('parses 6-decimal USDT precisely', () => {
    const toMinorUnits = (svc as any).toMinorUnits.bind(svc) as (
      v: any,
      scale: number,
    ) => bigint;
    expect(toMinorUnits('1', 6)).toBe(1_000_000n);
    expect(toMinorUnits('1.2', 6)).toBe(1_200_000n);
    expect(toMinorUnits('1.234567', 6)).toBe(1_234_567n);
    expect(toMinorUnits('0.000001', 6)).toBe(1n);
  });

  it('formats 6-decimal USDT precisely', () => {
    const minorUnitsToStr = (svc as any).minorUnitsToStr.bind(svc) as (
      v: bigint,
      scale: number,
    ) => string;
    expect(minorUnitsToStr(1_000_000n, 6)).toBe('1.000000');
    expect(minorUnitsToStr(1_234_567n, 6)).toBe('1.234567');
    expect(minorUnitsToStr(1n, 6)).toBe('0.000001');
  });
});

