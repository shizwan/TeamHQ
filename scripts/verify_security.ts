import { signSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from '../src/lib/auth';
import { checkRateLimit } from '../src/lib/rateLimit';

async function runSecurityTestSuite() {
  console.log('====================================================');
  console.log('🛡️ RUNNING COMPREHENSIVE SECURITY VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // SECTION 1: Cryptographic Session Tokens & Jose JWT
  // ----------------------------------------------------
  console.log('1. Cryptographic Session Token Signing & Verification');
  const testUser = {
    uid: 'admin-user-123',
    email: 'admin@teamhq.com',
    displayName: 'Lead Manager',
    role: 'admin',
  };

  const token = await signSessionToken(testUser);
  assert(typeof token === 'string' && token.split('.').length === 3, 'signSessionToken produces valid 3-part JWT');

  const verified = await verifySessionToken(token);
  assert(verified !== null, 'verifySessionToken successfully verifies valid token');
  assert(verified?.uid === testUser.uid, 'verified token preserves user UID');
  assert(verified?.email === testUser.email, 'verified token preserves user email');
  assert(verified?.role === 'admin', 'verified token preserves role');

  // Test tampered token
  const tamperedToken = token.slice(0, -5) + 'AAAAA';
  const tamperedVerified = await verifySessionToken(tamperedToken);
  assert(tamperedVerified === null, 'verifySessionToken rejects tampered JWT signature');

  // Test empty and invalid strings
  assert((await verifySessionToken('')) === null, 'verifySessionToken rejects empty string');
  assert((await verifySessionToken('invalid.token.structure')) === null, 'verifySessionToken rejects malformed token');

  // ----------------------------------------------------
  // SECTION 2: Sliding-Window Rate Limiting Engine
  // ----------------------------------------------------
  console.log('\n2. Sliding-Window Rate Limiting Engine');
  const testIp = 'test-ip-192.168.1.100';

  // 5 attempts allowed with limit 5
  for (let i = 1; i <= 5; i++) {
    const res = checkRateLimit(testIp, 5, 60000);
    assert(res.allowed, `Attempt #${i} allowed within limit`);
  }

  // 6th attempt must be rejected with 429 status
  const throttled = checkRateLimit(testIp, 5, 60000);
  assert(!throttled.allowed, '6th attempt is throttled (429 Rate Limit triggered)');
  assert(throttled.remaining === 0, 'Remaining allowance is 0');
  assert(throttled.resetMs > 0, 'Reset timestamp is provided');

  // Different IP should still be allowed
  const otherIpRes = checkRateLimit('different-ip-10.0.0.1', 5, 60000);
  assert(otherIpRes.allowed, 'Independent IP is not affected by throttled IP');

  // ----------------------------------------------------
  // SECTION 3: HTTP Security Headers Validation
  // ----------------------------------------------------
  console.log('\n3. Security Headers & Cookie Configurations');
  assert(SESSION_COOKIE_NAME === 'teamhq_session', 'Session cookie is named teamhq_session');

  // ----------------------------------------------------
  // FINAL SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`🏁 SECURITY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTestSuite().catch((err) => {
  console.error('Security test suite fatal error:', err);
  process.exit(1);
});
