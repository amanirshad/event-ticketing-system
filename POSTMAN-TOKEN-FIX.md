# Fix Postman Token Variable Issue

## Problem:
`{{token}}` is showing in red = Postman can't find the variable

## ✅ Solution Steps:

### Step 1: Get Fresh Token
1. Run **"Get Token"** request:
   ```
   GET http://localhost:8080/auth/dev-token?userId=test_user
   ```
2. In the response, you'll see:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "userId": "test_user"
   }
   ```
3. **Copy the entire token** (the long string starting with `eyJ...`)

### Step 2: Set Token Variable (Method 1 - Collection Variables)
1. Click on your **Collection name** (left sidebar)
2. Click **"Variables"** tab
3. Find `token` variable (or create it if doesn't exist)
4. Paste your token in the **"Current Value"** column
5. Click **"Save"**

### Step 3: Set Token Variable (Method 2 - Environment Variables)
1. Click **"Environments"** (left sidebar) or create new environment
2. Click **"Add"** to create new variable
3. Name: `token`
4. Value: `<paste_your_token_here>`
5. Click **"Save"**
6. **Select this environment** from dropdown (top right)

### Step 4: Use Token in Request
In "Create Payment" request:
- Make sure you're using the correct environment (if using Method 2)
- Header should be: `Bearer {{token}}`
- The `{{token}}` should NOT be red anymore

---

## Alternative: Use Token Directly (No Variables)

If variables aren't working, paste token directly:

1. Get token from "Get Token" request
2. Copy the token value
3. In "Create Payment" request header:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (paste full token)
   ```

---

## Quick Test:

### Test 1: Check if token works
```bash
# Get token
curl "http://localhost:8080/auth/dev-token?userId=test_user"

# Use token directly (replace YOUR_TOKEN)
curl -X GET http://localhost:8080/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 2: Verify token format
Token should look like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3RfdXNlciIsImVtYWlsIjoidGVzdF91c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzMxMjM0NTY3LCJleHAiOjE3MzEzMjA5Njd9.signature
```

---

## Common Issues:

### Issue 1: Variable Not Set
- **Fix:** Set token in Collection Variables or Environment Variables

### Issue 2: Wrong Environment Selected
- **Fix:** Select the correct environment from dropdown (top right)

### Issue 3: Token Expired
- **Fix:** Get a fresh token (tokens expire after 24 hours)

### Issue 4: Variable Name Mismatch
- **Fix:** Make sure variable name is exactly `token` (lowercase)

---

## Recommended: Use Direct Token (Easier)

Instead of variables, just paste token directly:

1. **Get Token:**
   ```
   GET http://localhost:8080/auth/dev-token?userId=test_user
   ```

2. **Copy token** from response

3. **In Create Payment header:**
   ```
   Authorization: Bearer <paste_full_token_here>
   ```

This avoids variable issues!

---

## Step-by-Step Fix:

1. ✅ Run "Get Token" request
2. ✅ Copy the `token` value (the long string)
3. ✅ Go to Collection → Variables
4. ✅ Set `token` = `<paste_token>`
5. ✅ Save
6. ✅ Make sure `{{token}}` is not red anymore
7. ✅ Run "Create Payment" request

If still not working, use the token directly in the header instead of `{{token}}`.

