# Fix Postman 401 Error

## Problems Found:

1. **Idempotency-Key is wrong:** You have `test_user` but it needs to be a UUID
2. **Token might be invalid:** Need to get a fresh token

## ✅ Fix Steps:

### Step 1: Get Fresh Token
1. Run **"Get Token"** request first
2. Copy the `token` value from response
3. Go to Collection Variables (click collection name → Variables tab)
4. Set `token` variable = `<paste_token_here>`

### Step 2: Fix Idempotency-Key
In "Create Payment" request:
- **Current (WRONG):** `Idempotency-Key: test_user`
- **Should be:** `Idempotency-Key: {{$guid}}` (Postman auto-generates UUID)

### Step 3: Update Headers
Make sure headers are:
```
Content-Type: application/json
Authorization: Bearer {{token}}
Idempotency-Key: {{$guid}}
```

---

## Quick Fix:

### Option 1: Use Postman Variables
1. **Get Token** request should auto-save token (if script is set up)
2. **Idempotency-Key** should be `{{$guid}}` (not `test_user`)

### Option 2: Manual Fix
1. **Get Token:**
   - Run GET request: `http://localhost:8080/auth/dev-token?userId=test_user`
   - Copy the token from response
   
2. **Set Token Variable:**
   - Click collection name → Variables
   - Set `token` = `<paste_token>`
   
3. **Fix Create Payment Request:**
   - Headers tab
   - Change `Idempotency-Key` from `test_user` to `{{$guid}}`
   - Make sure `Authorization` is `Bearer {{token}}`

---

## Correct Headers for Create Payment:

```
Content-Type: application/json
Authorization: Bearer {{token}}
Idempotency-Key: {{$guid}}
```

**NOT:**
```
Idempotency-Key: test_user  ❌
```

---

## Test Again:

1. Run "Get Token" request
2. Copy token to collection variable
3. Run "Create Payment" with correct headers
4. Should work now!

