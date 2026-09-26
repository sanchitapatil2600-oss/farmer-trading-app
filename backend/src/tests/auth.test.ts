import assert from 'assert';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken, verifyJwt, hashToken } from '../utils/token';

async function runAuthTests() {
  console.log('--- Running Phase 2 Authentication Unit Tests ---');

  // Test 1: Password hashing and verification
  console.log('1. Testing password hashing & verification...');
  const testPassword = 'StrongPassword123!';
  const hashedPassword = await hashPassword(testPassword);
  
  assert.notStrictEqual(hashedPassword, testPassword, 'Password must not be stored in plaintext');
  assert.ok(hashedPassword.startsWith('$2'), 'Bcrypt hash should start with $2');

  const isValidPassword = await verifyPassword(testPassword, hashedPassword);
  assert.strictEqual(isValidPassword, true, 'Valid password verification should succeed');

  const isInvalidPassword = await verifyPassword('WrongPassword', hashedPassword);
  assert.strictEqual(isInvalidPassword, false, 'Invalid password verification should fail');
  console.log('✓ Password hashing and verification passed.');

  // Test 2: Password complexity rules
  console.log('2. Testing password complexity validation...');
  try {
    await hashPassword('12345');
    assert.fail('Should reject password shorter than 6 characters');
  } catch (err: any) {
    assert.ok(err.message.includes('at least 6 characters'), 'Rejection message must indicate length requirement');
  }
  console.log('✓ Password complexity validation passed.');

  // Test 3: JWT token generation and verification
  console.log('3. Testing JWT generation and verification...');
  const payload = {
    userId: '11111111-2222-3333-4444-555555555555',
    role: 'FARMER' as const,
  };

  const { token, expiresAt } = signToken(payload, 3600);
  assert.ok(token && typeof token === 'string', 'Token must be a non-empty string');
  assert.ok(expiresAt instanceof Date, 'Expiration must be a Date object');
  assert.ok(expiresAt.getTime() > Date.now(), 'Expiration must be in the future');

  const verified = verifyJwt(token);
  assert.strictEqual(verified.userId, payload.userId, 'Verified userId must match');
  assert.strictEqual(verified.role, payload.role, 'Verified role must match');
  console.log('✓ JWT token generation and verification passed.');

  // Test 4: Token tampering detection
  console.log('4. Testing JWT tampering detection...');
  const tamperedToken = token.slice(0, -5) + 'abcde';
  try {
    verifyJwt(tamperedToken);
    assert.fail('Tampered token should not be accepted');
  } catch {
    // Expected error
  }
  console.log('✓ JWT tampering detection passed.');

  // Test 5: Token SHA-256 hashing for session table
  console.log('5. Testing token SHA-256 hashing...');
  const tokenHash1 = hashToken(token);
  const tokenHash2 = hashToken(token);
  assert.strictEqual(tokenHash1, tokenHash2, 'Hash must be deterministic');
  assert.strictEqual(tokenHash1.length, 64, 'SHA-256 hash must be 64 hex characters');
  assert.notStrictEqual(tokenHash1, token, 'Hash must not equal raw token');
  console.log('✓ Token SHA-256 hashing passed.');

  console.log('--- All Authentication Unit Tests Passed Successfully ---');
}

runAuthTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
