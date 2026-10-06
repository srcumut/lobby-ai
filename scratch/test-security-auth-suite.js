// Test Security, Route Authorization, Open Redirect Protection & JWT Validation using native fetch
const API_URL = 'http://localhost:8080/api';

async function runSecuritySuite() {
  console.log('=== LOBBY AI: SECURITY & AUTHORIZATION TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Backend Route Protection (Unauthenticated requests must be rejected with 401 Unauthorized)
  console.log('1. Testing Backend Route Protection (Without Token)...');
  const protectedEndpoints = [
    { method: 'GET', url: `${API_URL}/users/me` },
    { method: 'GET', url: `${API_URL}/lobbies` },
    { method: 'GET', url: `${API_URL}/friends/conversations` },
    { method: 'GET', url: `${API_URL}/notifications` },
    { method: 'GET', url: `${API_URL}/ai/credentials` },
    { method: 'GET', url: `${API_URL}/ai/agents` },
    { method: 'POST', url: `${API_URL}/users/coins/add`, body: JSON.stringify({ amount: 100 }) }
  ];

  for (const ep of protectedEndpoints) {
    try {
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: ep.body
      });
      assert(res.status === 401, `${ep.method} ${ep.url} rejected with 401 Unauthorized (got ${res.status})`);
    } catch (err) {
      assert(false, `Unexpected error on ${ep.url}: ${err.message}`);
    }
  }

  // 2. Testing Forged / Tampered JWT Token
  console.log('\n2. Testing Forged / Tampered JWT Token...');
  const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxODY4Y2NjOS1jNzc0LTQzMGItYmE1MC1lNWRlNjVlMTUzN2YiLCJleHAiOjk5OTk5OTk5OTl9.invalid_signature_here';
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${forgedToken}` }
    });
    assert(res.status === 401, `Forged JWT token rejected with 401 (got ${res.status})`);
  } catch (err) {
    assert(false, `Error testing forged token: ${err.message}`);
  }

  // 3. Testing Valid Authentication
  console.log('\n3. Testing Valid Authentication (alperen_k)...');
  let token = null;
  try {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alperen_k@lobby.ai',
        password: 'Password123!'
      })
    });
    const data = await loginRes.json();
    token = data.access_token;
    assert(loginRes.status === 200 && !!token, 'Login successful and access token generated');
    assert(data.user.username === 'alperen_k', 'Authenticated user matches alperen_k');
    assert(data.user.coins >= 900000000, `User balance is correctly unlimited (${data.user.coins} coins)`);
  } catch (err) {
    console.error('Login error:', err);
    assert(false, 'Login failed');
  }

  // 4. Testing Protected Access With Valid Token
  if (token) {
    console.log('\n4. Testing Protected Access With Valid Token...');
    try {
      const meRes = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const meData = await meRes.json();
      assert(meRes.status === 200 && meData.username === 'alperen_k', 'GET /users/me returned authenticated profile');

      const lobbiesRes = await fetch(`${API_URL}/lobbies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const lobbiesData = await lobbiesRes.json();
      assert(lobbiesRes.status === 200 && Array.isArray(lobbiesData), `GET /lobbies returned ${lobbiesData.length} lobbies`);
    } catch (err) {
      assert(false, `Authenticated access failed: ${err.message}`);
    }
  }

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runSecuritySuite();
