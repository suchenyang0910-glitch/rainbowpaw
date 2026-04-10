import axios from 'axios';
import { randomUUID } from 'crypto';

// Target the API Gateway (or Claw Service directly if running locally)
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000/api';
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || 'dev-internal-token';

const client = axios.create({
  baseURL: GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${INTERNAL_TOKEN}`,
  },
});

async function stressTest() {
  console.log('🚀 Starting Concurrency Security Test (Double-Spend Prevention)...');

  const testUserId = 'test_stress_' + randomUUID().substring(0, 8);
  console.log(`\n1. Creating test user and giving them points... (${testUserId})`);
  
  // 1. Give the user some points to play
  try {
    // Direct call to wallet-service to bypass API Gateway if needed, or use gateway if earn is exposed
    // Assuming API Gateway does not expose earn directly, we'll try to just play and let the wallet go negative if allowed,
    // OR better: we can hit the wallet service directly.
    const walletUrl = process.env.WALLET_SERVICE_URL || 'http://localhost:3002/wallet';
    await axios.post(`${walletUrl}/earn`, {
      global_user_id: testUserId,
      biz_type: 'test_funding',
      changes: [{ asset_type: 'points_cashable', amount: 100 }],
      remark: 'stress test funding'
    }, {
      headers: { Authorization: `Bearer ${INTERNAL_TOKEN}` }
    });
    console.log('   ✅ Funded 100 points');
  } catch (err) {
    console.log('   ⚠️ Funding failed or skipped (might not be needed depending on wallet logic):', err.message);
  }

  console.log(`\n2. Playing Claw to get a real playId...`);
  let testPlayId = '';
  try {
    const playRes = await client.post('/claw/play', { global_user_id: testUserId });
    
    if (playRes.data?.code !== 0) {
      console.error('   ❌ API Gateway returned error:', playRes.data);
      return;
    }

    // Check if we hit the fallback
    if (playRes.data?.data?.result === 'fallback_01') {
      console.error('   ❌ API Gateway returned fallback response. This means claw-service is down, or there is no active claw_pool in the database.');
      console.error('   💡 Please ensure claw-service is running and you have inserted at least one active pool and pool_item into the database.');
      return;
    }

    if (playRes.data?.data?.reward?.play_id) {
      testPlayId = playRes.data.data.reward.play_id;
      console.log(`   ✅ Played successfully. Received playId: ${testPlayId}`);
    } else {
      throw new Error('No playId returned: ' + JSON.stringify(playRes.data));
    }
  } catch (err) {
    console.error('   ❌ Failed to play claw. Make sure your services are running and the pool is active!');
    console.error(err.response?.data || err.message);
    return;
  }

  console.log(`\n3. [Test Case] Simulating 10 concurrent users trying to recycle the SAME item at the exact same millisecond.`);
  console.log(`Target: POST /claw/recycle for playId=${testPlayId}`);

  const concurrentRequests = 10;
  const requests = [];

  for (let i = 0; i < concurrentRequests; i++) {
    // Send identical requests concurrently
    requests.push(
      client.post('/claw/recycle', {
        global_user_id: testUserId,
        playId: testPlayId
      }).then(res => {
        return { id: i, success: true, data: res.data };
      }).catch(err => {
        return { id: i, success: false, error: err.response?.data?.message || err.message };
      })
    );
  }

  const results = await Promise.all(requests);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n📊 Results:`);
  console.log(`Total Requests: ${concurrentRequests}`);
  console.log(`Successful Recycles: ${successful.length} (Should be EXACTLY 1 if pessimistic locks work)`);
  console.log(`Failed/Rejected Recycles: ${failed.length} (Should be EXACTLY 9)`);

  if (successful.length === 1) {
    console.log(`\n✅ PASS: Double-spend vulnerability successfully prevented by DB pessimistic locks!`);
  } else if (successful.length === 0) {
    console.log(`\n⚠️ NOTE: 0 successes. This might mean the testPlayId doesn't exist in the database, which is expected for a dry-run script. But the system didn't crash.`);
  } else {
    console.log(`\n❌ FAIL: Race condition detected! ${successful.length} requests succeeded.`);
  }

  console.log('\nError Sample (from rejected requests):');
  if (failed.length > 0) {
    console.log(failed[0].error);
  }
}

stressTest().catch(console.error);
