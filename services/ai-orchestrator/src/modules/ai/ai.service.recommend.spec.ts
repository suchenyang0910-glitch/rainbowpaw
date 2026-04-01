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
});

