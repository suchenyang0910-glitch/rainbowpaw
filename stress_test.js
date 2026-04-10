const axios = require('axios');
const { randomUUID } = require('crypto');

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

  // We assume a valid test user ID and a mocked playId for this test script.
  // In a real environment, you would create a user, play once, get playId, then stress test recycle.
  const testUserId = 'test_user_' + randomUUID().substring(0, 8);
  const testPlayId = 'play_' + randomUUID().substring(0, 8); // Example Play ID

  console.log(`\n[Test Case] Simulating 10 concurrent users trying to recycle the SAME item at the exact same millisecond.`);
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
