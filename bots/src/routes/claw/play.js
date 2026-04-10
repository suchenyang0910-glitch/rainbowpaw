const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const apiGatewayService = require('../../services/apiGatewayService');

function registerClawPlayRoute() {
  if (!clawBot) return;

  // Handle Play via Callback Query (from the new Main Menu)
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
          
          const opts = {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 Play Again', callback_data: 'action_play_claw' }],
                [{ text: '♻️ Recycle to Points', callback_data: `action_recycle:${playId}` }],
                [{ text: '🐾 Get Care Advice', callback_data: 'action_care_plan' }]
              ]
            }
          };

          await clawBot.sendMessage(
            chatId,
            `🎁 **You got: ${reward.name}**\n\nWhat would you like to do next?`,
            { parse_mode: 'Markdown', ...opts }
          );
        } else {
          await clawBot.sendMessage(chatId, `Failed to play: ${playResult.message}`);
        }
      } catch (error) {
        console.error('Play error:', error?.response?.data || error.message);
        await clawBot.sendMessage(chatId, 'Insufficient points or system busy.');
      }
      await clawBot.answerCallbackQuery(query.id);
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
          
          // Remove the recycle button from the original message to prevent multi-clicks
          if (query.message && query.message.reply_markup && query.message.reply_markup.inline_keyboard) {
            const newKeyboard = query.message.reply_markup.inline_keyboard.filter(
              row => !row.some(btn => btn.callback_data === data)
            );
            await clawBot.editMessageReplyMarkup(
              { inline_keyboard: newKeyboard },
              { chat_id: chatId, message_id: query.message.message_id }
            ).catch(e => console.error('Failed to edit message markup', e.message));
          }
        } else {
          await clawBot.sendMessage(chatId, `Recycle failed: ${res.message}`);
        }
      } catch (error) {
        await clawBot.sendMessage(chatId, 'Failed to recycle.');
      }
      await clawBot.answerCallbackQuery(query.id);
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
          plan.forEach(p => { text += `✔ ${p}\n`; });
          text += `\n👉 **Suggested Plan:**\n${recommendedPack.name} ($${recommendedPack.price})\n`;
          
          const opts = {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📦 Subscribe Care Pack', callback_data: `action_subscribe:${recommendedPack.id}` }],
                [{ text: '💬 Talk to Us', callback_data: 'action_bridge_support' }]
              ]
            }
          };

          await clawBot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...opts });
        }
    if (data === 'action_bridge_services' || data === 'action_bridge_support') {
      try {
        const linked = await identityService.linkUser({
          source_bot: 'claw_bot',
          source_user_id: String(query.from.id),
        });

        const bridgeData = await apiGatewayService.createBridgeLink(linked.global_user_id);
        if (bridgeData.code === 0 && bridgeData.data) {
          const link = bridgeData.data.link;
          const opts = {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Go to Services', url: link }]
              ]
            }
          };
          await clawBot.sendMessage(chatId, `🌈 We're here if you ever need support.\n\nClick below to access our dedicated services.`, opts);
        }
      } catch (error) {
        await clawBot.sendMessage(chatId, 'Failed to generate service link.');
      }
      await clawBot.answerCallbackQuery(query.id);
    }
  });
}

module.exports = registerClawPlayRoute;
