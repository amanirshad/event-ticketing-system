# All Available API Endpoints

## Base URL: `http://localhost:8080`

---

## 1. Health Check
- **Method:** GET
- **URL:** `/health`
- **Auth:** Not required
- **Example:**
  ```bash
  GET http://localhost:8080/health
  ```

---

## 2. Get Authentication Token
- **Method:** GET
- **URL:** `/auth/dev-token?userId=test_user`
- **Auth:** Not required
- **Example:**
  ```bash
  GET http://localhost:8080/auth/dev-token?userId=test_user
  ```

---

## 3. Create Payment
- **Method:** POST
- **URL:** `/api/payments/charge`
- **Auth:** Required (Bearer token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Idempotency-Key: <uuid>`
  - `Content-Type: application/json`
- **Body:**
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

---

## 4. Get Payment by ID
- **Method:** GET
- **URL:** `/api/payments/{paymentId}`
- **Auth:** Required
- **Example:**
  ```bash
  GET http://localhost:8080/api/payments/pay_1234567890_abc123
  ```

---

## 5. Get Payments by Order
- **Method:** GET
- **URL:** `/api/payments/order/{orderId}`
- **Auth:** Required
- **Example:**
  ```bash
  GET http://localhost:8080/api/payments/order/order_123
  ```

---

## 6. Get User Payments (List)
- **Method:** GET
- **URL:** `/api/payments?page=1&limit=10`
- **Auth:** Required
- **Query Params:**
  - `page` (optional, default: 1)
  - `limit` (optional, default: 10)
- **Example:**
  ```bash
  GET http://localhost:8080/api/payments?page=1&limit=10
  ```

---

## 7. Update Payment Status ✅
- **Method:** PATCH
- **URL:** `/api/payments/{paymentId}/status`
- **Auth:** Required
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "status": "CANCELLED",
    "reason": "Order cancelled by user"
  }
  ```
- **Valid Statuses:** `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`, `CANCELLED`
- **Example:**
  ```bash
  PATCH http://localhost:8080/api/payments/pay_1234567890_abc123/status
  ```

---

## 8. Refund Payment
- **Method:** POST
- **URL:** `/api/payments/{paymentId}/refund`
- **Auth:** Required
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Idempotency-Key: <uuid>`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "amount": 2500,
    "reason": "requested_by_customer"
  }
  ```
- **Valid Reasons:** `duplicate`, `fraudulent`, `requested_by_customer`, `event_cancelled`
- **Example:**
  ```bash
  POST http://localhost:8080/api/payments/pay_1234567890_abc123/refund
  ```

---

## 9. Get Payment Statistics
- **Method:** GET
- **URL:** `/api/payments/stats/overview`
- **Auth:** Required
- **Example:**
  ```bash
  GET http://localhost:8080/api/payments/stats/overview
  ```

---

## 10. Get All Payments (Admin)
- **Method:** GET
- **URL:** `/api/payments/admin/all`
- **Auth:** Required
- **Example:**
  ```bash
  GET http://localhost:8080/api/payments/admin/all
  ```

---

## Postman Collection Updated!

The `payment-service.postman_collection.json` now includes:
- ✅ Update Payment Status (PATCH)
- ✅ Refund Payment (POST)

**Import the updated collection to get all endpoints!**

