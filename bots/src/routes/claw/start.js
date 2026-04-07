const clawBot = require('../../bots/clawBot');
const identityService = require('../../services/identityService');
const config = require('../../config');

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
      
      // Update identity service with the profile
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
          petAgeStage: age
        });
      } catch (error) {
        console.error('Failed to update pet profile:', error);
      }

      // Show Main Menu
      const webBase = webUrl('');
      const opts = {
        reply_markup: {
          inline_keyboard: [
            [webAppButton('🎮 Play Claw', `${webBase}/rainbowpawclaw`)],
            [webAppButton('🐾 Care Plan', `${webBase}/care`)], // Adjust URL to your actual care plan route
            [webAppButton('🛍 Shop', `${webBase}/rainbowpaw/marketplace`)],
            [webAppButton('🌈 Services', `${webBase}/services`)] // Adjust URL to your actual services route
          ]
        }
      };
      
      await clawBot.editMessageText('🎮 You can try your luck or explore care options\n\n👇 Choose what to do:', {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...opts
      });
      await clawBot.answerCallbackQuery(query.id);
    }
  });

  clawBot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const token = match && match[1] ? String(match[1] || '').trim() : '';

    try {
      // First register user if they don't exist, but don't show the main menu yet
      await identityService.linkUser({
        source_bot: 'claw_bot',
        source_user_id: String(msg.from.id),
        telegram_id: msg.from.id,
        username: msg.from.username || '',
        first_source: 'telegram',
      });

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
