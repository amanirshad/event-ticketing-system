# Fix Update Payment Status API

## Common Issues:

### Issue 1: Missing Full URL
**Problem:** URL shows `/api/payments/...` (relative)
**Fix:** Use full URL: `http://localhost:8080/api/payments/pay_1762597627719_ede0f686/status`

### Issue 2: Missing Authorization Header
**Problem:** No Authorization header = 401 error
**Fix:** Add Authorization header:
- Go to **"Headers"** tab or **"Authorization"** tab
- Add: `Authorization: Bearer <your_token>`

### Issue 3: Wrong Status Value
**Problem:** Status must be one of: PENDING, SUCCESS, FAILED, REFUNDED, CANCELLED
**Fix:** Make sure status is exactly one of these (case-sensitive)

---

## ✅ Correct Setup:

### Method: PATCH
### URL: `http://localhost:8080/api/payments/pay_1762597627719_ede0f686/status`

### Headers:
```
Authorization: Bearer <your_token>
Content-Type: application/json
```

### Body (JSON):
```json
{
  "status": "CANCELLED",
  "reason": "Order cancelled by user"
}
```

---

## Quick Fix Steps:

1. **Check URL:**
   - Should be: `http://localhost:8080/api/payments/pay_1762597627719_ede0f686/status`
   - NOT: `/api/payments/...` (relative URL)

2. **Add Authorization:**
   - Click **"Authorization"** tab
   - Select **"Bearer Token"**
   - Paste your token

3. **Check Body:**
   - Make sure it's **raw JSON**
   - Status should be: `"CANCELLED"` (uppercase)

4. **Send Request**

---

## Test with cURL:

```bash
curl -X PATCH http://localhost:8080/api/payments/pay_1762597627719_ede0f686/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"CANCELLED","reason":"Order cancelled by user"}'
```

If this works, then Postman should work too once headers are correct.

