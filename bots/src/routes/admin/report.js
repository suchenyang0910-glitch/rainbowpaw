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
        const text = `💹 利润与转换概览\n\n` + 
          `总营收: $${profit.revenue || 0}\n` +
          `毛利: $${profit.profit || 0}\n` +
          `抽奖次数: ${profit.clawPlays || 0}\n` +
          `商城订单: ${profit.shopOrders || 0}\n` +
          `订阅用户: ${profit.activeSubscriptions || 0}\n\n` +
          `数据更新时间: ${new Date().toLocaleString()}`;
        clawBot.sendMessage(chatId, text);
      } catch (e) {
        clawBot.sendMessage(chatId, '利润报表不可用或未配置。');
      }
    }),
  );

  clawBot.onText(
    /\/claw\b/,
    guard(async (msg) => {
      const chatId = msg.chat.id;

      try {
        // Here we could call a specific claw report endpoint if it existed,
        // for now we'll just format the daily/profit data differently or mock.
        const daily = await reportService.getDaily();
        const text = `🎮 抽奖系统(Claw) 运营数据\n\n` +
          `今日参与人数: ${daily.clawUsers || 0}\n` +
          `今日消耗积分: ${daily.pointsConsumed || 0}\n` +
          `回收积分占比: ${(daily.recycleRate || 0) * 100}%\n` +
          `引导护理(Care)转化率: ${(daily.careConversion || 0) * 100}%`;
        clawBot.sendMessage(chatId, text);
      } catch (e) {
        clawBot.sendMessage(chatId, 'Claw 报表服务不可用。');
      }
    }),
  );
}

module.exports = registerAdminReportRoute;
