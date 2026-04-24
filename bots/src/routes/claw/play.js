const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const apiGatewayService = require('../../services/apiGatewayService');

function registerClawPlayRoute() {
  if (!clawBot) return;

  clawBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === 'action_play_claw') {
      try {
        const linked = await identityService.linkUser({
          source_bot: 'claw_bot',
          source_user_id: String(query.from.id),
          telegram_id: query.from.id,
          username: query.from.username || '',
          first_source: 'telegram',
        });

        const playResult = await apiGatewayService.clawPlay(linked.global_user_id);
        if (playResult.code === 0 && playResult.data) {
          const reward = playResult.data.reward;
          const playId = reward.play_id;

          await clawBot.sendMessage(
            chatId,
            `🎁 **You got: ${reward.name}**\n\nWhat would you like to do next?`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🎮 Play Again', callback_data: 'action_play_claw' }],
                  [{ text: '♻️ Recycle to Points', callback_data: `action_recycle:${playId}` }],
                  [{ text: '🐾 Get Care Advice', callback_data: 'action_care_plan' }],
                ],
              },
            },
          );
        } else {
          await clawBot.sendMessage(chatId, `Failed to play: ${playResult.message}`);
        }
      } catch (error) {
        console.error('Play error:', error?.response?.data || error.message);
        await clawBot.sendMessage(chatId, 'Insufficient points or system busy.');
      }
      await clawBot.answerCallbackQuery(query.id);
      return;
    }

    if (data.startsWith('action_recycle:')) {
      const playId = data.split(':')[1];
      try {
        const linked = await identityService.linkUser({
          source_bot: 'claw_bot',
          source_user_id: String(query.from.id),
        });

        const res = await apiGatewayService.clawRecycle(linked.global_user_id, playId);
        if (res.code === 0) {
          await clawBot.sendMessage(chatId, `♻️ Recycled successfully! Earned ${res.data.recyclePoints} points.`);

          if (query.message && query.message.reply_markup && query.message.reply_markup.inline_keyboard) {
            const newKeyboard = query.message.reply_markup.inline_keyboard.filter((row) =>
              !row.some((btn) => btn.callback_data === data),
            );
            await clawBot
              .editMessageReplyMarkup({ inline_keyboard: newKeyboard }, { chat_id: chatId, message_id: query.message.message_id })
              .catch((e) => console.error('Failed to edit message markup', e.message));
          }
        } else {
          await clawBot.sendMessage(chatId, `Recycle failed: ${res.message}`);
        }
      } catch {
        await clawBot.sendMessage(chatId, 'Failed to recycle.');
      }
      await clawBot.answerCallbackQuery(query.id);
      return;
    }

    if (data === 'action_care_plan') {
      try {
        await clawBot.sendMessage(chatId, '🐾 Generating your personalized care plan...');
        const linked = await identityService.linkUser({
          source_bot: 'claw_bot',
          source_user_id: String(query.from.id),
        });

        const planData = await apiGatewayService.getCarePlan(linked.global_user_id);
        if (planData.code === 0 && planData.data) {
          const { plan, recommendedPack, rationale } = planData.data;
          let text = `🐾 **Personalized Care Plan**\n\nWe'll help your pet live more comfortably 💛\n\n`;
          if (rationale) text += `*Why:* ${rationale}\n\n`;
          text += `*Recommendations:*\n`;
          plan.forEach((p) => {
            text += `✔ ${p}\n`;
          });
          text += `\n👉 **Suggested Plan:**\n${recommendedPack.name} ($${recommendedPack.price})\n`;

          await clawBot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📦 Subscribe Care Pack', callback_data: `action_subscribe:${recommendedPack.id}` }],
                [{ text: '💬 Talk to Us', callback_data: 'action_bridge_support' }],
              ],
            },
          });
        }
      } catch (error) {
        console.error('Care plan error:', error?.response?.data || error.message);
        await clawBot.sendMessage(chatId, 'Failed to generate care plan. Please try again later.');
      }
      await clawBot.answerCallbackQuery(query.id);
      return;
    }

    if (data.startsWith('action_subscribe:')) {
      const packId = data.split(':')[1] || '';
      try {
        const linked = await identityService.linkUser({
          source_bot: 'claw_bot',
          source_user_id: String(query.from.id),
        });

        const category = String(packId).includes('senior') ? 'senior_care' : '';
        const path = category ? `/rainbowpaw/marketplace?category=${encodeURIComponent(category)}` : '/rainbowpaw/marketplace';

        const bridgeData = await apiGatewayService.createBridgeLink(linked.global_user_id, {
          scene: 'store',
          extra_data: { path, pack_id: packId },
        });

        const link = bridgeData?.data?.link || bridgeData?.data?.deep_link;
        if (bridgeData.code === 0 && link) {
          await clawBot.sendMessage(chatId, '📦 已为你打开购买入口。点击按钮进入商城完成下单：', {
            reply_markup: {
              inline_keyboard: [[{ text: '打开 RainbowPaw 商城', url: link }]],
            },
          });
        } else {
          await clawBot.sendMessage(chatId, '暂时无法生成购买入口，请稍后再试。');
        }
      } catch (error) {
        console.error('Subscribe error:', error?.response?.data || error.message);
        await clawBot.sendMessage(chatId, '暂时无法打开购买入口，请稍后再试。');
      }
      await clawBot.answerCallbackQuery(query.id);
      return;
    }

    if (data === 'action_bridge_services' || data === 'action_bridge_support') {
      try {
        const linked = await identityService.linkUser({
          source_bot: 'claw_bot',
          source_user_id: String(query.from.id),
        });

        const bridgeData = await apiGatewayService.createBridgeLink(linked.global_user_id, {
          scene: 'aftercare',
        });

        const link = bridgeData?.data?.link || bridgeData?.data?.deep_link;
        if (bridgeData.code === 0 && link) {
          await clawBot.sendMessage(chatId, '🌈 我们随时在这里。\n\n点击按钮进入 RainbowPaw 获取咨询与善终服务：', {
            reply_markup: {
              inline_keyboard: [[{ text: '进入服务与咨询', url: link }]],
            },
          });
        } else {
          await clawBot.sendMessage(chatId, 'Failed to generate service link.');
        }
      } catch (error) {
        console.error('Bridge error:', error?.response?.data || error.message);
        await clawBot.sendMessage(chatId, 'Failed to generate service link.');
      }
      await clawBot.answerCallbackQuery(query.id);
      return;
    }
  });
}

module.exports = registerClawPlayRoute;
