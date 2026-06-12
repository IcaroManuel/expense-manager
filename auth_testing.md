# Auth Testing Playbook (Emergent Google Auth)

## Allowlist
Apenas o e-mail `icaroomanuel@gmail.com` é permitido (configurado via env `ALLOWED_EMAILS` no backend).
Qualquer outro e-mail recebe HTTP 403 ao trocar o `session_id`.

## Step 1: Create Test User & Session (for E2E testing)
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'icaroomanuel@gmail.com',
  name: 'Icaro Manuel',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -X GET "$API_URL/api/auth/me" -H "Authorization: Bearer YOUR_SESSION_TOKEN"
curl -X GET "$API_URL/api/billings?year=2026&month=2" -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Step 3: Browser Testing (Playwright)
```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "expense-manager-1038.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://expense-manager-1038.preview.emergentagent.com/dashboard")
```

## Clean test data
```bash
mongosh --eval "
use('test_database');
db.users.deleteMany({email: /test\\.user\\./});
db.user_sessions.deleteMany({session_token: /test_session/});
"
```

## Checklist
- [x] User document has `user_id` (custom UUID); `_id` excluded with projection
- [x] Session `user_id` matches user's `user_id` exactly
- [x] All queries scope by `user_id`
- [x] Email allowlist enforced on session creation
- [x] Cookie httpOnly, secure, samesite=None, path=/
