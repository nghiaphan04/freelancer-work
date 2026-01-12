# WorkHub - Balance System Documentation

> Mục tiêu: ZaloPay chỉ dùng để **nạp số dư** vào ví nội bộ. Tiêu dùng (mua credit, đăng job) đều trừ trực tiếp balance.

## 1. Kiến trúc tổng quan
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             BALANCE SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Client (Next.js) → RateLimiter → JWT Filter → BalanceController             │
│                                         │                                   │
│                                         ▼                                   │
│                                ┌────────────────┐                           │
│                                │ BalanceService │                           │
│                                └───────┬────────┘                           │
│                                        │                                     │
│        ┌───────────────────────────────┼───────────────────────────────┐     │
│        ▼                               ▼                               ▼     │
│ BalanceDepositRepository          UserService                     ZaloPay API│
│        │                               │                               │     │
│        ▼                               ▼                               ▼     │
│                  PostgreSQL (balance_deposits, users)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Database schema
```
users
- id (PK, BIGINT)
- balance (DECIMAL 15,2)   ◄─ Số dư ví nội bộ
- ... (email, password, credits, ... )

balance_deposits
- id (PK, BIGINT)
- app_trans_id (UNIQUE)    ◄─ Mã giao dịch
- zp_trans_id (LONG, nullable)
- user_id (FK → users)
- amount (DECIMAL 15,2)
- description (VARCHAR 500)
- order_url, qr_code, zp_trans_token (nullable, từ ZaloPay)
- status (ENUM: PENDING/PAID/CANCELLED/EXPIRED)
- payment_channel (INT, nullable)
- expired_at (DATETIME)
- paid_at (DATETIME)
- created_at, updated_at
```

## 3. Luồng nạp tiền (ZaloPay)
```
┌──────────┐     ┌─────────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │ BalanceSvc  │     │ ZaloPay  │     │ Database │
└────┬─────┘     └─────┬───────┘     └────┬─────┘     └────┬─────┘
     │ POST /balance/deposit (amount)     │               │
     │───────────────────────────────────>│               │
     │                                    │ create order  │
     │                                    │──────────────>│
     │                                    │<──────────────│
     │<───────────────────────────────────│ (order_url/qr)│
     │                                    │               │
     │  Thanh toán ZaloPay                │               │
     │─────────────────────────────────────────>          │
     │                                    │               │
     │ POST /balance/callback             │               │
     │ (data, mac)                        │               │
     │───────────────────────────────────>│ verify MAC    │
     │                                    │ mark PAID     │
     │                                    │ add balance   │
     │                                    │──────────────>│ update users/balance_deposits
     │                                    │<──────────────│
     │<───────────────────────────────────│ return_code=1 │
     │                                    │               │
     │ GET /balance/deposit/{appTransId}/status            │
     │───────────────────────────────────>│               │
     │<───────────────────────────────────│ status=PAID   │
```

## 4. Tiêu số dư
- Mua credit: `POST /api/credits/purchase` trừ balance = giá gói, cộng credits, ghi log `credit_purchases` trạng thái PAID ngay.
- Đăng job: `POST /api/jobs` trừ balance = budget + 5% phí, job OPEN ngay (không PaymentService).

## 5. API surface
- User:
  - `POST /api/balance/deposit` — tạo đơn nạp, trả order_url/qr_code.
  - `POST /api/balance/callback` — nhận callback ZaloPay.
  - `GET /api/balance/deposit/{appTransId}/status` — tra cứu trạng thái.
  - `GET /api/balance/my-deposits?status=&page=&size=` — lịch sử nạp.
- Admin:
  - `GET /api/admin/balance?status=&page=&size=` — danh sách nạp (lọc trạng thái).
  - `GET /api/admin/balance/statistics` — tổng nạp, today, month, count theo status.

## 6. Config
- Dùng chung keys ZaloPay: `zalopay.app-id`, `zalopay.key1`, `zalopay.key2`, `zalopay.endpoint`.
- `app.payment.return-url` cho redirect sau thanh toán (type=balance).
- `app.payment.test-mode` để bỏ qua MAC khi test.
