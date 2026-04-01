import { AiService } from './ai.service';

describe('AiService recommendNext', () => {
  it('falls back when retrieval throws', async () => {
    const service = new (AiService as any)({
      insert: async () => {},
      sumTodayCostUsd: async () => 0,
    });

    (service as any).canUseEmbedding = () => true;
    (service as any).canUseRerank = () => true;
    (service as any).rankCandidates = async () => {
      throw new Error('boom');
    };
    (service as any).runRole = async () => ({ ok: true, next_action: 'claw' });

    const out = await service.recommendNext(
      {
        user_profile: { tags: ['shop'] },
        recent_actions: ['play_completed'],
        last_result: { plays: [{ tier: 'common' }] },
        candidate_products: [{ id: 101, title: 'Ceramic Urn' }],
        candidate_entries: ['claw', 'shop'],
      },
      { headers: { 'x-global-user-id': 'u_test' } },
    );

    expect(out).toMatchObject({ ok: true, retrieval_used: false });
    expect(typeof out.retrieval_error).toBe('string');
  });

  it('does not send empty assistant message in JSON repair', async () => {
    const service = new (AiService as any)({
      insert: async () => {},
      sumTodayCostUsd: async () => 0,
    });

    (service as any).callOpenAiCompatible = async ({ messages }: any) => {
      const hasEmptyAssistant = Array.isArray(messages)
        ? messages.some(
            (m: any) => m?.role === 'assistant' && String(m?.content ?? '') === '',
          )
        : false;
      if (hasEmptyAssistant) throw new Error('sent empty assistant');
      return { choices: [{ message: { content: '{"ok":true}' } }], usage: {} };
    };

    const out = await (service as any).parseJsonWithRetry({
      baseUrl: 'x',
      chatPath: '/v1/chat/completions',
      apiKey: 'k',
      model: 'm',
      messages: [
        { role: 'system', content: 's' },
        { role: 'user', content: 'u' },
      ],
      assistantText: '',
      maxTokens: 32,
      timeoutMs: 1000,
    });

    expect(out).toEqual({ ok: true });
  });
});
