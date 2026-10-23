const http = require('http');

const request = (path, method = 'GET', data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const u = new URL('http://localhost:5050' + path);
    const req = http.request(u, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

const runAuthFlowTests = async () => {
  console.log('🧪 RUNNING COMPREHENSIVE SIGNUP & LOGIN AUTHENTICATION TEST SUITE...\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, title, details = '') => {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [TEST ${total}] ${title}`);
    } else {
      console.error(`❌ [TEST ${total}] ${title} ${details ? '(' + details + ')' : ''}`);
    }
  };

  try {
    const ts = Date.now();
    const testUsername = `user_${ts}`;
    const testEmail = `NewUser_${ts}@Example.COM `;
    const testPassword = 'StrongPassword123';

    // ─── Case 1: A new user can sign up with a valid email and password ───
    const regRes = await request('/api/auth/register', 'POST', {
      username: testUsername,
      email: testEmail,
      password: testPassword
    });

    assert(
      regRes.status === 201 && regRes.data?.success && regRes.data?.token && regRes.data?.user?.email === testEmail.trim().toLowerCase(),
      'Case 1: New user can sign up with valid email & password, normalized and saved',
      JSON.stringify(regRes.data)
    );

    const tokenFromSignup = regRes.data?.token;

    // ─── Case 2: Newly registered user can immediately sign in using same credentials ───
    const loginRes = await request('/api/auth/login', 'POST', {
      email: testEmail.trim().toLowerCase(),
      password: testPassword
    });

    assert(
      loginRes.status === 200 && loginRes.data?.success && loginRes.data?.token && loginRes.data?.user?.username === testUsername,
      'Case 2: Newly registered user can immediately sign in using identical credentials',
      JSON.stringify(loginRes.data)
    );

    // ─── Case 3: Wrong password is rejected with proper auth error ───
    const wrongPwdRes = await request('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'WrongPassword999'
    });

    assert(
      wrongPwdRes.status === 401 && !wrongPwdRes.data?.success && wrongPwdRes.data?.message?.includes('Invalid'),
      'Case 3: Wrong password is strictly rejected with HTTP 401 error',
      JSON.stringify(wrongPwdRes.data)
    );

    // ─── Case 4: An unregistered email receives a proper authentication error ───
    const unregRes = await request('/api/auth/login', 'POST', {
      email: 'nonexistent_ghost_account_999@imovies.com',
      password: 'somepassword123'
    });

    assert(
      unregRes.status === 401 && !unregRes.data?.success,
      'Case 4: Unregistered email receives proper authentication error (HTTP 401)',
      JSON.stringify(unregRes.data)
    );

    // ─── Case 5: Email addresses with uppercase letters or surrounding spaces are handled consistently ───
    // 5a. Sign in with messy formatting (spaces + mixed case)
    const messyLoginRes = await request('/api/auth/login', 'POST', {
      email: `   ${testEmail.toUpperCase()}  `,
      password: testPassword
    });

    assert(
      messyLoginRes.status === 200 && messyLoginRes.data?.success && messyLoginRes.data?.user?.email === testEmail.trim().toLowerCase(),
      'Case 5: Login with uppercase and surrounding spaces normalizes and succeeds',
      JSON.stringify(messyLoginRes.data)
    );

    // 5b. Sign in with username instead of email
    const usernameLoginRes = await request('/api/auth/login', 'POST', {
      email: testUsername,
      password: testPassword
    });

    assert(
      usernameLoginRes.status === 200 && usernameLoginRes.data?.success && usernameLoginRes.data?.user?.username === testUsername,
      'Case 5b: Login using username instead of email succeeds seamlessly',
      JSON.stringify(usernameLoginRes.data)
    );

    // ─── Case 6: Repeated signup attempts do not create duplicate accounts ───
    const dupEmailRes = await request('/api/auth/register', 'POST', {
      username: `u2_${ts % 1000000}`,
      email: `   ${testEmail.toLowerCase()}  `,
      password: 'password123'
    });

    assert(
      dupEmailRes.status === 409 && !dupEmailRes.data?.success,
      'Case 6a: Duplicate signup with same normalized email is blocked (HTTP 409)',
      JSON.stringify(dupEmailRes.data)
    );

    const dupUserRes = await request('/api/auth/register', 'POST', {
      username: testUsername,
      email: `unique_${ts}@example.com`,
      password: 'password123'
    });

    assert(
      dupUserRes.status === 409 && !dupUserRes.data?.success,
      'Case 6b: Duplicate signup with same username is blocked (HTTP 409)',
      JSON.stringify(dupUserRes.data)
    );

    // ─── Case 7: Session validation (/api/auth/validate) with persistent token works ───
    const validateRes = await request('/api/auth/validate', 'GET', null, {
      'Authorization': `Bearer ${loginRes.data.token}`,
      'auth-token': loginRes.data.token
    });

    assert(
      validateRes.status === 200 && validateRes.data?.success && validateRes.data?.user?.email === testEmail.trim().toLowerCase(),
      'Case 7: Persistent session validation (/api/auth/validate) returns authenticated user',
      JSON.stringify(validateRes.data)
    );

    // ─── Case 8: Existing seeded users can still sign in ───
    const existingUserLogin = await request('/api/auth/login', 'POST', {
      email: 'user@imovies.com',
      password: 'user123'
    });

    assert(
      existingUserLogin.status === 200 && existingUserLogin.data?.success && existingUserLogin.data?.user?.username === 'JohnDoe',
      'Case 8: Existing pre-seeded user (user@imovies.com) signs in without issues',
      JSON.stringify(existingUserLogin.data)
    );

    // ─── Case 9: Existing admin user can still sign in via admin portal ───
    const existingAdminLogin = await request('/api/auth/admin/login', 'POST', {
      email: 'admin@imovies.com',
      password: 'admin123'
    });

    assert(
      existingAdminLogin.status === 200 && existingAdminLogin.data?.success && existingAdminLogin.data?.admin?.isAdmin === true,
      'Case 9: Existing admin user (admin@imovies.com) signs in to admin portal',
      JSON.stringify(existingAdminLogin.data)
    );

    // ─── Case 10: Validation fails gracefully with invalid/expired token ───
    const fakeTokenValidate = await request('/api/auth/validate', 'GET', null, {
      'Authorization': 'Bearer invalid.token.value',
      'auth-token': 'invalid.token.value'
    });

    assert(
      fakeTokenValidate.status === 401 && !fakeTokenValidate.data?.success,
      'Case 10: Invalid or expired token is rejected with HTTP 401',
      JSON.stringify(fakeTokenValidate.data)
    );

    console.log(`\n🎉 RESULTS: ${passed}/${total} AUTHENTICATION VERIFICATION TESTS PASSED!`);
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
};

runAuthFlowTests();
