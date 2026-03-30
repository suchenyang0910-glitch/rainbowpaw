const clawBot = require('../../bots/clawBot');
const adminOnly = require('../../middlewares/adminOnly');
const reportService = require('../../services/reportService');

function registerAdminReportRoute() {
  if (!clawBot) return;

  const guard = adminOnly(clawBot);

  clawBot.onText(
    /\/report\b/,
    guard(async (msg) => {
      const chatId = msg.chat.id;

      try {
        const daily = await reportService.getDaily();
        clawBot.sendMessage(chatId, `📊 今日报表\n\n${JSON.stringify(daily, null, 2)}`);
      } catch (e) {
        clawBot.sendMessage(chatId, '报表服务不可用或未配置。');
      }
    }),
  );

  clawBot.onText(
    /\/profit\b/,
    guard(async (msg) => {
      const chatId = msg.chat.id;

      try {
        const profit = await reportService.getProfit();
        clawBot.sendMessage(chatId, `💹 利润概览\n\n${JSON.stringify(profit, null, 2)}`);
      } catch (e) {
        clawBot.sendMessage(chatId, '利润报表不可用或未配置。');
      }
    }),
  );
}

module.exports = registerAdminReportRoute;
