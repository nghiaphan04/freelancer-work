# WorkHub - Credit System Documentation

> Cập nhật 2026-01: Mua credit dùng số dư (`balance`). ZaloPay chỉ dùng để nạp balance (xem `balance.md`).

## 1. Kiến trúc tổng quan
```
Client → RateLimiter → JWT Filter → CreditController
                                 → CreditService
                                 → CreditPurchaseRepository, UserService
                                 → DB (credit_purchases, users)
```

## 2. Database schema
```
credit_purchases
- id (PK, BIGINT)
- app_trans_id (UNIQUE)    ◄─ log giao dịch
- zp_trans_id (nullable)   ◄─ legacy, hiện null
- user_id (FK → users)
- credit_package (ENUM: BASIC/STANDARD/PREMIUM)
- credits_amount (INT)
- total_amount (DECIMAL 15,2)
- currency (VARCHAR 10) default VND
- description (VARCHAR 500)
- order_url, qr_code, zp_trans_token (nullable, legacy)
- status (ENUM)            ◄─ luôn PAID ngay khi trừ balance
- payment_channel (INT, nullable, legacy)
- credits_granted (BOOL)   ◄─ true ngay khi mua bằng balance
- expired_at (nullable, legacy)
- paid_at (DATETIME)
- created_at, updated_at

users
- credits (INT, default 20)
- balance (DECIMAL 15,2)
```

## 3. Luồng mua credit (dùng balance)
1) Client gọi `POST /api/credits/purchase` với `creditPackage`.
2) CreditService:
   - Tính giá từ `ECreditPackage`.
   - Kiểm tra `user.hasEnoughBalance(price)`, trừ balance, cộng credits.
   - Lưu `credit_purchases` trạng thái PAID (ghi log).
3) Trả về CreditPurchaseResponse; không cần redirect/ZaloPay.

## 4. API
- `GET /api/credits/packages`: danh sách gói (credits, price, discount).
- `POST /api/credits/purchase`: mua bằng balance.
- `GET /api/credits/purchase/{appTransId}/status`: xem lại log giao dịch đã mua.
- `GET /api/credits/my-purchases?status=&page=&size=`
- `[ADMIN] GET /api/credits/all?status=&page=&size=`

## 5. Giá & gói (ví dụ)
- BASIC: 10 credits → 100,000 VND
- STANDARD: 25 credits → 240,000 VND
- PREMIUM: 60 credits → 540,000 VND
(Xem enum `ECreditPackage` để biết giá/discount chính xác.)

## 6. Ghi chú
- Không còn callback ZaloPay cho credit.
- Nếu balance không đủ, trả lỗi 400 với thông báo "Không đủ số dư".
- Tất cả doanh thu credit được trừ trực tiếp từ balance đã nạp.***
# WorkHub - Credit Purchase System Documentation

> Cập nhật 2026-01: Mua credit dùng số dư (balance). ZaloPay chỉ dùng để nạp balance. Credit purchase được ghi nhận trạng thái PAID ngay sau khi trừ balance.

## 1. KIẾN TRÚC TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CREDIT PURCHASE SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Client    │───>│Rate Limiter │───>│ JWT Filter  │───>│ Controller  │   │
│  │  (Next.js)  │    │   (Redis)   │    │             │    │             │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘   │
│                                                                   │         │
│                                    ┌─────────────────────────────┼────┐    │
│                                    │                             │    │    │
│                                    ▼                             ▼    ▼    │
│                              ┌──────────┐                 ┌──────────────┐ │
│                              │  Credit  │                 │     User     │ │
│                              │ Service  │                 │   Service    │ │
│                              └────┬─────┘                 └──────┬───────┘ │
│                                   │                              │         │
│              ┌────────────────────┼──────────────────┐           │         │
│              │                    │                  │           │         │
│              ▼                    ▼                  ▼           ▼         │
│       ┌────────────┐       ┌────────────┐                   ┌─────────┐  │
│       │   Credit   │       │    User    │                   │  User   │  │
│       │  Purchase  │       │ Repository │                   │ Entity  │  │
│       │ Repository │       └────────────┘                   └─────────┘  │
│       └─────┬──────┘                                                       │
│             │                                                              │
│             ▼                                                              │
│       ┌─────────────────────────────────────────────────┐                  │
│       │                   Database                      │                  │
│       │                 (PostgreSQL)                    │                  │
│       └─────────────────────────────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DATABASE SCHEMA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE DESIGN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────┐                                       │
│   │       credit_purchases          │                                       │
│   ├─────────────────────────────────┤                                       │
│   │ id (PK, BIGINT)                 │                                       │
│   │ app_trans_id (UNIQUE)           │◄── Mã giao dịch (ghi log)             │
│   │ zp_trans_id                     │◄── (legacy, nay null)                 │
│   │ user_id (FK → users)            │◄── Người mua                          │
│   │ credit_package (ENUM)           │◄── BASIC/STANDARD/PREMIUM             │
│   │ credits_amount (INT)            │◄── Số credit mua                      │
│   │ total_amount (DECIMAL 15,2)     │◄── Số tiền thanh toán                 │
│   │ currency (VARCHAR 10)           │◄── VND                                │
│   │ description (VARCHAR 500)       │◄── Mô tả giao dịch                    │
│   │ order_url (VARCHAR 1000)        │◄── (legacy, nay null)                 │
│   │ qr_code (TEXT)                  │◄── (legacy, nay null)                 │
│   │ zp_trans_token (VARCHAR 100)    │◄── (legacy, nay null)                 │
│   │ status (ENUM)                   │◄── luôn PAID ngay khi trừ balance     │
│   │ payment_channel (INT)           │◄── (legacy, nay null)                 │
│   │ credits_granted (BOOLEAN)       │◄── luôn true khi mua bằng balance     │
│   │ expired_at (DATETIME)           │◄── (legacy, có thể null)              │
│   │ paid_at (DATETIME)              │◄── Thời điểm trừ balance              │
│   │ created_at (DATETIME)           │                                       │
│   │ updated_at (DATETIME)           │                                       │
│   └────────────┬────────────────────┘                                       │
│                │                                                            │
│                │ N:1                                                        │
│                ▼                                                            │
│   ┌─────────────────────────────────┐                                       │
│   │            users                │                                       │
│   ├─────────────────────────────────┤                                       │
│   │ id (PK, BIGINT)                 │                                       │
│   │ credits (INT, DEFAULT 20)       │◄── Số credit hiện có                  │
│   │ last_daily_credit_date (DATE)   │◄── Ngày nhận credit hàng ngày         │
│   │ ...                             │                                       │
│   └─────────────────────────────────┘                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. CREDIT PACKAGES (GÓI CREDIT)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CREDIT PACKAGES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Package    │ Credits │ Price (VND)  │ Per Credit │ Discount │ Save  │   │
│   │────────────┼─────────┼──────────────┼────────────┼──────────┼───────│   │
│   │ BASIC      │    1    │    10,000    │   10,000   │    0%    │   -   │   │
│   │ STANDARD   │  100    │   650,000    │    6,500   │   35%    │ 35%   │   │
│   │ PREMIUM    │ 1000    │ 4,250,000    │    4,250   │  57.5%   │ 57.5% │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   Công thức giá gốc: credits × 10,000 VND                                   │
│   - BASIC:    1 × 10,000 = 10,000 VND (không giảm)                         │
│   - STANDARD: 100 × 10,000 = 1,000,000 VND → Bán 650,000 (giảm 35%)       │
│   - PREMIUM:  1000 × 10,000 = 10,000,000 VND → Bán 4,250,000 (giảm 57.5%) │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. PROJECT STRUCTURE

```
backend/src/main/java/com/workhub/api/
├── controller/
│   └── CreditController.java         # /api/credits/*
│
├── service/
│   └── CreditService.java            # Xử lý mua credit + ZaloPay
│
├── repository/
│   └── CreditPurchaseRepository.java # Truy vấn credit_purchases
│
├── entity/
│   ├── CreditPurchase.java           # Entity lịch sử mua credit
│   ├── ECreditPackage.java           # Enum gói credit: BASIC/STANDARD/PREMIUM
│   └── EPaymentStatus.java           # Enum trạng thái: PENDING/PAID/...
│
├── dto/
│   ├── request/
│   │   └── PurchaseCreditRequest.java
│   └── response/
│       ├── CreditPackageResponse.java
│       └── CreditPurchaseResponse.java
│
└── config/
    └── ZaloPayConfig.java            # Cấu hình ZaloPay + HMAC
```

---

## 5. CREDIT FLOW

### 5.1 Flow Mua Credit

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Server  │     │ ZaloPay  │     │    DB    │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ 1. GET /packages                │                │
     │───────────────>│                │                │
     │<───────────────│                │                │
     │ [{BASIC,       │                │                │
     │   STANDARD,    │                │                │
     │   PREMIUM}]    │                │                │
     │                │                │                │
     │ 2. POST /purchase               │                │
     │ {creditPackage:│                │                │
     │  "STANDARD"}   │                │                │
     │───────────────>│                │                │
     │                │ POST /v2/create│                │
     │                │───────────────>│                │
     │                │<───────────────│                │
     │                │ {order_url,    │                │
     │                │  qr_code}      │                │
     │                │ Save Purchase  │                │
     │                │───────────────────────────────>│
     │<───────────────│                │                │
     │ {orderUrl,qrCode}               │                │
     │                │                │                │
     │ 3. User thanh toán              │                │
     │────────────────────────────────>│                │
     │                │                │                │
     │                │ 4. Callback    │                │
     │                │<───────────────│                │
     │                │ {data, mac}    │                │
     │                │                │                │
     │                │ Update Purchase=PAID            │
     │                │ Cộng credit vào user            │
     │                │───────────────────────────────>│
     │                │                │                │
     │                │ 5. Redirect    │                │
     │<────────────────────────────────│                │
```

### 5.2 Credit Grant Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CREDIT GRANT FLOW (KHI THANH TOÁN THÀNH CÔNG)            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ZaloPay Callback                                                          │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────────────┐                                           │
│   │ 1. Verify MAC từ ZaloPay    │                                           │
│   └─────────────┬───────────────┘                                           │
│                 │                                                           │
│                 ▼                                                           │
│   ┌─────────────────────────────┐                                           │
│   │ 2. Tìm CreditPurchase       │                                           │
│   │    theo appTransId          │                                           │
│   └─────────────┬───────────────┘                                           │
│                 │                                                           │
│                 ▼                                                           │
│   ┌─────────────────────────────┐                                           │
│   │ 3. Kiểm tra chưa xử lý      │                                           │
│   │    (status != PAID)         │                                           │
│   └─────────────┬───────────────┘                                           │
│                 │                                                           │
│                 ▼                                                           │
│   ┌─────────────────────────────┐                                           │
│   │ 4. markAsPaid(zpTransId,    │                                           │
│   │              channel)       │                                           │
│   └─────────────┬───────────────┘                                           │
│                 │                                                           │
│                 ▼                                                           │
│   ┌─────────────────────────────┐                                           │
│   │ 5. Kiểm tra canGrantCredits │                                           │
│   │    (PAID && !creditsGranted)│                                           │
│   └─────────────┬───────────────┘                                           │
│                 │                                                           │
│                 ▼                                                           │
│   ┌─────────────────────────────┐                                           │
│   │ 6. user.addCredits(amount)  │                                           │
│   │    → credits += 100         │                                           │
│   └─────────────┬───────────────┘                                           │
│                 │                                                           │
│                 ▼                                                           │
│   ┌─────────────────────────────┐                                           │
│   │ 7. markCreditsGranted()     │                                           │
│   │    → creditsGranted = true  │                                           │
│   └─────────────────────────────┘                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. API ENDPOINTS

### Credit Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/api/credits/packages` | Danh sách gói credit | ❌ |
| `POST` | `/api/credits/purchase` | Mua credit | ✅ |
| `POST` | `/api/credits/callback` | Callback ZaloPay | ❌ |
| `GET` | `/api/credits/purchase/{appTransId}/status` | Truy vấn trạng thái | ✅ |
| `GET` | `/api/credits/my-purchases` | Lịch sử mua của tôi | ✅ |
| `GET` | `/api/credits/all` | [ADMIN] Tất cả đơn mua | ✅ Admin |

---

## 7. CHI TIẾT API

### GET /api/credits/packages
Lấy danh sách các gói credit (công khai, không cần auth)

```
Request (public)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/CreditController.java                               │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/packages")                                             │
│ public ResponseEntity<ApiResponse<List<CreditPackageResponse>>>     │
│         getCreditPackages() {                                        │
│     return ResponseEntity.ok(creditService.getCreditPackages());     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/CreditService.java                                     │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<List<CreditPackageResponse>> getCreditPackages() {│
│     List<CreditPackageResponse> packages = new ArrayList<>();        │
│                                                                      │
│     for (ECreditPackage pkg : ECreditPackage.values()) {             │
│         BigDecimal originalPrice = PRICE_PER_CREDIT                  │
│             .multiply(BigDecimal.valueOf(pkg.getCredits()));         │
│         // 10,000 × 100 = 1,000,000                                  │
│                                                                      │
│         BigDecimal actualPrice = pkg.getPrice();                     │
│         // 650,000                                                   │
│                                                                      │
│         int discountPercent = originalPrice.subtract(actualPrice)    │
│             .multiply(BigDecimal.valueOf(100))                       │
│             .divide(originalPrice, 0, HALF_UP)                       │
│             .intValue();                                             │
│         // (1,000,000 - 650,000) × 100 / 1,000,000 = 35%             │
│                                                                      │
│         packages.add(CreditPackageResponse.builder()                 │
│             .packageId(pkg.name())                                   │
│             .credits(pkg.getCredits())                               │
│             .price(actualPrice)                                      │
│             .pricePerCredit(pkg.getPricePerCredit())                 │
│             .originalPrice(originalPrice)                            │
│             .discountPercent(discountPercent)                        │
│             .description(pkg.getDescription())                       │
│             .build());                                               │
│     }                                                                │
│                                                                      │
│     return ApiResponse.success("Thành công", packages);              │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "data": [
        {
            "packageId": "BASIC",
            "credits": 1,
            "price": 10000,
            "pricePerCredit": 10000,
            "originalPrice": 10000,
            "discountPercent": 0,
            "description": "1 Credit"
        },
        {
            "packageId": "STANDARD",
            "credits": 100,
            "price": 650000,
            "pricePerCredit": 6500,
            "originalPrice": 1000000,
            "discountPercent": 35,
            "description": "100 Credits - Tiết kiệm 35%"
        },
        {
            "packageId": "PREMIUM",
            "credits": 1000,
            "price": 4250000,
            "pricePerCredit": 4250,
            "originalPrice": 10000000,
            "discountPercent": 58,
            "description": "1000 Credits - Tiết kiệm 57.5%"
        }
    ]
}
```

---

### POST /api/credits/purchase
Tạo đơn mua credit với ZaloPay

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/CreditController.java                               │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/purchase")                                            │
│ public ResponseEntity<ApiResponse<CreditPurchaseResponse>>          │
│         purchaseCredits(                                             │
│             @AuthenticationPrincipal UserDetailsImpl userDetails,    │
│             @Valid @RequestBody PurchaseCreditRequest req) {         │
│                                                                      │
│     ApiResponse<CreditPurchaseResponse> response =                   │
│         creditService.purchaseCredits(userDetails.getId(), req);     │
│     return ResponseEntity.status(HttpStatus.CREATED).body(response); │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/request/PurchaseCreditRequest.java                         │
├──────────────────────────────────────────────────────────────────────┤
│ @NotNull(message = "Gói credit không được để trống")                 │
│ private ECreditPackage creditPackage;                                │
│                                                                      │
│ → Validate sai → 400 Bad Request                                     │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/CreditService.java                                     │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<CreditPurchaseResponse> purchaseCredits(          │
│         Long userId, PurchaseCreditRequest req) {                    │
│                                                                      │
│     User user = userService.getById(userId);                         │
│     ECreditPackage creditPackage = req.getCreditPackage();           │
│                                                                      │
│     String appTransId = generateAppTransId(userId);                  │
│     // "260112_CR_1_123456"                                          │
│                                                                      │
│     String description = "WorkHub - Mua " +                          │
│         creditPackage.getCredits() + " credit";                      │
│                                                                      │
│     String redirectUrl = zaloPayConfig.getReturnUrl() +              │
│         "?type=credit&userId=" + userId;                             │
│                                                                      │
│     String embedData = String.format(                                │
│         "{\"redirecturl\":\"%s\",\"type\":\"credit\",\"userId\":%d}",│
│         redirectUrl, userId);                                        │
│                                                                      │
│     CreditPurchase purchase = CreditPurchase.builder()               │
│         .appTransId(appTransId)                                      │
│         .user(user)                                                  │
│         .creditPackage(creditPackage)                                │
│         .creditsAmount(creditPackage.getCredits())                   │
│         .totalAmount(creditPackage.getPrice())                       │
│         .status(EPaymentStatus.PENDING)                              │
│         .expiredAt(LocalDateTime.now().plusSeconds(900))             │
│         .build();                                                    │
│                                                                      │
│     // Gọi ZaloPay API                                               │
│     JsonNode zaloPayResponse = callZaloPayCreateOrder(...);          │
│     // ...                                                           │
│                                                                      │
│     CreditPurchase saved = creditPurchaseRepository.save(purchase);  │
│     return ApiResponse.success("Tạo đơn mua credit thành công",      │
│                                buildPurchaseResponse(saved));        │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 201 Created
{
    "status": "SUCCESS",
    "message": "Tạo đơn mua credit thành công",
    "data": {
        "id": 1,
        "appTransId": "260112_CR_1_123456",
        "zpTransId": null,
        "userId": 1,
        "userFullName": "Nguyen Van A",
        "creditPackage": "STANDARD",
        "creditsAmount": 100,
        "totalAmount": 650000,
        "currency": "VND",
        "description": "WorkHub - Mua 100 credit",
        "orderUrl": "https://qcgateway.zalopay.vn/openinapp?order=eyJ...",
        "qrCode": "00020101021226520010vn.zalopay...",
        "status": "PENDING",
        "paymentChannel": null,
        "creditsGranted": false,
        "expiredAt": "2026-01-12T16:15:00",
        "paidAt": null,
        "createdAt": "2026-01-12T16:00:00"
    }
}

→ User mở orderUrl hoặc quét qrCode để thanh toán
```

---

### POST /api/credits/callback
Callback nhận thông báo từ ZaloPay (TỰ ĐỘNG, KHÔNG CẦN AUTH)

```
ZaloPay gọi đến server
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/CreditController.java                               │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/callback")                                            │
│ public ResponseEntity<Map<String, Object>> handleCallback(           │
│     @RequestBody ZaloPayCallbackRequest request) {                   │
│                                                                      │
│     Map<String, Object> result =                                     │
│         creditService.handleCallback(request);                       │
│     return ResponseEntity.ok(result);                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/CreditService.java                                     │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public Map<String, Object> handleCallback(ZaloPayCallbackRequest req)│
│ {                                                                    │
│     Map<String, Object> result = new HashMap<>();                    │
│                                                                      │
│     try {                                                            │
│         String dataStr = req.getData();                              │
│         String requestMac = req.getMac();                            │
│                                                                      │
│         // 1. XÁC THỰC CALLBACK                                      │
│         if (!zaloPayConfig.verifyCallback(dataStr, requestMac)) {    │
│             result.put("return_code", -1);                           │
│             result.put("return_message", "mac not equal");           │
│             return result;                                           │
│         }                                                            │
│                                                                      │
│         // 2. Parse data                                             │
│         CallbackData callbackData = objectMapper                     │
│             .readValue(dataStr, CallbackData.class);                 │
│         String appTransId = callbackData.getAppTransId();            │
│                                                                      │
│         // 3. Tìm purchase                                           │
│         CreditPurchase purchase = creditPurchaseRepository           │
│             .findByAppTransId(appTransId).orElse(null);              │
│                                                                      │
│         if (purchase == null || purchase.isPaid()) {                 │
│             result.put("return_code", purchase == null ? 1 : 2);     │
│             result.put("return_message", "success");                 │
│             return result;                                           │
│         }                                                            │
│                                                                      │
│         // 4. CẬP NHẬT → PAID                                        │
│         purchase.markAsPaid(callbackData.getZpTransId(),             │
│                            callbackData.getChannel());               │
│                                                                      │
│         // 5. CỘNG CREDIT (QUAN TRỌNG!)                              │
│         if (purchase.canGrantCredits()) {                            │
│             User user = purchase.getUser();                          │
│             user.addCredits(purchase.getCreditsAmount());            │
│             // credits += 100                                        │
│             userService.save(user);                                  │
│                                                                      │
│             purchase.markCreditsGranted();                           │
│             // creditsGranted = true                                 │
│                                                                      │
│             log.info("Đã cộng {} credit cho user {}",                │
│                      purchase.getCreditsAmount(), user.getId());     │
│         }                                                            │
│                                                                      │
│         creditPurchaseRepository.save(purchase);                     │
│                                                                      │
│         result.put("return_code", 1);                                │
│         result.put("return_message", "success");                     │
│                                                                      │
│     } catch (Exception e) {                                          │
│         result.put("return_code", 0);                                │
│         result.put("return_message", e.getMessage());                │
│     }                                                                │
│                                                                      │
│     return result;                                                   │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "return_code": 1,
    "return_message": "success"
}

Return codes:
- 1: Thành công
- 2: Trùng (đã xử lý)
- -1: MAC không hợp lệ
- 0: Lỗi (ZaloPay retry)
```

---

### GET /api/credits/purchase/{appTransId}/status
Truy vấn trạng thái đơn mua credit

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/CreditController.java                               │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/purchase/{appTransId}/status")                         │
│ public ResponseEntity<ApiResponse<CreditPurchaseResponse>>          │
│         queryPurchaseStatus(                                         │
│             @PathVariable String appTransId,                         │
│             @AuthenticationPrincipal UserDetailsImpl userDetails) {  │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         creditService.queryPurchaseStatus(appTransId,                │
│                                           userDetails.getId()));     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/CreditService.java                                     │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<CreditPurchaseResponse> queryPurchaseStatus(      │
│         String appTransId, Long userId) {                            │
│                                                                      │
│     CreditPurchase purchase = creditPurchaseRepository               │
│         .findByAppTransId(appTransId)                                │
│         .orElseThrow(() -> new RuntimeException("Không tìm thấy"));  │
│                                                                      │
│     if (!purchase.getUser().getId().equals(userId)) {                │
│         throw new RuntimeException("Bạn không có quyền xem");        │
│     }                                                                │
│                                                                      │
│     // Nếu đang PENDING, query ZaloPay để cập nhật                   │
│     if (purchase.isPending()) {                                      │
│         try {                                                        │
│             JsonNode queryResult = callZaloPayQuery(appTransId);     │
│             int returnCode = queryResult.get("return_code").asInt(); │
│                                                                      │
│             if (returnCode == 1) {                                   │
│                 // Thanh toán thành công                             │
│                 Long zpTransId = queryResult                         │
│                     .get("zp_trans_id").asLong();                    │
│                 purchase.markAsPaid(zpTransId, null);                │
│                                                                      │
│                 // Cộng credit                                       │
│                 if (purchase.canGrantCredits()) {                    │
│                     User user = purchase.getUser();                  │
│                     user.addCredits(purchase.getCreditsAmount());    │
│                     userService.save(user);                          │
│                     purchase.markCreditsGranted();                   │
│                 }                                                    │
│                                                                      │
│                 purchase = creditPurchaseRepository.save(purchase);  │
│             } else if (returnCode == 2) {                            │
│                 purchase.markAsCancelled();                          │
│                 purchase = creditPurchaseRepository.save(purchase);  │
│             }                                                        │
│                                                                      │
│         } catch (Exception e) {                                      │
│             log.error("Lỗi query ZaloPay", e);                       │
│         }                                                            │
│     }                                                                │
│                                                                      │
│     return ApiResponse.success("Thành công",                         │
│                                buildPurchaseResponse(purchase));     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "data": {
        "appTransId": "260112_CR_1_123456",
        "zpTransId": 260112000000389,
        "creditPackage": "STANDARD",
        "creditsAmount": 100,
        "totalAmount": 650000,
        "status": "PAID",
        "creditsGranted": true,
        "paymentChannel": 38,
        "paidAt": "2026-01-12T16:05:00"
    }
}

ZaloPay return_code:
- 1: Thanh toán thành công
- 2: Thất bại
- 3: Đang xử lý / Chưa thanh toán
```

---

### GET /api/credits/my-purchases
Lấy lịch sử mua credit của tôi

```
Request + Cookie accessToken
GET /api/credits/my-purchases?status=PAID&page=0&size=10
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/CreditController.java                               │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/my-purchases")                                         │
│ public ResponseEntity<ApiResponse<Page<CreditPurchaseResponse>>>    │
│         getMyPurchases(                                              │
│             @AuthenticationPrincipal UserDetailsImpl userDetails,    │
│             @RequestParam(required = false) EPaymentStatus status,   │
│             @RequestParam(defaultValue = "0") int page,              │
│             @RequestParam(defaultValue = "10") int size) {           │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         creditService.getMyPurchases(userDetails.getId(),            │
│                                      status, page, size));           │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "data": {
        "content": [
            {
                "id": 1,
                "appTransId": "260112_CR_1_123456",
                "creditPackage": "STANDARD",
                "creditsAmount": 100,
                "totalAmount": 650000,
                "status": "PAID",
                "creditsGranted": true,
                "paidAt": "2026-01-12T16:05:00"
            }
        ],
        "totalPages": 1,
        "totalElements": 1
    }
}
```

---

### GET /api/credits/all
[ADMIN] Lấy tất cả đơn mua credit

```
Request + Cookie accessToken (ROLE_ADMIN)
GET /api/credits/all?status=PAID&page=0&size=10
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/CreditController.java                               │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/all")                                                  │
│ @PreAuthorize("hasRole('ADMIN')")                                    │
│ public ResponseEntity<ApiResponse<Page<CreditPurchaseResponse>>>    │
│         getAllPurchases(                                             │
│             @RequestParam(required = false) EPaymentStatus status,   │
│             @RequestParam(defaultValue = "0") int page,              │
│             @RequestParam(defaultValue = "10") int size) {           │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         creditService.getAllPurchases(status, page, size));          │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "data": {
        "content": [
            {
                "id": 1,
                "appTransId": "260112_CR_1_123456",
                "userId": 1,
                "userFullName": "Nguyen Van A",
                "creditPackage": "STANDARD",
                "creditsAmount": 100,
                "totalAmount": 650000,
                "status": "PAID",
                "creditsGranted": true,
                "paidAt": "2026-01-12T16:05:00"
            }
        ],
        "totalPages": 1,
        "totalElements": 1
    }
}
```

---

## 8. POSTMAN TEST

### 8.1 Lấy danh sách gói credit (Public)
```http
GET http://localhost:8080/api/credits/packages
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "data": [
        {
            "packageId": "BASIC",
            "credits": 1,
            "price": 10000,
            "pricePerCredit": 10000,
            "originalPrice": 10000,
            "discountPercent": 0,
            "description": "1 Credit"
        },
        {
            "packageId": "STANDARD",
            "credits": 100,
            "price": 650000,
            "pricePerCredit": 6500,
            "originalPrice": 1000000,
            "discountPercent": 35,
            "description": "100 Credits - Tiết kiệm 35%"
        },
        {
            "packageId": "PREMIUM",
            "credits": 1000,
            "price": 4250000,
            "pricePerCredit": 4250,
            "originalPrice": 10000000,
            "discountPercent": 58,
            "description": "1000 Credits - Tiết kiệm 57.5%"
        }
    ]
}
```

---

### 8.2 Mua credit (Auth)
```http
POST http://localhost:8080/api/credits/purchase
Cookie: accessToken=eyJ...
Content-Type: application/json

{
    "creditPackage": "STANDARD"
}
```

**Response: 201 Created**
```json
{
    "status": "SUCCESS",
    "message": "Tạo đơn mua credit thành công",
    "data": {
        "id": 1,
        "appTransId": "260112_CR_1_123456",
        "zpTransId": null,
        "userId": 1,
        "userFullName": "Nguyen Van A",
        "creditPackage": "STANDARD",
        "creditsAmount": 100,
        "totalAmount": 650000,
        "currency": "VND",
        "description": "WorkHub - Mua 100 credit",
        "orderUrl": "https://qcgateway.zalopay.vn/openinapp?order=eyJ...",
        "qrCode": "00020101021226520010vn.zalopay...",
        "status": "PENDING",
        "creditsGranted": false,
        "expiredAt": "2026-01-12T16:15:00"
    }
}
```

**→ Mở `orderUrl` trong browser hoặc quét `qrCode` để thanh toán**

---

### 8.3 Kiểm tra trạng thái (Auth)
```http
GET http://localhost:8080/api/credits/purchase/260112_CR_1_123456/status
Cookie: accessToken=eyJ...
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "data": {
        "appTransId": "260112_CR_1_123456",
        "zpTransId": 260112000000389,
        "creditPackage": "STANDARD",
        "creditsAmount": 100,
        "totalAmount": 650000,
        "status": "PAID",
        "creditsGranted": true,
        "paymentChannel": 38,
        "paidAt": "2026-01-12T16:05:00"
    }
}
```

---

### 8.4 Lịch sử mua credit (Auth)
```http
GET http://localhost:8080/api/credits/my-purchases?status=PAID&page=0&size=10
Cookie: accessToken=eyJ...
```

---

### 8.5 TEST FLOW HOÀN CHỈNH

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLOW TEST MUA CREDIT                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. POST /api/auth/login          → Lấy accessToken                         │
│                                                                             │
│  2. GET /api/users/me             → Xem credit hiện tại (ví dụ: 20)         │
│                                                                             │
│  3. GET /api/credits/packages     → Xem danh sách gói credit                │
│                                                                             │
│  4. POST /api/credits/purchase    → Mua gói STANDARD (100 credits)          │
│     Body: { "creditPackage": "STANDARD" }                                   │
│     Response: { orderUrl, qrCode, status: "PENDING" }                       │
│                                                                             │
│  5. Mở orderUrl hoặc quét qrCode  → Thanh toán 650,000 VND qua ZaloPay      │
│                                                                             │
│  6. POST /api/credits/callback    → ZaloPay gọi (hoặc giả lập)              │
│     Body: { data, mac, type }                                               │
│     → Credit được cộng vào tài khoản                                        │
│                                                                             │
│  7. GET /api/credits/purchase/{appTransId}/status                           │
│     → Kiểm tra status = "PAID", creditsGranted = true                       │
│                                                                             │
│  8. GET /api/users/me             → Xem credit mới (20 + 100 = 120)         │
│                                                                             │
│  9. GET /api/credits/my-purchases → Xem lịch sử mua credit                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. CREDIT STATUS FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PURCHASE STATUS FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌─────────┐                                   │
│                              │ PENDING │ ◄── Tạo purchase                  │
│                              └────┬────┘                                   │
│                                   │                                         │
│           ┌───────────────────────┼───────────────────────┐                │
│           │                       │                       │                │
│           ▼                       ▼                       ▼                │
│    ┌─────────────┐         ┌───────────┐         ┌───────────────┐        │
│    │  CANCELLED  │         │   PAID    │         │    EXPIRED    │        │
│    │ (User hủy)  │         │(Thanh toán)│         │  (Hết hạn)   │        │
│    └─────────────┘         └─────┬─────┘         └───────────────┘        │
│                                  │                                         │
│                                  │ creditsGranted = true                   │
│                                  ▼                                         │
│                           ┌─────────────┐                                  │
│                           │  COMPLETED  │                                  │
│                           │ (Credit đã  │                                  │
│                           │  cộng vào   │                                  │
│                           │  tài khoản) │                                  │
│                           └─────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. DAILY CREDIT BONUS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DAILY CREDIT BONUS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Mỗi user được nhận 10 credit miễn phí mỗi ngày khi đăng nhập.            │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ FILE: entity/User.java                                              │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │ @Column(name = "credits")                                           │   │
│   │ @Builder.Default                                                    │   │
│   │ private Integer credits = 20;   ◄── 20 credit khi tạo tài khoản    │   │
│   │                                     (10 tạo mới + 10 daily bonus)   │   │
│   │                                                                     │   │
│   │ @Column(name = "last_daily_credit_date")                            │   │
│   │ private LocalDate lastDailyCreditDate;                              │   │
│   │                                                                     │   │
│   │ public void claimDailyCredits() {                                   │   │
│   │     LocalDate today = LocalDate.now();                              │   │
│   │     if (lastDailyCreditDate == null ||                              │   │
│   │         !lastDailyCreditDate.equals(today)) {                       │   │
│   │         this.credits += 10;                                         │   │
│   │         this.lastDailyCreditDate = today;                           │   │
│   │     }                                                               │   │
│   │ }                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   Daily bonus được claim tự động khi:                                       │
│   - Đăng nhập (login)                                                       │
│   - Đăng nhập Google (googleAuth)                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. ERROR RESPONSES

### 400 Bad Request - Validation Error
```json
{
    "status": "ERROR",
    "message": "Validation failed",
    "errors": {
        "creditPackage": "Gói credit không được để trống"
    }
}
```

### 401 Unauthorized - Chưa đăng nhập
```json
{
    "status": "ERROR",
    "message": "Unauthorized"
}
```

### 403 Forbidden - Không có quyền
```json
{
    "status": "ERROR",
    "message": "Bạn không có quyền xem đơn này"
}
```

### 404 Not Found - Không tìm thấy
```json
{
    "status": "ERROR",
    "message": "Không tìm thấy đơn mua credit"
}
```

---

## 12. SECURITY CONFIG

```
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: config/SecurityConfig.java                                     │
├──────────────────────────────────────────────────────────────────────┤
│ .authorizeHttpRequests(auth -> auth                                  │
│     .requestMatchers(GET, "/api/credits/packages").permitAll()       │
│     .requestMatchers(POST, "/api/credits/callback").permitAll()      │
│     .requestMatchers("/api/credits/all").hasRole("ADMIN")            │
│     .anyRequest().authenticated()                                    │
│ )                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 13. LIÊN QUAN ĐẾN USER

### Credit được sử dụng khi Apply Job

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CREDIT USAGE - APPLY JOB                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   POST /api/jobs/{id}/apply                                                 │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────────────────────────────┐                           │
│   │ 1. Kiểm tra role FREELANCER                 │                           │
│   │ 2. Kiểm tra không phải owner của job        │                           │
│   │ 3. Kiểm tra job status = OPEN               │                           │
│   │ 4. Kiểm tra chưa apply job này              │                           │
│   │ 5. Kiểm tra có bank info (hasBankInfo())    │                           │
│   │ 6. Kiểm tra đủ credit (hasEnoughCredits(1)) │ ◄── 1 credit / apply      │
│   └─────────────────────────────────────────────┘                           │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────────────────────────────┐                           │
│   │ user.deductCredits(1);                      │                           │
│   │ → credits -= 1                              │                           │
│   └─────────────────────────────────────────────┘                           │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────────────────────────────┐                           │
│   │ Lưu JobApplication                          │                           │
│   │ Tăng job.applicationCount                   │                           │
│   └─────────────────────────────────────────────┘                           │
│                                                                             │
│   Error nếu không đủ credit:                                                │
│   "Bạn không đủ credit để ứng tuyển. Vui lòng mua thêm credit."            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Admin Grant Credits

```http
POST http://localhost:8080/api/users/{id}/credits
Cookie: accessToken={{admin_token}}
Content-Type: application/json

{
    "amount": 50
}
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "message": "Đã cộng 50 credit cho user",
    "data": {
        "id": 1,
        "email": "user@example.com",
        "credits": 170
    }
}
```
