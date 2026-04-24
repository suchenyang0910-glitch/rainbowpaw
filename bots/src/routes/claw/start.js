const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const apiGatewayService = require('../../services/apiGatewayService');
const config = require('../../config');

const pendingReferralByTelegramId = new Map();

function webUrl(pathname) {
  const base = String(config.publicWebBaseUrl || '').trim().replace(/\/+$/, '');
  if (!base) return '';
  const p = String(pathname || '').trim();
  if (!p) return base;
  return `${base}${p.startsWith('/') ? '' : '/'}${p}`;
}

function webAppButton(text, url) {
  return {
    text: String(text || '').trim() || '打开',
    web_app: { url: String(url || '').trim() },
  };
}

function registerClawStartRoute() {
  if (!clawBot) return;

  // Handle the callback queries for pet profiling
  clawBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    if (data.startsWith('pet_type:')) {
      const type = data.split(':')[1];
      // Save type to session/state (in real app, use redis or memory cache before final submit)
      // For now, we move directly to age question
      
      const opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '<1 year', callback_data: `pet_age:<1:${type}` }, { text: '1-3 years', callback_data: `pet_age:1-3:${type}` }],
            [{ text: '4-7 years', callback_data: `pet_age:4-7:${type}` }, { text: '7+ years', callback_data: `pet_age:7+:${type}` }]
          ]
        }
      };
      
      await clawBot.editMessageText('How old is your pet?', {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...opts
      });
      await clawBot.answerCallbackQuery(query.id);
    }
    
    if (data.startsWith('pet_age:')) {
      const parts = data.split(':');
      const age = parts[1];
      const type = parts[2];

      const opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '<2 kg', callback_data: `pet_weight:<2:${age}:${type}` }, { text: '2-5 kg', callback_data: `pet_weight:2-5:${age}:${type}` }],
            [{ text: '5-15 kg', callback_data: `pet_weight:5-15:${age}:${type}` }, { text: '15+ kg', callback_data: `pet_weight:15+:${age}:${type}` }],
          ],
        },
      };

      await clawBot.editMessageText('About how much does your pet weigh?', {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...opts,
      });
      await clawBot.answerCallbackQuery(query.id);
    }

    if (data.startsWith('pet_weight:')) {
      const parts = data.split(':');
      const weightRange = parts[1];
      const age = parts[2];
      const type = parts[3];

      const opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Joint / Mobility', callback_data: `pet_issue:joint:${weightRange}:${age}:${type}` }, { text: 'Kidney', callback_data: `pet_issue:kidney:${weightRange}:${age}:${type}` }],
            [{ text: 'Digestive', callback_data: `pet_issue:digestive:${weightRange}:${age}:${type}` }, { text: 'Skin', callback_data: `pet_issue:skin:${weightRange}:${age}:${type}` }],
            [{ text: 'No issues', callback_data: `pet_issue:none:${weightRange}:${age}:${type}` }],
          ],
        },
      };

      await clawBot.editMessageText('Any main health concern right now?', {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...opts,
      });
      await clawBot.answerCallbackQuery(query.id);
    }

    if (data.startsWith('pet_issue:')) {
      const parts = data.split(':');
      const issue = parts[1];
      const weightRange = parts[2];
      const age = parts[3];
      const type = parts[4];

      const weightMap = {
        '<2': 1.5,
        '2-5': 3.5,
        '5-15': 10,
        '15+': 20,
      };
      const petWeightKg = weightMap[weightRange] || null;
      const healthIssues = issue && issue !== 'none' ? [issue] : [];

      try {
        const linked = await identityService.linkUser({
          source_bot: 'claw_bot',
          source_user_id: String(query.from.id),
          telegram_id: query.from.id,
          username: query.from.username || '',
          first_source: 'telegram',
        });

        await identityService.updatePetProfile(linked.global_user_id, {
          petType: type,
          petAgeStage: age,
          ...(petWeightKg ? { petWeightKg } : {}),
          ...(healthIssues.length ? { healthIssues } : {}),
        });

        await apiGatewayService
          .reportEvent(linked.global_user_id, 'lead_submit', {
            country: 'KH',
            city: 'Phnom Penh',
            language: query.from.language_code || 'en',
            session_id: String(chatId),
            telegram_id: Number(query.from.id),
            chat_id: Number(chatId),
            utm: { source: 'telegram', campaign: 'claw_onboarding', content: String(issue || 'none') },
            ref: { bot: 'claw_bot', telegram_id: Number(query.from.id) },
          })
          .catch(() => null);

        const pending = pendingReferralByTelegramId.get(Number(query.from.id));
        if (pending && String(pending).startsWith('ref_')) {
          await apiGatewayService.consumeReferral(linked.global_user_id, String(pending), 'profiled').catch(() => null);
          pendingReferralByTelegramId.delete(Number(query.from.id));
        }
      } catch (error) {
        console.error('Failed to update pet profile:', error);
      }

      const webBase = webUrl('');
      const opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Play Claw', callback_data: 'action_play_claw' }],
            [webAppButton('🐾 Care Plan', `${webBase}/care`)],
            [webAppButton('🛍 Shop', `${webBase}/rainbowpaw/marketplace`)],
            [{ text: '🌈 Services', callback_data: 'action_bridge_services' }],
          ],
        },
      };

      await clawBot.editMessageText('🎮 You can try your luck or explore care options\n\n👇 Choose what to do:', {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...opts,
      });
      await clawBot.answerCallbackQuery(query.id);
    }
  });

  clawBot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const token = match && match[1] ? String(match[1] || '').trim() : '';

    try {
      // First register user if they don't exist, but don't show the main menu yet
      const linked = await identityService.linkUser({
        source_bot: 'claw_bot',
        source_user_id: String(msg.from.id),
        telegram_id: msg.from.id,
        username: msg.from.username || '',
        first_source: 'telegram',
      });

      if (token && token.startsWith('ref_')) {
        pendingReferralByTelegramId.set(Number(msg.from.id), token);
        apiGatewayService.ensureReferralCode(linked.global_user_id).catch(() => null);
      }

      // Step 1: Welcome and Pet Type
      const opts = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🐱 Cat', callback_data: 'pet_type:cat' },
              { text: '🐶 Dog', callback_data: 'pet_type:dog' }
            ]
          ]
        }
      };

      await clawBot.sendMessage(
        chatId,
        `🐾 Welcome to RainbowPaw\n\nBefore we start, tell us about your pet 💛`,
        opts
      );
      
    } catch (error) {
      clawBot.sendMessage(chatId, '系统繁忙，请稍后再试。');
    }
  });
}

module.exports = registerClawStartRoute;
