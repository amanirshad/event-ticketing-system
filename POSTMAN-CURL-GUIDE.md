# Postman and cURL Guide for Payment Service API

## Prerequisites:
- Port-forward must be running: `kubectl port-forward svc/payment-service-nodeport 8080:3004 -n ticketing-system`
- Service URL: `http://localhost:8080`

---

## Option 1: Using Postman (Visual - Recommended for Demo)

### Setup Postman Collection:

#### 1. Health Check
- **Method:** GET
- **URL:** `http://localhost:8080/health`
- **Headers:** None needed
- **Body:** None

#### 2. Get Authentication Token
- **Method:** GET
- **URL:** `http://localhost:8080/auth/dev-token?userId=test_user`
- **Headers:** None needed
- **Body:** None
- **Save Response:** Copy the `token` value for next requests

#### 3. Create Payment
- **Method:** POST
- **URL:** `http://localhost:8080/api/payments/charge`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer <paste_token_here>
  Idempotency-Key: <generate_uuid>
  ```
- **Body (raw JSON):**
  ```json
  {
    "orderId": "order_123",
    "amount": 5000,
    "currency": "USD",
    "paymentMethod": "stripe",
    "paymentMethodId": "pm_test_123",
    "description": "Demo payment"
  }
  ```

#### 4. Get Payment by ID
- **Method:** GET
- **URL:** `http://localhost:8080/api/payments/<paymentId>`
- **Headers:**
  ```
  Authorization: Bearer <paste_token_here>
  ```

#### 5. Get Payments by Order
- **Method:** GET
- **URL:** `http://localhost:8080/api/payments/order/order_123`
- **Headers:**
  ```
  Authorization: Bearer <paste_token_here>
  ```

#### 6. Get Payment Statistics
- **Method:** GET
- **URL:** `http://localhost:8080/api/payments/stats/overview`
- **Headers:**
  ```
  Authorization: Bearer <paste_token_here>
  ```

---

## Option 2: Using cURL Commands

### 1. Health Check
```bash
curl -X GET http://localhost:8080/health
```

### 2. Get Authentication Token
```bash
curl -X GET "http://localhost:8080/auth/dev-token?userId=test_user"
```
**Save the token from response!**

### 3. Create Payment
```bash
curl -X POST http://localhost:8080/api/payments/charge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "orderId": "order_123",
    "amount": 5000,
    "currency": "USD",
    "paymentMethod": "stripe",
    "paymentMethodId": "pm_test_123",
    "description": "Demo payment"
  }'
```

**Windows PowerShell version:**
```powershell
$token = "YOUR_TOKEN_HERE"
$idempotencyKey = (New-Guid).ToString()
curl.exe -X POST http://localhost:8080/api/payments/charge `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -H "Idempotency-Key: $idempotencyKey" `
  -d '{\"orderId\":\"order_123\",\"amount\":5000,\"currency\":\"USD\",\"paymentMethod\":\"stripe\",\"paymentMethodId\":\"pm_test_123\",\"description\":\"Demo payment\"}'
```

### 4. Get Payment by ID
```bash
curl -X GET http://localhost:8080/api/payments/pay_XXXXX \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Get Payments by Order
```bash
curl -X GET http://localhost:8080/api/payments/order/order_123 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Get Payment Statistics
```bash
curl -X GET http://localhost:8080/api/payments/stats/overview \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Postman Collection JSON (Import This!)

Save this as `payment-service.postman_collection.json` and import into Postman:

```json
{
  "info": {
    "name": "Payment Service API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:8080/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["health"]
        }
      }
    },
    {
      "name": "Get Token",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:8080/auth/dev-token?userId=test_user",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["auth", "dev-token"],
          "query": [
            {"key": "userId", "value": "test_user"}
          ]
        }
      }
    },
    {
      "name": "Create Payment",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "Authorization", "value": "Bearer {{token}}"},
          {"key": "Idempotency-Key", "value": "{{$guid}}"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"orderId\": \"order_123\",\n  \"amount\": 5000,\n  \"currency\": \"USD\",\n  \"paymentMethod\": \"stripe\",\n  \"paymentMethodId\": \"pm_test_123\",\n  \"description\": \"Demo payment\"\n}"
        },
        "url": {
          "raw": "http://localhost:8080/api/payments/charge",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "payments", "charge"]
        }
      }
    },
    {
      "name": "Get Payment by ID",
      "request": {
        "method": "GET",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"}
        ],
        "url": {
          "raw": "http://localhost:8080/api/payments/{{paymentId}}",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "payments", "{{paymentId}}"]
        }
      }
    },
    {
      "name": "Get Payments by Order",
      "request": {
        "method": "GET",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"}
        ],
        "url": {
          "raw": "http://localhost:8080/api/payments/order/order_123",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "payments", "order", "order_123"]
        }
      }
    },
    {
      "name": "Get Statistics",
      "request": {
        "method": "GET",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"}
        ],
        "url": {
          "raw": "http://localhost:8080/api/payments/stats/overview",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "payments", "stats", "overview"]
        }
      }
    }
  ],
  "variable": [
    {"key": "token", "value": ""},
    {"key": "paymentId", "value": ""}
  ]
}
```

---

## Quick Start with Postman:

1. **Download Postman:** https://www.postman.com/downloads/
2. **Import Collection:** File → Import → Paste JSON above
3. **Get Token:**
   - Run "Get Token" request
   - Copy the `token` value from response
   - Set collection variable: `token` = `<paste_token>`
4. **Run Requests:** All other requests will use the token automatically!

---

## Quick Start with cURL:

### Step-by-Step:
```bash
# 1. Health check
curl http://localhost:8080/health

# 2. Get token (save it!)
TOKEN=$(curl -s "http://localhost:8080/auth/dev-token?userId=test_user" | jq -r '.token')

# 3. Create payment
curl -X POST http://localhost:8080/api/payments/charge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"orderId":"order_123","amount":5000,"currency":"USD","paymentMethod":"stripe","paymentMethodId":"pm_test_123","description":"Demo"}'
```

---

## For Recording/Demo:

**Postman is better for demo because:**
- ✅ Visual interface
- ✅ Easy to see requests/responses
- ✅ Can show headers clearly
- ✅ Better for screenshots

**cURL is better for:**
- ✅ Scripting/automation
- ✅ Quick testing
- ✅ Copy-paste commands

---

## Recommended for Your Demo:

**Use Postman** - It's more visual and professional for demonstrations!

1. Import the collection above
2. Get token
3. Run "Create Payment" request
4. Take screenshots of:
   - Request configuration
   - Response showing successful payment
   - All headers and body

