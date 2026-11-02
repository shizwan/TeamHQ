import assert from 'node:assert/strict';
import { resolveAuthSecret } from '../src/lib/env';

const secureSecret = 'A_strong_randomly_generated_example_value_123456';

assert.throws(
  () => resolveAuthSecret(undefined, 'production'),
  /AUTH_SECRET/,
  'Production must not accept a missing signing key',
);
assert.throws(
  () => resolveAuthSecret('short', 'production'),
  /AUTH_SECRET/,
  'Production must not accept a weak signing key',
);
assert.throws(
  () => resolveAuthSecret('teamhq_production_secret_fallback_key_32_chars!', 'production'),
  /AUTH_SECRET/,
  'Previously published fallback keys must not be accepted in production',
);
assert.equal(
  resolveAuthSecret(secureSecret, 'production'),
  secureSecret,
  'Production must accept a properly configured signing key',
);
assert.throws(
  () => resolveAuthSecret('short', 'development'),
  /AUTH_SECRET/,
  'Development must not accept an explicitly weak signing key',
);
assert.ok(
  resolveAuthSecret(undefined, 'development').length >= 16,
  'The local-only developer fallback is available only outside production',
);

console.log('TeamHQ auth secret configuration regression checks passed.');
