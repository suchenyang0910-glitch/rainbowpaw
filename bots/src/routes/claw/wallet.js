const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const walletService = require('../../services/walletService');

function registerClawWalletRoute() {
  if (!clawBot) return;

  clawBot.onText(/💰 钱包/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const linked = await identityService.linkUser({
        source_bot: 'claw_bot',
        source_user_id: String(msg.from.id),
        telegram_id: msg.from.id,
        username: msg.from.username || '',
        first_source: 'telegram',
      });

      const wallet = await walletService.getWallet(linked.global_user_id);

      clawBot.sendMessage(
        chatId,
        `💰 统一钱包\n\n` +
          `总积分：${wallet.points_total}\n` +
          `Locked：${wallet.points_locked}\n` +
          `Cashable：${wallet.points_cashable}\n` +
          `提现余额(USD)：${wallet.wallet_cash}`,
      );
    } catch (e) {
      clawBot.sendMessage(chatId, '获取钱包失败，请稍后再试。');
    }
  });
}

module.exports = registerClawWalletRoute;
