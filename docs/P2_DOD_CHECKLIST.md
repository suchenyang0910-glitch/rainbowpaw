# P2 上线回归清单（增强层）

> 核心原则：P2 永远不能打断 P0 现金流主线。

## 1) P0 不回归（必须 5/5 通过）
- 按 [P0_DOD_CHECKLIST.md](file:///d:/projects/rainbowpaw_new/docs/P0_DOD_CHECKLIST.md) 全部跑一遍

## 2) Claw（流量外挂）健康度
- 连续抽奖 10 次无重复扣费
- recycle 可用且返回字段稳定（`recyclePoints`）
- 护理建议可返回，且“购买”跳转可用

## 3) 钱包高级玩法不影响支付
- locked/cashable 资产不出现负数
- 幂等键重复请求不会重复记账

## 4) 功能开关/回滚
- P2 功能必须可通过环境变量/配置关闭
- 关闭后 P0 仍可跑通

