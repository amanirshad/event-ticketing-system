# Fix "No token provided" Error

## Problem:
Error says "Access denied. No token provided" = Authorization header is missing

## ✅ Solution: Add Authorization Header

### Method 1: Use Authorization Tab (Easiest)

1. **Click "Authorization" tab** in your request
2. **Type:** Select `Bearer Token` from dropdown
3. **Token:** Paste your token here (or use `{{token}}` if variable works)
4. **Click "Send"**

### Method 2: Add to Headers Tab

1. **Click "Headers" tab**
2. **Add new header:**
   - Key: `Authorization`
   - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (paste full token)
3. **Make sure checkbox is checked** ✅
4. **Click "Send"**

---

## Quick Fix Steps:

### Step 1: Get Token
Run "Get Token" request and copy the token

### Step 2: Add Authorization Header
**Option A - Authorization Tab:**
- Click **"Authorization"** tab
- Select **"Bearer Token"**
- Paste token in Token field

**Option B - Headers Tab:**
- Click **"Headers"** tab
- Add: `Authorization` = `Bearer <paste_token>`
- Make sure it's checked ✅

### Step 3: Send Request
Click "Send" - should work now!

---

## Correct Header Format:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3RfdXNlciIsImVtYWlsIjoidGVzdF91c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzYyNTk3Mzg3LCJleHAiOjE3NjI2ODM3ODd9.2iFlVNhWQ7TEZhFWuJi4yaJs5wq39DuCRPzVZjvpv0s
```

**Important:** 
- Must start with `Bearer ` (with space)
- Then paste full token
- Header name must be exactly `Authorization`

---

## For "Get Payment by ID" Request:

1. **Authorization Tab:**
   - Type: `Bearer Token`
   - Token: `<paste_token>` or `{{token}}`

2. **OR Headers Tab:**
   - Add: `Authorization` = `Bearer <paste_token>`

3. **URL:** `http://localhost:8080/api/payments/pay_1762597627719_ede0f686`

4. **Send** - Should work!

---

## Test Token First:

Before using in request, test if token works:

```bash
curl -X GET http://localhost:8080/api/payments/pay_1762597627719_ede0f686 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

If this works, then Postman should work too once header is added correctly.

