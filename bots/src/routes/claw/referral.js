const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const apiGatewayService = require('../../services/apiGatewayService');

function registerReferralRoute() {
  if (!clawBot) return;

  // View Referral Info
  clawBot.onText(/👥 分销中心/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const linked = await identityService.linkUser({
        source_bot: 'claw_bot',
        source_user_id: String(msg.from.id),
        telegram_id: msg.from.id,
        username: msg.from.username || '',
      });

      let referralCode = `ref_${linked.global_user_id.substring(0, 8)}`;
      let referralLink = `https://t.me/rainbowpay_claw_Bot?start=${referralCode}`;
      try {
        const ensured = await apiGatewayService.ensureReferralCode(linked.global_user_id);
        if (ensured && ensured.code === 0 && ensured.data) {
          referralCode = ensured.data.referral_code || referralCode;
          referralLink = ensured.data.link || referralLink;
        }
      } catch {
        void 0;
      }

      clawBot.sendMessage(
        chatId,
        `👥 **你的分销中心**\n\n` +
        `你的专属邀请码: \`${referralCode}\`\n` +
        `专属邀请链接:\n${referralLink}\n\n` +
        `**奖励规则：**\n` +
        `- 一级好友消费：返 4% (2% 可提现 + 2% 积分)\n` +
        `- 二级好友消费：返 2% (1% 可提现 + 1% 积分)`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      clawBot.sendMessage(chatId, '系统繁忙，请稍后再试。');
    }
  });
}

module.exports = registerReferralRoute;
