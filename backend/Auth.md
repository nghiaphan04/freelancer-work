# WorkHub - Authentication System Documentation

> Cập nhật 2026-01: User có trường `balance` để nạp/tiêu số dư; AuthResponse trả thêm `balance`.

## 1. Kiến trúc tổng quan
```
Client (Next.js)
  → RateLimiter (Redis)
  → JWT Filter
  → Controllers (Auth, OTP)
  → Services (AuthService, OtpService, EmailService)
  → Repos (User, Role, RefreshToken)
  → DB (PostgreSQL) + Redis (OTP/Rate-limit)
```

## 2. Database schema (rút gọn)
```
users
- id (PK), email (unique), password (BCrypt)
- full_name, phone_number, avatar_url, cover_image_url
- title, location, company, bio
- credits (INT, default 20)      ◄─ apply job
- balance (DECIMAL 15,2)         ◄─ ví nội bộ
- last_daily_credit_date         ◄─ claim 10 credit/daily
- email_verified (BOOL), enabled (BOOL)
- bank_account_number, bank_name
- created_at, updated_at

roles, user_roles (N:M)

refresh_tokens
- id, user_id (FK), token (unique), expires_at, created_at, updated_at
```

## 3. Auth flows
- Đăng ký: tạo user emailVerified=false → gửi OTP (Redis) → verify OTP để kích hoạt.
- Login: kiểm tra emailVerified, rate-limit; `claimDailyCredits()` +10 nếu chưa nhận hôm nay; trả tokens + user info (có balance).
- Refresh token: verify refresh_token DB, cấp access token mới.
- Google Auth: lấy userinfo, auto-verify email, claimDailyCredits.
- Quên/đổi mật khẩu: OTP FORGOT_PASSWORD, đổi password, revoke refresh tokens.

## 4. Bảo mật
- JWT chứa danh sách roles (comma-separated) trong claim.
- Rate-limit login/register bằng Redis.
- OTP lưu Redis với TTL theo EOtpType.
- SecurityConfig: JWT filter, CORS; public endpoints cho auth/otp/health.

## 5. Response mẫu (AuthResponse)
```jsonc
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": 1,
    "email": "user@workhub.vn",
    "fullName": "...",
    "credits": 20,
    "balance": 0.00,
    "roles": ["ROLE_FREELANCER"],
    "hasBankInfo": false,
    "emailVerified": true,
    "enabled": true
  }
}
```

## 6. Ghi chú
- `balance` dùng cho nạp/tiêu số dư (xem `balance.md`).
- `credits` dùng khi ứng tuyển job; +10 mỗi ngày khi login.
- `hasBankInfo` bắt buộc để đăng job hoặc apply job.
# WorkHub - Authentication System Documentation

> Cập nhật 2026-01: User có trường `balance` (DECIMAL 15,2) để nạp/tiêu số dư. Auth response trả thêm balance.

## 1. KIẾN TRÚC TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Client    │───>│Rate Limiter │───>│ JWT Filter  │───>│ Controller  │   │
│  │  (Next.js)  │    │   (Redis)   │    │             │    │             │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘   │
│                                                                   │         │
│                                              ┌────────────────────┼────┐    │
│                                              │                    │    │    │
│                                              ▼                    ▼    ▼    │
│                                        ┌──────────┐        ┌──────────────┐ │
│                                        │ Service  │        │   Security   │ │
│                                        │  Layer   │        │   Config     │ │
│                                        └────┬─────┘        └──────────────┘ │
│                                             │                               │
│                          ┌──────────────────┼──────────────────┐            │
│                          │                  │                  │            │
│                          ▼                  ▼                  ▼            │
│                   ┌────────────┐     ┌────────────┐     ┌────────────┐      │
│                   │    User    │     │    OTP     │     │   Email    │      │
│                   │ Repository │     │  Service   │     │  Service   │      │
│                   └─────┬──────┘     └─────┬──────┘     └────────────┘      │
│                         │                  │                                │
│                         ▼                  ▼                                │
│                   ┌────────────┐     ┌────────────┐                         │
│                   │  Database  │     │   Redis    │                         │
│                   │(PostgreSQL)│     │ (OTP/Rate) │                         │
│                   └────────────┘     └────────────┘                         │
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
│   ┌─────────────────────────┐         ┌─────────────────────────┐           │
│   │         users           │         │         roles           │           │
│   ├─────────────────────────┤         ├─────────────────────────┤           │
│   │ id (PK, BIGINT)         │         │ id (PK, INT)            │           │
│   │ email (UNIQUE)          │    N:M  │ name (ENUM)             │           │
│   │ password (BCrypt)       │◄───────►│   - ROLE_ADMIN          │           │
│   │ full_name               │         │   - ROLE_FREELANCER     │           │
│   │ phone_number            │         │   - ROLE_EMPLOYER       │           │
│   │ avatar_url              │         └─────────────────────────┘           │
│   │ email_verified (BOOL)   │                                               │
│   │ enabled (BOOL)          │         ┌─────────────────────────┐           │
│   │ credits (INT, DEF 20)   │◄── Credit để apply job            │           │
│   │ balance (DECIMAL 15,2)  │◄── Số dư ví nội bộ                │           │
│   │ last_daily_credit_date  │◄── Ngày nhận credit hàng ngày     │           │
│   │ bank_account_number     │◄── STK ngân hàng (PRIVATE)        │           │
│   │ bank_name               │◄── Tên ngân hàng (PRIVATE)        │           │
│   │ created_at              │         ┌─────────────────────────┐           │
│   │ updated_at              │         │      user_roles         │           │
│   └────────────┬────────────┘         ├─────────────────────────┤           │
│                │                      │ user_id (FK)            │           │
│                │                      │ role_id (FK)            │           │
│                │                      └─────────────────────────┘           │
│                │                                                            │
│                │ 1:N                                                        │
│                ▼                                                            │
│   ┌─────────────────────────┐         ┌─────────────────────────┐           │
│   │    refresh_tokens       │         │   Redis (OTP Storage)   │           │
│   ├─────────────────────────┤         ├─────────────────────────┤           │
│   │ id (PK)                 │         │ otp:REGISTRATION:{email}│           │
│   │ user_id (FK)            │         │ otp:FORGOT_PASSWORD:... │           │
│   │ token (UNIQUE)          │         │ rate:login:{ip}         │           │
│   │ expires_at              │         │ rate:register:{ip}      │           │
│   │ created_at              │         │ (Auto-expire with TTL)  │           │
│   └─────────────────────────┘         └─────────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
---

## 4. AUTHENTICATION FLOWS

### 4.1 Registration Flow (Đăng ký)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Server  │     │    DB    │     │  Email   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ POST /register │                │                │
     │ {email,pass,   │                │                │
     │  fullName}     │                │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │ Check email    │                │
     │                │ exists?        │                │
     │                │───────────────>│                │
     │                │<───────────────│                │
     │                │                │                │
     │                │ Save user      │                │
     │                │ (email_verified│                │
     │                │  = false)      │                │
     │                │───────────────>│                │
     │                │                │                │
     │                │ Generate OTP   │                │
     │                │ Save to Redis  │                │
     │                │───────────────>│                │
     │                │                │                │
     │                │                │ Send OTP email │
     │                │                │───────────────>│
     │                │                │                │
     │<───────────────│                │                │
     │ "OTP sent"     │                │                │
     │                │                │                │
     │ POST /verify-otp                │                │
     │ {email, otp}   │                │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │ Verify OTP     │                │
     │                │───────────────>│                │
     │                │                │                │
     │                │ Update user    │                │
     │                │ email_verified │                │
     │                │ = true         │                │
     │                │───────────────>│                │
     │                │                │                │
     │<───────────────│                │                │
     │ "Success"      │                │                │
     │ + JWT Token    │                │                │
```

---

### 4.2 Login Flow (Đăng nhập)

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  Client  │                    │  Server  │                    │    DB    │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ POST /login                   │                               │
     │ {email, password}             │                               │
     │──────────────────────────────>│                               │
     │                               │                               │
     │                               │ Find user by email            │
     │                               │──────────────────────────────>│
     │                               │<──────────────────────────────│
     │                               │                               │
     │                               │ Verify password (BCrypt)      │
     │                               │                               │
     │                               │ Check email_verified          │
     │                               │                               │
     │                               │ Generate JWT + Refresh Token  │
     │                               │──────────────────────────────>│
     │                               │                               │
     │<──────────────────────────────│                               │
     │ {accessToken, refreshToken,   │                               │
     │  user info, roles}            │                               │
```


---

### 4.3 Forgot Password Flow (Quên mật khẩu)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Server  │     │    DB    │     │  Email   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ POST /forgot-password           │                │
     │ {email}        │                │                │
     │───────────────>│                │                │
     │                │ Check user     │                │
     │                │───────────────>│                │
     │                │                │                │
     │                │ Generate OTP   │                │
     │                │ (type=FORGOT)  │                │
     │                │───────────────>│                │
     │                │                │ Send OTP       │
     │                │                │───────────────>│
     │<───────────────│                │                │
     │ "OTP sent"     │                │                │
     │                │                │                │
     │ POST /reset-password            │                │
     │ {email, otp,   │                │                │
     │  newPassword}  │                │                │
     │───────────────>│                │                │
     │                │ Verify OTP     │                │
     │                │───────────────>│                │
     │                │                │                │
     │                │ Update password│                │
     │                │───────────────>│                │
     │<───────────────│                │                │
     │ "Success"      │                │                │
```

#### Forgot Password Request/Response

---

### 4.4 Refresh Token Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  Client  │                    │  Server  │                    │    DB    │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ POST /refresh-token           │                               │
     │ {refreshToken}                │                               │
     │──────────────────────────────>│                               │
     │                               │                               │
     │                               │ Validate refresh token        │
     │                               │──────────────────────────────>│
     │                               │<──────────────────────────────│
     │                               │                               │
     │                               │ Generate new access token     │
     │                               │                               │
     │<──────────────────────────────│                               │
     │ {newAccessToken}              │                               │
```

---

## 5. RATE LIMITING STRATEGY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RATE LIMITING CONFIG                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Endpoint                    │ Limit              │ Window    │ Block      │
│   ────────────────────────────┼────────────────────┼───────────┼─────────── │
│   POST /api/auth/register     │ 5 requests         │ 1 hour    │ IP-based   │
│   POST /api/auth/login        │ 10 requests        │ 15 mins   │ IP-based   │
│   POST /api/auth/verify-otp   │ 5 attempts         │ 10 mins   │ Per email  │
│   POST /api/auth/forgot-pass  │ 3 requests         │ 1 hour    │ Per email  │
│   POST /api/auth/resend-otp   │ 3 requests         │ 10 mins   │ Per email  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

---

## 6. PROJECT STRUCTURE

```
backend/src/main/java/com/workhub/api/
├── WorkHubApplication.java              # Main entry point
│
├── config/                              # Cấu hình
│   ├── SecurityConfig.java              # Spring Security, CORS
│   ├── RateLimitConfig.java             # Rate limiting với Redis
│   └── RedisConfig.java                 # Redis connection
│
├── controller/                          # Nhận request
│   ├── AuthController.java              # /api/auth/*
│   ├── UserController.java              # /api/users/*
│ 
│
├── service/                             # Xử lý logic
│   ├── AuthService.java                 # Đăng ký, đăng nhập, quên MK
│   ├── UserService.java                 # CRUD user
│   ├── OtpService.java                  # OTP (lưu Redis)
│   ├── EmailService.java                # Gửi email
│   └── RefreshTokenService.java         # Refresh token
│
├── repository/                          # Đọc/ghi DB
│   ├── UserRepository.java
│   ├── RoleRepository.java
│   └── RefreshTokenRepository.java
│
├── entity/                              # Bảng DB
│   ├── User.java
│   ├── Role.java
│   ├── ERole.java                       # Enum: ADMIN, FREELANCER, EMPLOYER
│   ├── RefreshToken.java
│   └── EOtpType.java                    # Enum: REGISTRATION, FORGOT_PASSWORD
│
├── dto/                                 # Request/Response
│   ├── request/
│   │   ├── RegisterRequest.java
│   │   ├── LoginRequest.java
│   │   ├── VerifyOtpRequest.java
│   │   ├── ForgotPasswordRequest.java
│   │   ├── ResetPasswordRequest.java
│   │   ├── ResendOtpRequest.java
│   │   ├── RefreshTokenRequest.java
│   │   └── GoogleAuthRequest.java
│   └── response/
│       ├── ApiResponse.java
│       ├── AuthResponse.java
│       └── OtpResponse.java
│
├── exception/                           # Xử lý lỗi
│   ├── GlobalExceptionHandler.java
│   ├── UserAlreadyExistsException.java
│   ├── UserNotFoundException.java
│   ├── InvalidOtpException.java
│   ├── OtpExpiredException.java
│   ├── EmailNotVerifiedException.java
│   └── TokenRefreshException.java
│
├── security/                            # Bảo mật
│   ├── jwt/
│   │   ├── JwtUtils.java                # Tạo/verify JWT
│   │   ├── JwtAuthFilter.java           # Filter kiểm tra JWT
│   │   └── AuthEntryPoint.java          # Xử lý lỗi 401
│   ├── UserDetailsImpl.java
│   ├── UserDetailsServiceImpl.java
│   └── RateLimitFilter.java             # Filter chống spam
│
└── seeder/                              # Dữ liệu khởi tạo
    ├── RoleSeeder.java                  # Tạo 3 roles
    └── AdminSeeder.java                 # Tạo admin mặc định
```

---

## 7. API ENDPOINTS

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required | Rate Limit |
|--------|----------|-------------|---------------|------------|
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới | ❌ | 5/hour/IP |
| `POST` | `/api/auth/verify-otp` | Xác thực OTP sau đăng ký | ❌ | 5/10min/email |
| `POST` | `/api/auth/resend-otp` | Gửi lại mã OTP | ❌ | 3/10min/email |
| `POST` | `/api/auth/login` | Đăng nhập | ❌ | 10/15min/IP |
| `POST` | `/api/auth/refresh-token` | Làm mới access token | ❌ | - |
| `POST` | `/api/auth/logout` | Đăng xuất | ✅ | - |
| `POST` | `/api/auth/forgot-password` | Yêu cầu reset password | ❌ | 3/hour/email |
| `POST` | `/api/auth/reset-password` | Đặt lại mật khẩu | ❌ | 5/hour/email |
| `POST` | `/api/auth/google` | Đăng nhập bằng Google OAuth | ❌ | - |

###/api/auth/register

Request
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: security/RateLimitFilter.java (dòng 43-45)                     │
├──────────────────────────────────────────────────────────────────────┤
│ if (path.equals("/api/auth/register")) {                             │
│     allowed = rateLimitConfig.isRegisterAllowed(clientIP);           │
│ }                                                                    │
│                                                                      │
│ → Check Redis: rate:register:{IP}                                    │
│ → Quá 10 lần → 429 Too Many Requests                                 │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/AuthController.java (dòng 21-24)                    │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/register")                                            │
│ public ResponseEntity<ApiResponse<OtpResponse>> register(            │
│     @Valid @RequestBody RegisterRequest req                          │
│ ) {                                                                  │
│     return ResponseEntity.status(HttpStatus.CREATED)                 │
│                          .body(authService.register(req));           │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/request/RegisterRequest.java (dòng 13-28)                  │
├──────────────────────────────────────────────────────────────────────┤
│ @NotBlank @Email                                                     │
│ private String email;                                                │
│                                                                      │
│ @NotBlank @Size(min=8) @Pattern(regexp="...")                        │
│ private String password;                                             │
│                                                                      │
│ @NotBlank @Size(min=2, max=100)                                      │
│ private String fullName;                                             │
│                                                                      │
│ → Validate sai → 400 Bad Request                                     │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/AuthService.java (dòng 37-60)                          │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<OtpResponse> register(RegisterRequest req) {      │
│                                                                      │
│     // 1. Check email tồn tại                                        │
│     if (userService.existsByEmail(req.getEmail())) {                 │
│         throw new UserAlreadyExistsException("Email đã đăng ký");    │
│     }                                                                │
│                                                                      │
│     // 2. Lấy role FREELANCER                                        │
│     Role role = roleRepository.findByName(ERole.ROLE_FREELANCER);    │
│                                                                      │
│     // 3. Tạo user (mã hóa password)                                 │
│     User user = User.builder()                                       │
│             .email(req.getEmail())                                   │
│             .password(passwordEncoder.encode(req.getPassword()))     │
│             .fullName(req.getFullName())                             │
│             .emailVerified(false)                                    │
│             .build();                                                │
│     user.assignRole(role);                                           │
│                                                                      │
│     // 4. Lưu vào PostgreSQL                                         │
│     userService.save(user);                                          │
│                                                                      │
│     // 5. Tạo OTP và gửi email                                       │
│     otpService.generateAndSendOtp(user, EOtpType.REGISTRATION);      │
│                                                                      │
│     return ApiResponse.success("Đăng ký thành công...", ...);        │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/OtpService.java (dòng 30-47)                           │
├──────────────────────────────────────────────────────────────────────┤
│ public void generateAndSendOtp(User user, EOtpType otpType) {        │
│     String otpKey = "otp:" + otpType + ":" + user.getEmail();        │
│     // Key = "otp:REGISTRATION:test@gmail.com"                       │
│                                                                      │
│     String otpCode = String.format("%06d", random.nextInt(1000000)); │
│     // otpCode = "385621"                                            │
│                                                                      │
│     // Lưu Redis, TTL 10 phút                                        │
│     redisTemplate.opsForValue().set(otpKey, otpCode, 600, SECONDS);  │
│                                                                      │
│     // Gửi email                                                     │
│     emailService.sendOtpEmail(...);                                  │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 201 Created
{
    "status": "SUCCESS",
    "message": "Đăng ký thành công. Vui lòng xác thực email.",
    "data": { "email": "test@gmail.com", "expiresIn": 600 }
}

### /api/auth/resend-otp
Request
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: security/RateLimitFilter.java (dòng 49-51)                     │
├──────────────────────────────────────────────────────────────────────┤
│ } else if (path.equals("/api/auth/resend-otp")) {                    │
│     allowed = rateLimitConfig.isOtpAllowed(clientIP);                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/AuthController.java (dòng 31-34)                    │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/resend-otp")                                          │
│ public ResponseEntity<ApiResponse<OtpResponse>> resendOtp(           │
│     @Valid @RequestBody ResendOtpRequest req                         │
│ ) {                                                                  │
│     return ResponseEntity.ok(authService.resendOtp(req));            │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/AuthService.java (dòng 122-131)                        │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<OtpResponse> resendOtp(ResendOtpRequest req) {    │
│                                                                      │
│     // 1. Tìm user                                                   │
│     User user = userService.findByEmail(req.getEmail())              │
│             .orElseThrow(() -> new UserNotFoundException(...));      │
│                                                                      │
│     // 2. Chuyển string → enum                                       │
│     EOtpType otpType = EOtpType.valueOf(req.getOtpType());           │
│     // "REGISTRATION" → EOtpType.REGISTRATION                        │
│                                                                      │
│     // 3. Tạo OTP mới và gửi email                                   │
│     otpService.generateAndSendOtp(user, otpType);                    │
│                                                                      │
│     return ApiResponse.success("Đã gửi lại OTP", ...);               │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Đã gửi lại OTP",
    "data": { "email": "test@gmail.com", "expiresIn": 600 }
}

### /api/auth/verify-otp
Request
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/AuthController.java (dòng 26-29)                    │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/verify-otp")                                          │
│ public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(          │
│     @Valid @RequestBody VerifyOtpRequest req                         │
│ ) {                                                                  │
│     return ResponseEntity.ok(authService.verifyOtp(req));            │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/AuthService.java (dòng 62-71)                          │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<AuthResponse> verifyOtp(VerifyOtpRequest req) {   │
│                                                                      │
│     // 1. Verify OTP từ Redis                                        │
│     otpService.verifyOtp(req.getEmail(), req.getOtp(),               │
│                          EOtpType.REGISTRATION);                     │
│                                                                      │
│     // 2. Cập nhật emailVerified = true                              │
│     User user = userService.getByEmail(req.getEmail());              │
│     user.verifyEmail();                                              │
│     userService.save(user);                                          │
│                                                                      │
│     // 3. Tạo JWT tokens                                             │
│     return buildAuthResponse(user, "Xác thực thành công");           │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/OtpService.java (dòng 49-79)                           │
├──────────────────────────────────────────────────────────────────────┤
│ public void verifyOtp(String email, String otpCode, EOtpType type) { │
│     String otpKey = "otp:" + type + ":" + email;                     │
│                                                                      │
│     // 1. Lấy OTP từ Redis                                           │
│     String storedOtp = redisTemplate.opsForValue().get(otpKey);      │
│                                                                      │
│     // 2. Check hết hạn                                              │
│     if (storedOtp == null) {                                         │
│         throw new OtpExpiredException("OTP hết hạn");                │
│     }                                                                │
│                                                                      │
│     // 3. Check số lần thử (max 5)                                   │
│     if (attempts >= maxAttempts) {                                   │
│         throw new InvalidOtpException("Quá số lần thử");             │
│     }                                                                │
│                                                                      │
│     // 4. So sánh OTP                                                │
│     if (!storedOtp.equals(otpCode)) {                                │
│         throw new InvalidOtpException("OTP sai");                    │
│     }                                                                │
│                                                                      │
│     // 5. Xóa OTP                                                    │
│     redisTemplate.delete(otpKey);                                    │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
Headers:
  Set-Cookie: accessToken=eyJ...; HttpOnly; Secure; Path=/; SameSite=Strict
  Set-Cookie: refreshToken=abc...; HttpOnly; Secure; Path=/api/auth; SameSite=Strict
Body:
{
    "status": "SUCCESS",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
        "refreshToken": "a1b2c3d4...",
        "expiresIn": 86400,
        "user": { "id": 1, "email": "test@gmail.com", ... }
    }
}

### /api/auth/login
Request
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: security/RateLimitFilter.java (dòng 46-48)                     │
├──────────────────────────────────────────────────────────────────────┤
│ } else if (path.equals("/api/auth/login")) {                         │
│     allowed = rateLimitConfig.isLoginAllowed(clientIP);              │
│ }                                                                    │
│ → Quá 10 lần → 429                                                   │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/AuthController.java (dòng 36-39)                    │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/login")                                               │
│ public ResponseEntity<ApiResponse<AuthResponse>> login(              │
│     @Valid @RequestBody LoginRequest req                             │
│ ) {                                                                  │
│     return ResponseEntity.ok(authService.login(req));                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/AuthService.java (dòng 73-86)                          │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<AuthResponse> login(LoginRequest req) {           │
│                                                                      │
│     // 1. Tìm user                                                   │
│     User user = userService.findByEmail(req.getEmail())              │
│             .orElseThrow(() -> new UserNotFoundException(...));      │
│                                                                      │
│     // 2. Check đã verify email chưa                                 │
│     if (!user.getEmailVerified()) {                                  │
│         otpService.generateAndSendOtp(user, EOtpType.REGISTRATION);  │
│         throw new EmailNotVerifiedException("Email chưa xác thực");  │
│     }                                                                │
│                                                                      │
│     // 3. Xác thực password (Spring Security)                        │
│     authenticationManager.authenticate(                              │
│         new UsernamePasswordAuthenticationToken(                     │
│             req.getEmail(), req.getPassword()                        │
│         )                                                            │
│     );                                                               │
│     // Password sai → 401 Unauthorized                               │
│                                                                      │
│     // 4. Tạo JWT tokens                                             │
│     return buildAuthResponse(user, "Đăng nhập thành công");          │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
Headers:
  Set-Cookie: accessToken=eyJ...; HttpOnly; Secure; Path=/; SameSite=Strict
  Set-Cookie: refreshToken=abc...; HttpOnly; Secure; Path=/api/auth; SameSite=Strict
Body:
{
    "status": "SUCCESS",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
        "refreshToken": "a1b2c3d4...",
        "user": { ... }
    }
}

### /api/auth/refresh-token
Request (Cookie hoặc Body)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/AuthController.java                                 │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/refresh-token")                                       │
│ public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(       │
│     @CookieValue(name = "refreshToken", required = false) String c,  │
│     @RequestBody(required = false) RefreshTokenRequest req,          │
│     HttpServletResponse response                                     │
│ ) {                                                                  │
│     String token = c != null ? c : req.getRefreshToken();            │
│     // Ưu tiên đọc từ cookie, fallback sang body                     │
│     ...                                                              │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/AuthService.java (dòng 88-91)                          │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<AuthResponse> refreshToken(RefreshTokenRequest r) │
│ {                                                                    │
│     // 1. Verify refresh token từ PostgreSQL                         │
│     RefreshToken token = refreshTokenService.verifyToken(            │
│         r.getRefreshToken()                                          │
│     );                                                               │
│                                                                      │
│     // 2. Tạo access token MỚI                                       │
│     return buildAuthResponse(token.getUser(), "Token đã làm mới");   │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/RefreshTokenService.java                               │
├──────────────────────────────────────────────────────────────────────┤
│ public RefreshToken verifyToken(String token) {                      │
│     // 1. Tìm trong DB                                               │
│     RefreshToken rt = refreshTokenRepository.findByToken(token)      │
│             .orElseThrow(() -> new TokenRefreshException(...));      │
│                                                                      │
│     // 2. Check hết hạn                                              │
│     if (rt.getExpiresAt().isBefore(Instant.now())) {                 │
│         refreshTokenRepository.delete(rt);                           │
│         throw new TokenRefreshException("Token hết hạn");            │
│     }                                                                │
│                                                                      │
│     return rt;                                                       │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
Headers:
  Set-Cookie: accessToken=eyJ...(MỚI); HttpOnly; Secure; Path=/; SameSite=Strict
  Set-Cookie: refreshToken=abc...; HttpOnly; Secure; Path=/api/auth; SameSite=Strict
Body:
{
    "status": "SUCCESS",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiJ9...(MỚI)",
        "refreshToken": "a1b2c3d4...",
        ...
    }
}

### /api/auth/forgot-password
Request
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: security/RateLimitFilter.java (dòng 52-54)                     │
├──────────────────────────────────────────────────────────────────────┤
│ } else if (path.equals("/api/auth/forgot-password")) {               │
│     allowed = rateLimitConfig.isForgotPasswordAllowed(clientIP);     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/AuthController.java (dòng 51-54)                    │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/forgot-password")                                     │
│ public ResponseEntity<ApiResponse<OtpResponse>> forgotPassword(      │
│     @Valid @RequestBody ForgotPasswordRequest req                    │
│ ) {                                                                  │
│     return ResponseEntity.ok(authService.forgotPassword(req));       │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/AuthService.java (dòng 99-107)                         │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<OtpResponse> forgotPassword(ForgotPasswordReq r) {│
│                                                                      │
│     // 1. Tìm user                                                   │
│     User user = userService.findByEmail(r.getEmail())                │
│             .orElseThrow(() -> new UserNotFoundException(...));      │
│                                                                      │
│     // 2. Tạo OTP loại FORGOT_PASSWORD                               │
│     otpService.generateAndSendOtp(user, EOtpType.FORGOT_PASSWORD);   │
│     // Key Redis: "otp:FORGOT_PASSWORD:test@gmail.com"               │
│                                                                      │
│     return ApiResponse.success("Đã gửi OTP đến email", ...);         │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Đã gửi OTP đến email",
    "data": { "email": "test@gmail.com", "expiresIn": 600 }
}

### /api/auth/reset-password
Request
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/AuthController.java (dòng 56-59)                    │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/reset-password")                                      │
│ public ResponseEntity<ApiResponse<Void>> resetPassword(              │
│     @Valid @RequestBody ResetPasswordRequest req                     │
│ ) {                                                                  │
│     return ResponseEntity.ok(authService.resetPassword(req));        │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/AuthService.java (dòng 109-120)                        │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<Void> resetPassword(ResetPasswordRequest req) {   │
│                                                                      │
│     // 1. Verify OTP loại FORGOT_PASSWORD                            │
│     otpService.verifyOtp(req.getEmail(), req.getOtp(),               │
│                          EOtpType.FORGOT_PASSWORD);                  │
│                                                                      │
│     // 2. Đổi password                                               │
│     User user = userService.getByEmail(req.getEmail());              │
│     user.changePassword(passwordEncoder.encode(req.getNewPassword()));│
│     userService.save(user);                                          │
│                                                                      │
│     // 3. Xóa tất cả refresh tokens (logout mọi thiết bị)            │
│     refreshTokenService.deleteByUser(user);                          │
│                                                                      │
│     return ApiResponse.success("Đặt lại mật khẩu thành công");       │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Đặt lại mật khẩu thành công"
}

### /api/auth/logout
Request (Cookie hoặc Body, body không bắt buộc)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/AuthController.java                                 │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/logout")                                              │
│ public ResponseEntity<ApiResponse<Void>> logout(                     │
│     @CookieValue(name = "refreshToken", required = false) String c,  │
│     @RequestBody(required = false) RefreshTokenRequest req,          │
│     HttpServletResponse response                                     │
│ ) {                                                                  │
│     String token = c != null ? c : req.getRefreshToken();            │
│     clearTokenCookies(response);  // Xóa cookies                     │
│     return ResponseEntity.ok(authService.logout(token));             │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/AuthService.java                                       │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<Void> logout(String refreshToken) {               │
│     // 1. Xóa refresh token khỏi PostgreSQL                          │
│     refreshTokenService.deleteByToken(refreshToken);                 │
│     // 2. Clear security context                                     │
│     SecurityContextHolder.clearContext();                            │
│     return ApiResponse.success("Đăng xuất thành công");              │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
Headers:
  Set-Cookie: accessToken=; HttpOnly; Path=/; Max-Age=0    (xóa cookie)
  Set-Cookie: refreshToken=; HttpOnly; Path=/api/auth; Max-Age=0
Body:
{
    "status": "SUCCESS",
    "message": "Đăng xuất thành công"
}

### /api/auth/google
Request
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ GOOGLE OAUTH FLOW                                                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐       │
│  │  Client  │───>│  Google  │───>│  Client  │───>│  Server  │       │
│  │(Frontend)│    │   OAuth  │    │(Frontend)│    │(Backend) │       │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘       │
│       │               │               │               │              │
│       │ Click Google  │               │               │              │
│       │ Sign-In       │               │               │              │
│       │──────────────>│               │               │              │
│       │               │               │               │              │
│       │               │ User login    │               │              │
│       │               │ & consent     │               │              │
│       │               │               │               │              │
│       │               │<──────────────│               │              │
│       │               │  ID Token     │               │              │
│       │<──────────────│ (credential)  │               │              │
│       │               │               │               │              │
│       │               │               │ POST /google  │              │
│       │               │               │ {credential}  │              │
│       │               │               │──────────────>│              │
│       │               │               │               │              │
│       │               │               │               │ Verify token │
│       │               │               │               │ with Google  │
│       │               │               │               │              │
│       │               │               │               │ Find/Create  │
│       │               │               │               │ User         │
│       │               │               │               │              │
│       │               │               │<──────────────│              │
│       │               │               │ JWT tokens    │              │
│       │               │               │ + User info   │              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/AuthController.java                                 │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/google")                                              │
│ public ResponseEntity<ApiResponse<AuthResponse>> googleAuth(         │
│     @Valid @RequestBody GoogleAuthRequest req,                       │
│     HttpServletResponse response) {                                  │
│                                                                      │
│     ApiResponse<AuthResponse> result = authService.googleAuth(req);  │
│     if (result.getData() != null) {                                  │
│         setTokenCookies(response, result.getData());                 │
│     }                                                                │
│     return ResponseEntity.ok(result);                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/request/GoogleAuthRequest.java                             │
├──────────────────────────────────────────────────────────────────────┤
│ @Data                                                                │
│ @NoArgsConstructor                                                   │
│ @AllArgsConstructor                                                  │
│ public class GoogleAuthRequest {                                     │
│                                                                      │
│     @NotBlank(message = "Google credential is required")             │
│     private String credential;  // ID Token từ Google                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/AuthService.java                                       │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<AuthResponse> googleAuth(GoogleAuthRequest req) { │
│                                                                      │
│     // 1. Tạo verifier với Google Client ID                          │
│     GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier        │
│         .Builder(new NetHttpTransport(), GsonFactory.getDefault())   │
│         .setAudience(Collections.singletonList(googleClientId))      │
│         .build();                                                    │
│                                                                      │
│     // 2. Verify ID Token                                            │
│     GoogleIdToken idToken = verifier.verify(req.getCredential());    │
│     if (idToken == null) {                                           │
│         return ApiResponse.error("Google token không hợp lệ");       │
│     }                                                                │
│                                                                      │
│     // 3. Lấy thông tin user từ token                                │
│     GoogleIdToken.Payload payload = idToken.getPayload();            │
│     String email = payload.getEmail();                               │
│     String fullName = (String) payload.get("name");                  │
│     String avatarUrl = (String) payload.get("picture");              │
│                                                                      │
│     // 4. Tìm hoặc tạo user mới                                      │
│     User user = userService.findByEmail(email)                       │
│             .orElseGet(() -> createGoogleUser(email, fullName,       │
│                                               avatarUrl));           │
│                                                                      │
│     // 5. Đảm bảo email verified                                     │
│     if (!user.getEmailVerified()) {                                  │
│         user.verifyEmail();                                          │
│         userService.save(user);                                      │
│     }                                                                │
│                                                                      │
│     // 6. Tạo JWT tokens (giống login thường)                        │
│     return buildAuthResponse(user, "Đăng nhập Google thành công");   │
│ }                                                                    │
│                                                                      │
│ private User createGoogleUser(String email, String fullName,         │
│                               String avatarUrl) {                    │
│     Role role = roleRepository.findByName(ERole.ROLE_FREELANCER)     │
│             .orElseThrow(() -> new RuntimeException("Role..."));     │
│                                                                      │
│     User user = User.builder()                                       │
│             .email(email)                                            │
│             .password("")       // Không cần password                │
│             .fullName(fullName != null ? fullName : email.split("@")[0])│
│             .avatarUrl(avatarUrl)                                    │
│             .emailVerified(true)  // Google đã verify                │
│             .enabled(true)                                           │
│             .build();                                                │
│     user.assignRole(role);                                           │
│     return userService.save(user);                                   │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
Headers:
  Set-Cookie: accessToken=eyJ...; HttpOnly; Secure; Path=/; SameSite=Strict
  Set-Cookie: refreshToken=abc...; HttpOnly; Secure; Path=/api/auth; SameSite=Strict
Body:
{
    "status": "SUCCESS",
    "message": "Đăng nhập Google thành công",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
        "refreshToken": "a1b2c3d4...",
        "expiresIn": 900,
        "user": {
            "id": 1,
            "email": "user@gmail.com",
            "fullName": "Nguyen Van A",
            "phoneNumber": null,
            "avatarUrl": "https://lh3.googleusercontent.com/...",
            "emailVerified": true,
            "enabled": true,
            "roles": ["ROLE_FREELANCER"]
        }
    }
}

Error Response (Token không hợp lệ):
{
    "status": "ERROR",
    "message": "Google token không hợp lệ"
}

#### Cấu hình Google OAuth

**1. Tạo Google Cloud Project:**
- Truy cập: https://console.cloud.google.com/
- Tạo project mới hoặc chọn project có sẵn

**2. Bật Google+ API:**
- APIs & Services → Enable APIs → Google+ API

**3. Tạo OAuth Client ID:**
- APIs & Services → Credentials → Create Credentials → OAuth Client ID
- Application type: Web application
- Authorized JavaScript origins:
  - `http://localhost:3000` (development)
  - `https://yourdomain.com` (production)

**4. Thêm vào .env:**
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**5. Frontend gửi credential:**
```javascript
// Sử dụng @react-oauth/google
import { GoogleLogin } from "@react-oauth/google";

<GoogleLogin
  onSuccess={(response) => {
    // response.credential chính là ID Token
    api.googleAuth(response.credential);
  }}
/>
```

### User Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `GET` | `/api/users/me` | Lấy thông tin user hiện tại | ✅ | ALL |
| `PUT` | `/api/users/me` | Cập nhật profile | ✅ | ALL |
| `PUT` | `/api/users/me/password` | Đổi mật khẩu | ✅ | ALL |
| `POST` | `/api/users/me/become-employer` | Đăng ký quyền đăng việc | ✅ | ALL |
| `GET` | `/api/users` | Lấy danh sách users | ✅ | ADMIN |
| `GET` | `/api/users/{id}` | Lấy user theo ID | ✅ | ADMIN |
| `PUT` | `/api/users/{id}/status` | Enable/Disable user | ✅ | ADMIN |
| `POST` | `/api/users/{id}/credits` | Cấp credit cho user | ✅ | ADMIN |

---
### /api/users/me
GET /api/users/me - lấy thông tin user hiện tại
Auth: Cookie accessToken (HttpOnly)

Request
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: security/jwt/JwtAuthFilter.java                                │
├──────────────────────────────────────────────────────────────────────┤
│ protected void doFilterInternal(HttpServletRequest request, ...) {   │
│     String jwt = parseJwt(request);                                  │
│     if (jwt != null && jwtUtils.validateJwtToken(jwt)) {             │
│         String email = jwtUtils.getEmailFromJwtToken(jwt);           │
│         ...                                                          │
│     }                                                                │
│ }                                                                    │
│                                                                      │
│ private String parseJwt(HttpServletRequest request) {                │
│     Cookie[] cookies = request.getCookies();                         │
│     if (cookies != null) {                                           │
│         for (Cookie cookie : cookies) {                              │
│             if ("accessToken".equals(cookie.getName())) {            │
│                 return cookie.getValue();                            │
│             }                                                        │
│         }                                                            │
│     }                                                                │
│     return null;                                                     │
│ }                                                                    │
│                                                                      │
│         // Load user từ DB                                           │
│         UserDetails userDetails = userDetailsService                 │
│             .loadUserByUsername(email);                              │
│                                                                      │
│         // Set vào SecurityContext (đánh dấu đã login)               │
│         UsernamePasswordAuthenticationToken authentication =         │
│             new UsernamePasswordAuthenticationToken(                 │
│                 userDetails, null, userDetails.getAuthorities()      │
│             );                                                       │
│         SecurityContextHolder.getContext()                           │
│             .setAuthentication(authentication);                      │
│     }                                                                │
│                                                                      │
│     filterChain.doFilter(request, response);                         │
│ }                                                                    │
│                                                                      │
│ // Token invalid hoặc không có → 401 Unauthorized                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/UserController.java                                 │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/me")                                                   │
│ public ResponseEntity<ApiResponse<UserResponse>> getMe(              │
│     @AuthenticationPrincipal UserDetailsImpl userDetails             │
│ ) {                                                                  │
│     // userDetails = user đang login (lấy từ SecurityContext)        │
│                                                                      │
│     User user = userService.getById(userDetails.getId());            │
│                                                                      │
│     UserResponse res = UserResponse.builder()                        │
│             .id(user.getId())                                        │
│             .email(user.getEmail())                                  │
│             .fullName(user.getFullName())                            │
│             .roles(roles)                                            │
│             .build();                                                │
│                                                                      │
│     return ResponseEntity.ok(ApiResponse.success("Thành công", res));│
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "data": {
        "id": 1,
        "email": "test@gmail.com",
        "fullName": "Nguyen Van A",
        "roles": ["ROLE_FREELANCER"]
    }
}

### /api/users/me` | Cập nhật profile 
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: security/jwt/JwtAuthFilter.java                                │
├──────────────────────────────────────────────────────────────────────┤
│ → Đọc JWT từ cookie accessToken                                      │
│ → Giải mã JWT, lấy email                                             │
│ → Load user từ DB, set vào SecurityContext                           │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/UserController.java (dòng 40-48)                    │
├──────────────────────────────────────────────────────────────────────┤
│ @PutMapping("/me")                                                   │
│ public ResponseEntity<...> updateProfile(                            │
│     @AuthenticationPrincipal UserDetailsImpl userDetails,            │
│     @Valid @RequestBody UpdateProfileRequest req) {                  │
│                                                                      │
│     User user = userService.updateProfile(userDetails.getId(), req); │
│     return ResponseEntity.ok(ApiResponse.success(...));              │
│ }                                                                    │
│                                                                      │
│ → @AuthenticationPrincipal: Lấy user đang login từ SecurityContext   │
│ → @Valid: Validate request body                                      │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/request/UpdateProfileRequest.java (dòng 1-23)              │
├──────────────────────────────────────────────────────────────────────┤
│ @Size(min = 2, max = 100) private String fullName;                   │
│ @Pattern(regexp = "^(\\+84|84|0)?[0-9]{9,10}$")                      │
│     private String phoneNumber;                                      │
│ @Size(max = 500) private String avatarUrl;                           │
│                                                                      │
│ → Các field đều OPTIONAL (không có @NotBlank)                        │
│ → Chỉ validate nếu có giá trị                                        │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/UserService.java (dòng 48-53)                          │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public User updateProfile(Long userId, UpdateProfileRequest req) {   │
│     User user = getById(userId);                                     │
│     user.updateProfile(req.getFullName(), req.getPhoneNumber(),      │
│                        req.getAvatarUrl());                          │
│     return userRepository.save(user);                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: entity/User.java (dòng 74-80)                                  │
├──────────────────────────────────────────────────────────────────────┤
│ public void updateProfile(String fullName, String phoneNumber,       │
│                           String avatarUrl) {                        │
│     if (fullName != null && !fullName.isBlank()) {                   │
│         this.fullName = fullName;                                    │
│     }                                                                │
│     this.phoneNumber = phoneNumber;                                  │
│     this.avatarUrl = avatarUrl;                                      │
│ }                                                                    │
│                                                                      │
│ → Rich Domain Model: Entity tự validate/xử lý logic                  │
│ → fullName: chỉ update nếu không null/blank                          │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ RESPONSE: 200 OK                                                     │
├──────────────────────────────────────────────────────────────────────┤
│ {                                                                    │
│   "status": "SUCCESS",                                               │
│   "message": "Cập nhật profile thành công",                          │
│   "data": { user info với các field đã update }                      │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
### /api/users/me/password` | Đổi mật khẩu 
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: security/jwt/JwtAuthFilter.java                                │
├──────────────────────────────────────────────────────────────────────┤
│ → Đọc JWT từ cookie accessToken (giống GET /me)                      │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/UserController.java (dòng 50-57)                    │
├──────────────────────────────────────────────────────────────────────┤
│ @PutMapping("/me/password")                                          │
│ public ResponseEntity<ApiResponse<Void>> changePassword(             │
│     @AuthenticationPrincipal UserDetailsImpl userDetails,            │
│     @Valid @RequestBody ChangePasswordRequest req) {                 │
│                                                                      │
│     userService.changePassword(userDetails.getId(), req);            │
│     return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu..."));│
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/request/ChangePasswordRequest.java (dòng 1-26)             │
├──────────────────────────────────────────────────────────────────────┤
│ @NotBlank private String currentPassword;                            │
│                                                                      │
│ @NotBlank                                                            │
│ @Size(min = 8, max = 50)                                             │
│ @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)...")             │
│ private String newPassword;                                          │
│                                                                      │
│ → currentPassword: Bắt buộc nhập                                     │
│ → newPassword: Validate mạnh (chữ hoa, thường, số, đặc biệt)         │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/UserService.java (dòng 56-71)                          │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public void changePassword(Long userId, ChangePasswordRequest req) { │
│     User user = getById(userId);                                     │
│                                                                      │
│     // CHECK 1: Mật khẩu hiện tại đúng không?                        │
│     if (!passwordEncoder.matches(req.getCurrentPassword(),           │
│                                  user.getPassword())) {              │
│         throw new IllegalArgumentException("Mật khẩu hiện tại...");  │
│     }                                                                │
│                                                                      │
│     // CHECK 2: Mật khẩu mới khác mật khẩu cũ?                       │
│     if (passwordEncoder.matches(req.getNewPassword(),                │
│                                 user.getPassword())) {               │
│         throw new IllegalArgumentException("Mật khẩu mới không...");│
│     }                                                                │
│                                                                      │
│     user.changePassword(passwordEncoder.encode(req.getNewPassword()));
│     userRepository.save(user);                                       │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: entity/User.java (dòng 68-73)                                  │
├──────────────────────────────────────────────────────────────────────┤
│ public void changePassword(String encodedPassword) {                 │
│     if (encodedPassword == null || encodedPassword.isBlank()) {      │
│         throw new IllegalArgumentException("Password cannot...");    │
│     }                                                                │
│     this.password = encodedPassword;                                 │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
   RESPONSE: 200 OK hoặc 400 Bad Request (nếu mật khẩu sai)

---

### /api/users/me/become-employer
POST /api/users/me/become-employer - Đăng ký quyền đăng việc (EMPLOYER)
Auth: Cookie accessToken

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/UserController.java                                 │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/me/become-employer")                                  │
│ public ResponseEntity<ApiResponse<UserResponse>> becomeEmployer(     │
│     @AuthenticationPrincipal UserDetailsImpl userDetails) {          │
│                                                                      │
│     User user = userService.addEmployerRole(userDetails.getId());    │
│     return ResponseEntity.ok(ApiResponse.success(                    │
│         "Đăng ký thành công! Bạn có thể đăng việc.",                 │
│         buildUserResponse(user)));                                   │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/UserService.java                                       │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public User addEmployerRole(Long userId) {                           │
│     User user = getById(userId);                                     │
│                                                                      │
│     if (user.hasRole(ERole.ROLE_EMPLOYER)) {                         │
│         throw new IllegalArgumentException("Bạn đã có quyền...");    │
│     }                                                                │
│                                                                      │
│     Role employerRole = roleRepository                               │
│         .findByName(ERole.ROLE_EMPLOYER)                             │
│         .orElseThrow(...);                                           │
│                                                                      │
│     user.assignRole(employerRole);                                   │
│     return userRepository.save(user);                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
RESPONSE: 200 OK
{
    "status": "SUCCESS",
    "message": "Đăng ký thành công! Bạn có thể đăng việc.",
    "data": {
        "id": 1,
        "email": "user@example.com",
        "roles": ["ROLE_FREELANCER", "ROLE_EMPLOYER"]  ◄── Có thêm EMPLOYER
    }
}

ERRORS:
- 400: Bạn đã có quyền đăng việc (đã là EMPLOYER)
```

---

### /api/users` | Lấy danh sách users (admin)
Request + Cookie accessToken (ADMIN)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: security/jwt/JwtAuthFilter.java                                │
├──────────────────────────────────────────────────────────────────────┤
│ → Đọc JWT từ cookie, load user với roles                             │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/UserController.java (dòng 59-76)                    │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping                                                          │
│ @PreAuthorize("hasRole('ADMIN')")    ◄── KIỂM TRA QUYỀN ADMIN        │
│ public ResponseEntity<...> getAllUsers(                              │
│     @RequestParam(defaultValue = "0") int page,                      │
│     @RequestParam(defaultValue = "10") int size,                     │
│     @RequestParam(defaultValue = "id") String sortBy,                │
│     @RequestParam(defaultValue = "asc") String sortDir) {            │
│                                                                      │
│     Sort sort = sortDir.equalsIgnoreCase("desc")                     │
│             ? Sort.by(sortBy).descending()                           │
│             : Sort.by(sortBy).ascending();                           │
│     Pageable pageable = PageRequest.of(page, size, sort);            │
│                                                                      │
│     Page<User> users = userService.getAllUsers(pageable);            │
│     Page<UserResponse> response = users.map(this::buildUserResponse);│
│     return ResponseEntity.ok(ApiResponse.success("Thành công",...)); │
│ }                                                                    │
│                                                                      │
│ → @PreAuthorize: Spring Security kiểm tra ROLE_ADMIN                 │
│ → Không phải ADMIN → 403 Forbidden                                   │
│ → Hỗ trợ phân trang và sắp xếp                                       │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/UserService.java (dòng 45-47)                          │
├──────────────────────────────────────────────────────────────────────┤
│ public Page<User> getAllUsers(Pageable pageable) {                   │
│     return userRepository.findAll(pageable);                         │
│ }                                                                    │
│                                                                      │
│ → Spring Data JPA tự động phân trang                                 │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ RESPONSE: 200 OK                                                     │
├──────────────────────────────────────────────────────────────────────┤
│ {                                                                    │
│   "status": "SUCCESS",                                               │
│   "data": {                                                          │
│     "content": [ {...user1}, {...user2}, ... ],                      │
│     "totalPages": 5,                                                 │
│     "totalElements": 50,                                             │
│     "size": 10,                                                      │
│     "number": 0                                                      │
│   }                                                                  │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
### /api/users/{id}` | Lấy user theo ID (admin)
Request + Cookie accessToken (ADMIN)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/UserController.java (dòng 78-83)                    │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/{id}")                                                 │
│ @PreAuthorize("hasRole('ADMIN')")                                    │
│ public ResponseEntity<...> getUserById(@PathVariable Long id) {      │
│     User user = userService.getById(id);                             │
│     return ResponseEntity.ok(ApiResponse.success(...));              │
│ }                                                                    │
│                                                                      │
│ → @PathVariable: Lấy {id} từ URL                                     │
│ → Không tìm thấy → 404 Not Found                                     │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/UserService.java (dòng 31-34)                          │
├──────────────────────────────────────────────────────────────────────┤
│ public User getById(Long id) {                                       │
│     return userRepository.findById(id)                               │
│         .orElseThrow(() -> new UserNotFoundException("Không tìm...")); 
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘

### `/api/users/{id}/status` | Enable/Disable user (admin)
Request + Cookie accessToken (ADMIN)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/UserController.java (dòng 85-94)                    │
├──────────────────────────────────────────────────────────────────────┤
│ @PutMapping("/{id}/status")                                          │
│ @PreAuthorize("hasRole('ADMIN')")                                    │
│ public ResponseEntity<...> updateUserStatus(                         │
│     @PathVariable Long id,                                           │
│     @Valid @RequestBody UpdateUserStatusRequest req) {               │
│                                                                      │
│     User user = userService.updateUserStatus(id, req.getEnabled());  │
│     String message = req.getEnabled()                                │
│         ? "Đã kích hoạt user"                                        │
│         : "Đã vô hiệu hóa user";                                     │
│     return ResponseEntity.ok(ApiResponse.success(message, ...));     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/request/UpdateUserStatusRequest.java (dòng 1-16)           │
├──────────────────────────────────────────────────────────────────────┤
│ @NotNull(message = "Enabled status is required")                     │
│ private Boolean enabled;                                             │
│                                                                      │
│ → true: Kích hoạt user                                               │
│ → false: Vô hiệu hóa (user không thể login)                          │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/UserService.java (dòng 74-82)                          │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public User updateUserStatus(Long userId, Boolean enabled) {         │
│     User user = getById(userId);                                     │
│     if (enabled) {                                                   │
│         user.enable();                                               │
│     } else {                                                         │
│         user.disable();                                              │
│     }                                                                │
│     return userRepository.save(user);                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: entity/User.java (dòng 81-86)                                  │
├──────────────────────────────────────────────────────────────────────┤
│ public void disable() {                                              │
│     this.enabled = false;                                            │
│ }                                                                    │
│ public void enable() {                                               │
│     this.enabled = true;                                             │
│ }                                                                    │
│                                                                      │
│ → User bị disable sẽ KHÔNG thể login (kiểm tra ở AuthService.login)  │
└──────────────────────────────────────────────────────────────────────┘

### 8.2 Gmail SMTP Configuration

**Bước 1: Bật 2-Step Verification**
- Truy cập: https://myaccount.google.com/security

**Bước 2: Tạo App Password**
1. Truy cập: https://myaccount.google.com/apppasswords
2. Chọn "Mail" → "Other"
3. Copy 16 ký tự vào `MAIL_PASSWORD`

---

## 9. REDIS SETUP

### Option 1: Docker (Local)
```bash
docker run -d --name redis -p 6379:6379 redis
```

### Option 2: Upstash (Cloud miễn phí)
1. Tạo tài khoản: https://upstash.com
2. Create Database
3. Copy Host, Port, Password vào `.env`

### Redis Keys

| Key | Value | TTL | Mục đích |
|-----|-------|-----|----------|
| `rate:login:{IP}` | Counter | 15 phút | Rate limit login |
| `rate:register:{IP}` | Counter | 1 giờ | Rate limit register |
| `otp:REGISTRATION:{email}` | 6 số | 10 phút | OTP đăng ký |
| `otp:FORGOT_PASSWORD:{email}` | 6 số | 10 phút | OTP quên MK |
| `otp_attempts:{type}:{email}` | Counter | 10 phút | Đếm số lần nhập sai |

---

## 10. CHẠY ỨNG DỤNG

```bash
# 1. Start Redis
docker run -d --name redis -p 6379:6379 redis
```
- Option 2: Cloud miễn phí - Upstash
    + Tạo tài khoản → Create Database
    + Copy Host, Port, Password vào .env:


JWT
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## 11. CREDIT SYSTEM

### 11.1 Tổng quan Credit

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CREDIT SYSTEM                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Credit là đơn vị để apply vào các job trên WorkHub.                       │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Nguồn credit:                                                       │   │
│   │ - Tạo tài khoản mới: +10 credit                                     │   │
│   │ - Đăng nhập hàng ngày: +10 credit/ngày (daily bonus)                │   │
│   │ - Mua credit: 10,000 VND/credit (có gói giảm giá)                   │   │
│   │ - Admin cấp: Không giới hạn                                         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Sử dụng credit:                                                     │   │
│   │ - Apply job: -1 credit/lần apply                                    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Daily Credit Bonus

```
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: entity/User.java                                               │
├──────────────────────────────────────────────────────────────────────┤
│ @Column(nullable = false)                                            │
│ @Builder.Default                                                     │
│ private Integer credits = 20;  // 10 tạo tài khoản + 10 daily        │
│                                                                      │
│ @Column(name = "last_daily_credit_date")                             │
│ private LocalDate lastDailyCreditDate;                               │
│                                                                      │
│ public boolean claimDailyCredits() {                                 │
│     LocalDate today = LocalDate.now();                               │
│     if (lastDailyCreditDate == null ||                               │
│         !lastDailyCreditDate.equals(today)) {                        │
│         this.credits += 10;                                          │
│         this.lastDailyCreditDate = today;                            │
│         return true;                                                 │
│     }                                                                │
│     return false;                                                    │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

Daily credit được claim tự động khi:
- Đăng nhập (POST /api/auth/login)
- Đăng nhập Google (POST /api/auth/google)

### 11.3 Credit Methods trong User Entity

```
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: entity/User.java                                               │
├──────────────────────────────────────────────────────────────────────┤
│ public boolean hasEnoughCredits(int amount) {                        │
│     return this.credits >= amount;                                   │
│ }                                                                    │
│                                                                      │
│ public void deductCredits(int amount) {                              │
│     if (!hasEnoughCredits(amount)) {                                 │
│         throw new IllegalStateException("Không đủ credit");          │
│     }                                                                │
│     this.credits -= amount;                                          │
│ }                                                                    │
│                                                                      │
│ public void addCredits(int amount) {                                 │
│     this.credits += amount;                                          │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 12. BANK ACCOUNT INFO (PRIVATE)

### 12.1 Tổng quan

Thông tin ngân hàng là bắt buộc trước khi freelancer có thể apply job.
Thông tin này chỉ được hiển thị cho:
- Chính user đó
- Admin

### 12.2 Bank Fields trong User Entity

```
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: entity/User.java                                               │
├──────────────────────────────────────────────────────────────────────┤
│ @Column(name = "bank_account_number", length = 50)                   │
│ private String bankAccountNumber;                                    │
│                                                                      │
│ @Column(name = "bank_name", length = 100)                            │
│ private String bankName;                                             │
│                                                                      │
│ public boolean hasBankInfo() {                                       │
│     return this.bankAccountNumber != null &&                         │
│            !this.bankAccountNumber.isBlank() &&                      │
│            this.bankName != null &&                                  │
│            !this.bankName.isBlank();                                 │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

### 12.3 UpdateProfileRequest với Bank Info

```
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/request/UpdateProfileRequest.java                          │
├──────────────────────────────────────────────────────────────────────┤
│ @Size(max = 50)                                                      │
│ private String bankAccountNumber;                                    │
│                                                                      │
│ @Size(max = 100)                                                     │
│ private String bankName;                                             │
└──────────────────────────────────────────────────────────────────────┘
```

### 12.4 AuthResponse với Credit và Bank Info

```
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/response/AuthResponse.java                                 │
├──────────────────────────────────────────────────────────────────────┤
│ @Data                                                                │
│ @Builder                                                             │
│ public static class UserResponse {                                   │
│     private Long id;                                                 │
│     private String email;                                            │
│     private String fullName;                                         │
│     private String phoneNumber;                                      │
│     private String avatarUrl;                                        │
│     private Boolean emailVerified;                                   │
│     private Boolean enabled;                                         │
│     private List<String> roles;                                      │
│                                                                      │
│     // Credit fields                                                 │
│     private Integer credits;           ◄── Số credit hiện có         │
│                                                                      │
│     // Bank fields (PRIVATE - chỉ user/admin thấy)                   │
│     private String bankAccountNumber;  ◄── STK ngân hàng             │
│     private String bankName;           ◄── Tên ngân hàng             │
│     private Boolean hasBankInfo;       ◄── Đã có thông tin ngân hàng │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 13. ADMIN GRANT CREDITS

### POST /api/users/{id}/credits
Admin cấp credit cho user

```
Request + Cookie accessToken (ROLE_ADMIN)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/UserController.java                                 │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/{id}/credits")                                        │
│ @PreAuthorize("hasRole('ADMIN')")                                    │
│ public ResponseEntity<ApiResponse<UserResponse>> grantCredits(       │
│     @PathVariable Long id,                                           │
│     @Valid @RequestBody GrantCreditsRequest req) {                   │
│                                                                      │
│     User user = userService.grantCredits(id, req.getAmount());       │
│     return ResponseEntity.ok(ApiResponse.success(                    │
│         "Đã cộng " + req.getAmount() + " credit cho user",           │
│         buildUserResponse(user, true)));                             │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/request/GrantCreditsRequest.java                           │
├──────────────────────────────────────────────────────────────────────┤
│ @Data                                                                │
│ public class GrantCreditsRequest {                                   │
│     @NotNull(message = "Số credit không được để trống")              │
│     @Min(value = 1, message = "Số credit phải >= 1")                 │
│     private Integer amount;                                          │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/UserService.java                                       │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public User grantCredits(Long userId, int amount) {                  │
│     User user = getById(userId);                                     │
│     user.addCredits(amount);                                         │
│     return userRepository.save(user);                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Đã cộng 50 credit cho user",
    "data": {
        "id": 1,
        "email": "user@example.com",
        "fullName": "Nguyen Van A",
        "credits": 170,
        ...
    }
}
```

---

## 14. POSTMAN TEST - CREDIT & BANK

### 14.1 Cập nhật Profile với Bank Info
```http
PUT http://localhost:8080/api/users/me
Cookie: accessToken=eyJ...
Content-Type: application/json

{
    "fullName": "Nguyen Van A",
    "phoneNumber": "0901234567",
    "bankAccountNumber": "1234567890",
    "bankName": "Vietcombank"
}
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "message": "Cập nhật profile thành công",
    "data": {
        "id": 1,
        "email": "user@example.com",
        "fullName": "Nguyen Van A",
        "phoneNumber": "0901234567",
        "credits": 120,
        "bankAccountNumber": "1234567890",
        "bankName": "Vietcombank",
        "hasBankInfo": true
    }
}
```

### 14.2 Admin cấp credit
```http
POST http://localhost:8080/api/users/5/credits
Cookie: accessToken={{admin_token}}
Content-Type: application/json

{
    "amount": 100
}
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "message": "Đã cộng 100 credit cho user",
    "data": {
        "id": 5,
        "credits": 220
    }
}
```

### 14.3 Flow đầy đủ - Credit và Bank Info

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FLOW: CREDIT VÀ BANK INFO                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. POST /api/auth/register        → Tạo tài khoản (+10 credit khởi tạo)   │
│                                                                             │
│  2. POST /api/auth/verify-otp      → Xác thực email                        │
│                                                                             │
│  3. POST /api/auth/login           → Đăng nhập (+10 daily credit)          │
│     Response: { user: { credits: 20 } }  ◄── 10 + 10                       │
│                                                                             │
│  4. GET /api/users/me              → Kiểm tra thông tin                    │
│     Response: { credits: 20, hasBankInfo: false }                          │
│                                                                             │
│  5. PUT /api/users/me              → Cập nhật bank info                    │
│     Body: { bankAccountNumber: "...", bankName: "..." }                    │
│     Response: { hasBankInfo: true }                                        │
│                                                                             │
│  6. POST /api/jobs/1/apply         → Apply job (tiêu 1 credit)             │
│     → Kiểm tra hasBankInfo = true ✅                                       │
│     → Kiểm tra credits >= 1 ✅                                             │
│     → Trừ 1 credit → credits = 19                                          │
│                                                                             │
│  7. Ngày hôm sau: POST /api/auth/login → +10 daily credit                  │
│     Response: { credits: 29 }                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```