# Fix Red {{token}} in Postman

## Problem:
Token variable is set but `{{token}}` is still red = Postman can't find it

## ✅ Solutions:

### Solution 1: Select the Right Environment/Collection

1. **Check Top Right Corner:**
   - Look for environment dropdown (top right)
   - Make sure the environment/collection with your token is **SELECTED**
   - If you see "No Environment" - select your collection or create environment

2. **If Using Collection Variables:**
   - Make sure you're in the **same collection** where token is set
   - The request should be **inside** that collection

### Solution 2: Use Environment Instead of Collection Variables

1. **Create Environment:**
   - Click **"Environments"** (left sidebar)
   - Click **"+"** to create new
   - Name: `Payment Service Local`

2. **Add Token Variable:**
   - Click **"Add"**
   - Variable: `token`
   - Current Value: `<paste_your_token>`
   - Click **"Save"**

3. **Select Environment:**
   - Top right dropdown
   - Select **"Payment Service Local"**
   - Now `{{token}}` should work!

### Solution 3: Check Variable Scope

Make sure token is in the right place:
- **Collection Variables:** Only works for requests in that collection
- **Environment Variables:** Works for all requests when environment is selected
- **Global Variables:** Works everywhere

### Solution 4: Refresh Postman

1. **Close and reopen** the request
2. Or **click outside** the header field and click back
3. Sometimes Postman needs a refresh to recognize variables

### Solution 5: Use Direct Token (Easiest!)

If variables keep causing issues:

1. **Get Token:**
   ```
   GET http://localhost:8080/auth/dev-token?userId=test_user
   ```

2. **Copy token** from response

3. **In Create Payment header:**
   - Remove `{{token}}`
   - Paste token directly: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Quick Fix Steps:

1. ✅ **Check top right** - Is environment/collection selected?
2. ✅ **If not selected** - Select the one with your token
3. ✅ **If still red** - Create environment and set token there
4. ✅ **Select environment** from dropdown
5. ✅ **Test** - `{{token}}` should not be red anymore

---

## Alternative: Bypass Variables Completely

**Just paste token directly:**

1. Get token from "Get Token" request
2. Copy full token
3. In Authorization header, replace `{{token}}` with actual token:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3RfdXNlciIsImVtYWlsIjoidGVzdF91c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzYyNTk3Mzg3LCJleHAiOjE3NjI2ODM3ODd9.2iFlVNhWQ7TEZhFWuJi4yaJs5wq39DuCRPzVZjvpv0s
   ```

This works immediately without variable issues!

---

## Most Common Issue:

**Environment not selected!**

- Top right corner dropdown
- Select the environment/collection where token is set
- `{{token}}` will turn from red to normal

