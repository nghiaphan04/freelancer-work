# WorkHub - Job System Documentation

## 1. Kiến trúc tổng quan
```
Client → RateLimiter → JWT Filter → JobController
                                  → JobService
                                  → JobRepository, JobApplicationRepository, UserService
                                  → DB (jobs, job_applications, users)
```

## 2. Database schema (rút gọn)
```
jobs
- id (PK), title, description, context, requirements, deliverables
- skills (set<string>), complexity (ENUM), duration (ENUM), work_type (ENUM)
- budget (DECIMAL), currency (VARCHAR), application_deadline, expected_start_date
- status (ENUM: DRAFT/PENDING_APPROVAL/OPEN/REJECTED/IN_PROGRESS/COMPLETED/CLOSED/CANCELLED)
- escrow_amount (DECIMAL) ◄─ số tiền đã giữ (budget + fee), hoàn lại khi reject
- rejection_reason (TEXT) ◄─ lý do từ chối (nếu bị reject)
- view_count, application_count
- employer_id (FK → users)
- created_at, updated_at

job_applications
- id (PK), job_id (FK), freelancer_id (FK)
- cover_letter, status (ENUM: PENDING/ACCEPTED/REJECTED/WITHDRAWN)
- created_at, updated_at

users (liên quan)
- balance (DECIMAL 15,2) ◄─ dùng để trả phí đăng job
- credits (INT)          ◄─ freelancer apply job trừ 1 credit
- hasBankInfo (bank_account_number, bank_name) bắt buộc khi đăng/apply
```

## 3. Luồng đăng job (dùng balance + admin approval)
1) Employer gửi `CreateJob`.
2) JobService:
   - Yêu cầu `hasBankInfo`.
   - Kiểm tra `budget > 0`.
   - Tính phí: `fee = budget * 5%` (ceil); `total = budget + fee`.
   - Kiểm tra `employer.hasEnoughBalance(total)`, trừ balance.
   - Lưu job với `status=PENDING_APPROVAL`, `escrow_amount=total`.
3) Admin duyệt/từ chối:
   - **Duyệt**: `PUT /api/jobs/admin/{id}/approve` → status = OPEN (hiển thị công khai).
   - **Từ chối**: `PUT /api/jobs/admin/{id}/reject` → status = REJECTED + hoàn `escrow_amount` về balance employer.

## 4. Trạng thái job
- DRAFT: bản nháp, chưa gửi duyệt.
- PENDING_APPROVAL: đã trừ tiền, chờ admin duyệt.
- OPEN: đã duyệt, hiển thị công khai, nhận ứng tuyển.
- REJECTED: admin từ chối, đã hoàn tiền escrow.
- IN_PROGRESS: đang thực hiện.
- COMPLETED: hoàn thành.
- CLOSED/CANCELLED: đóng/hủy.

## 5. Ứng tuyển job (freelancer)
- Yêu cầu role FREELANCER, không phải chủ job, job OPEN, có bank info.
- Trừ 1 credit khi apply; nếu thiếu credit → lỗi.
- Ghi `job_applications` trạng thái PENDING; tăng `application_count`.
- Accept: đặt đơn ACCEPTED, từ chối các PENDING khác của cùng job.
- Reject / Withdraw: đổi trạng thái tương ứng.

## 6. API (rút gọn)
- Job public:
  - `GET /api/jobs/open?page=&size=&sortBy=&sortDir=`
  - `GET /api/jobs/{id}` (+increment view)
  - `GET /api/jobs/search?keyword=`
  - `GET /api/jobs/by-skills?skills=`
- Employer:
  - `POST /api/jobs` (create + trừ balance ngay)
  - `PUT /api/jobs/{id}` (update)
  - `POST /api/jobs/{id}/toggle` (OPEN/DRAFT) — không cần payment
  - `POST /api/jobs/{id}/close`
  - `DELETE /api/jobs/{id}`
  - `GET /api/jobs/my?status=&page=&size=&sortBy=&sortDir=`
  - `GET /api/jobs/{id}/applications` (xem danh sách ứng tuyển)
  - `POST /api/jobs/applications/{applicationId}/accept|reject`
- Freelancer:
  - `POST /api/jobs/{id}/apply`
  - `POST /api/jobs/applications/{applicationId}/withdraw`
  - `GET /api/jobs/my-applications?status=&page=&size=`
- Admin (kiểm duyệt job):
  - `GET /api/jobs/admin/pending` - danh sách jobs chờ duyệt
  - `GET /api/jobs/admin/status/{status}` - lọc theo trạng thái
  - `PUT /api/jobs/admin/{id}/approve` - duyệt job → OPEN
  - `PUT /api/jobs/admin/{id}/reject` - từ chối + hoàn tiền escrow
  - `GET /api/jobs/admin/count/pending` - đếm jobs chờ duyệt

## 7. Phí & số dư & escrow
- Phí đăng job: 5% trên budget, làm tròn lên (ceiling).
- Số dư cần có: `budget + fee` = `escrow_amount`.
- Khi tạo job: trừ `escrow_amount` từ balance employer, lưu vào job.
- Admin từ chối: hoàn `escrow_amount` về balance employer.
- Admin duyệt: giữ nguyên escrow (sẽ dùng để thanh toán cho freelancer sau).

## 8. Lưu ý
- Với luồng mới, mọi thanh toán ngoài đều đi qua nạp balance (xem `balance.md`).
- PaymentService, Payment entity, PaymentController đã loại bỏ.
- Đảm bảo front-end điều chỉnh thông báo và UI theo luồng trừ balance.***
# WorkHub - Job & Payment System Documentation

> Cập nhật 2026-01: PaymentService/ZaloPay đã loại bỏ. Đăng job trừ trực tiếp số dư (budget + 5% phí) từ `balance` của employer, job mở ngay sau khi trừ tiền.

## 1. KIẾN TRÚC TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      JOB + PAYMENT MANAGEMENT SYSTEM                        │
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
│                              │   Job    │                 │   Payment    │ │
│                              │ Service  │                 │   Service    │ │
│                              └────┬─────┘                 └──────┬───────┘ │
│                                   │                              │         │
│              ┌────────────────────┼──────────────────┐           │         │
│              │                    │                  │           │         │
│              ▼                    ▼                  ▼           ▼         │
│       ┌────────────┐       ┌────────────┐     ┌────────────┐ ┌─────────┐  │
│       │    Job     │       │    User    │     │  Payment   │ │ ZaloPay │  │
│       │ Repository │       │  Service   │     │ Repository │ │   API   │  │
│       └─────┬──────┘       └────────────┘     └─────┬──────┘ └─────────┘  │
│             │                                       │                      │
│             ▼                                       ▼                      │
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
│   │             jobs                │                                       │
│   ├─────────────────────────────────┤                                       │
│   │ id (PK, BIGINT)                 │                                       │
│   │ title (VARCHAR 200)             │◄── Tiêu đề tin tuyển dụng             │
│   │ description (TEXT)              │◄── Mô tả công việc                    │
│   │ context (TEXT)                  │◄── Bối cảnh dự án/công ty             │
│   │ requirements (TEXT)             │◄── Yêu cầu cụ thể                     │
│   │ deliverables (TEXT)             │◄── Sản phẩm bàn giao                  │
│   │ complexity (ENUM)               │◄── ENTRY/INTERMEDIATE/EXPERT          │
│   │ duration (ENUM)                 │◄── SHORT/MEDIUM/LONG_TERM             │
│   │ work_type (ENUM)                │◄── PART_TIME/FULL_TIME                │
│   │ budget (DECIMAL 15,2)           │◄── Ngân sách                          │
│   │ currency (VARCHAR 10)           │◄── VND/USD                            │
│   │ application_deadline (DATETIME) │◄── Hạn nộp hồ sơ                      │
│   │ expected_start_date (DATETIME)  │◄── Ngày dự kiến bắt đầu               │
│   │ status (ENUM)                   │◄── PENDING_APPROVAL/OPEN/REJECTED/... │
   │   │ escrow_amount (DECIMAL 15,2)    │◄── Số tiền giữ (budget + fee)         │
   │   │ rejection_reason (TEXT)         │◄── Lý do từ chối (nếu REJECTED)       │
   │   │ employer_id (FK → users)        │◄── Người đăng tin                     │
   │   │ view_count (INT)                │◄── Số lượt xem                        │
   │   │ application_count (INT)         │◄── Số đơn ứng tuyển                   │
│   │ created_at (DATETIME)           │                                       │
│   │ updated_at (DATETIME)           │                                       │
│   └────────────┬────────────────────┘                                       │
│                │                                                            │
│                │ 1:N                         1:1                            │
│                ▼                              │                             │
│   ┌─────────────────────────┐    ┌───────────┴─────────────────────────┐   │
│   │       job_skills        │    │            payments                 │   │
│   ├─────────────────────────┤    ├─────────────────────────────────────┤   │
│   │ job_id (FK)             │    │ id (PK, BIGINT)                     │   │
│   │ skill (VARCHAR 100)     │    │ app_trans_id (UNIQUE) ◄── Mã GD     │   │
│   └─────────────────────────┘    │ zp_trans_id           ◄── Mã ZaloPay│   │
│                                  │ job_id (FK → jobs)                  │   │
│                                  │ user_id (FK → users)                │   │
│                                  │ escrow_amount (DECIMAL)◄── Escrow   │   │
│                                  │ fee_amount (DECIMAL)  ◄── Phí 5%    │   │
│                                  │ total_amount (DECIMAL)◄── Tổng      │   │
│                                  │ order_url (VARCHAR)   ◄── Link TT   │   │
│                                  │ qr_code (TEXT)        ◄── Mã QR     │   │
│                                  │ status (ENUM)         ◄── PENDING/  │   │
│                                  │                          PAID/REFUND│   │
│                                  │ payment_channel (INT) ◄── Kênh TT   │   │
│                                  │ paid_at (DATETIME)                  │   │
│                                  │ refund_amount (DECIMAL)◄── Hoàn tiền│   │
│                                  │ refunded_at (DATETIME)              │   │
│                                  │ refund_reason (VARCHAR)             │   │
│                                  └─────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────┐                                       │
│   │       job_applications          │                                       │
│   ├─────────────────────────────────┤                                       │
│   │ id (PK, BIGINT)                 │                                       │
│   │ job_id (FK → jobs)              │◄── Job được apply                     │
│   │ freelancer_id (FK → users)      │◄── Người apply                        │
│   │ cover_letter (TEXT)             │◄── Thư giới thiệu                     │
│   │ status (ENUM)                   │◄── PENDING/ACCEPTED/REJECTED/WITHDRAWN│
│   │ created_at (DATETIME)           │                                       │
│   │ updated_at (DATETIME)           │                                       │
│   │ UNIQUE(job_id, freelancer_id)   │◄── Mỗi user chỉ apply 1 lần/job      │
│   └─────────────────────────────────┘                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. PROJECT STRUCTURE

```
backend/src/main/java/com/workhub/api/
├── controller/
│   ├── JobController.java
│   ├── PaymentController.java
│   └── AdminPaymentController.java
│
├── service/
│   ├── JobService.java                 # Xử lý logic job
│   └── PaymentService.java             # Xử lý thanh toán + ZaloPay
│
├── repository/
│   ├── JobRepository.java              # Truy vấn jobs
│   ├── PaymentRepository.java          # Truy vấn payments
│   └── JobApplicationRepository.java   # Truy vấn đơn ứng tuyển
│
├── entity/
│   ├── Job.java                        # Entity job
│   ├── Payment.java                    # Entity thanh toán
│   ├── JobApplication.java             # Entity đơn ứng tuyển
│   ├── EJobComplexity.java             # ENTRY/INTERMEDIATE/EXPERT
│   ├── EJobDuration.java               # SHORT/MEDIUM/LONG_TERM
│   ├── EWorkType.java                  # PART_TIME/FULL_TIME
│   ├── EJobStatus.java                 # DRAFT/OPEN/IN_PROGRESS/...
│   ├── EPaymentStatus.java             # PENDING/PAID/CANCELLED/EXPIRED
│   └── EApplicationStatus.java         # PENDING/ACCEPTED/REJECTED/WITHDRAWN
│
├── dto/
│   ├── request/
│   │   ├── CreateJobRequest.java
│   │   ├── UpdateJobRequest.java
│   │   ├── ApplyJobRequest.java        # Request ứng tuyển
│   │   └── ZaloPayCallbackRequest.java
│   └── response/
│       ├── JobResponse.java
│       ├── PaymentResponse.java
│       ├── PaymentStatisticsResponse.java
│       └── JobApplicationResponse.java # Response đơn ứng tuyển
│
├── config/
│   └── ZaloPayConfig.java              # Cấu hình ZaloPay + HMAC
│
└── exception/
    ├── JobNotFoundException.java
    └── UnauthorizedAccessException.java
```

---

## 4. PAYMENT FLOW (ZALOPAY)

### 4.1 Flow Đăng Tin + Thanh Toán

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Server  │     │ ZaloPay  │     │    DB    │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ 1. POST /jobs  │                │                │
     │───────────────>│                │                │
     │                │ Save Job(DRAFT)│                │
     │                │───────────────────────────────>│
     │<───────────────│                │                │
     │ {job: DRAFT}   │                │                │
     │                │                │                │
     │ 2. POST /payments/jobs/1        │                │
     │───────────────>│                │                │
     │                │ POST /v2/create│                │
     │                │───────────────>│                │
     │                │<───────────────│                │
     │                │ {order_url,    │                │
     │                │  qr_code}      │                │
     │                │ Save Payment   │                │
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
     │                │ Update Payment=PAID             │
     │                │ Update Job=OPEN│                │
     │                │───────────────────────────────>│
     │                │                │                │
     │                │ 5. Redirect    │                │
     │<────────────────────────────────│                │
```

### 4.2 Job Status Flow (Admin Approval)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    JOB STATUS TRANSITIONS (ADMIN APPROVAL)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Employer tạo job (POST /api/jobs)                                         │
│   → Trừ balance (escrow_amount = budget + 5% fee)                           │
│                                   │                                         │
│                                   ▼                                         │
│                      ┌──────────────────────┐                               │
│                      │  PENDING_APPROVAL    │ ◄── Chờ admin duyệt           │
│                      └───────────┬──────────┘                               │
│                                  │                                          │
│             ┌────────────────────┴────────────────────┐                     │
│             │                                         │                     │
│    Admin duyệt                               Admin từ chối                  │
│    PUT /approve                              PUT /reject                    │
│             │                                         │                     │
│             ▼                                         ▼                     │
│      ┌─────────┐                              ┌──────────┐                  │
│      │  OPEN   │                              │ REJECTED │                  │
│      └────┬────┘                              └──────────┘                  │
│           │                                   + Hoàn tiền escrow            │
│           │                                   + Lưu rejection_reason        │
│           ▼                                                                 │
│   ┌─────────────┐                                                           │
│   │ IN_PROGRESS │ ◄── Đã chọn freelancer                                    │
│   └──────┬──────┘                                                           │
│          │                                                                  │
│          ▼                                                                  │
│   ┌─────────────┐                                                           │
│   │  COMPLETED  │                                                           │
│   └─────────────┘                                                           │
│                                                                             │
│   Các status khác: DRAFT (nháp), CLOSED, CANCELLED                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. API ENDPOINTS

### Job Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/jobs` | Tạo job mới (PENDING_APPROVAL) | ✅ EMPLOYER |
| `GET` | `/api/jobs` | Danh sách jobs OPEN | ❌ |
| `GET` | `/api/jobs/{id}` | Chi tiết job | ❌ |
| `GET` | `/api/jobs/my-jobs` | Jobs của tôi | ✅ |
| `GET` | `/api/jobs/search` | Tìm kiếm | ❌ |
| `GET` | `/api/jobs/by-skills` | Tìm theo skill | ❌ |
| `PUT` | `/api/jobs/{id}` | Cập nhật | ✅ Owner |
| `PATCH` | `/api/jobs/{id}/close` | Đóng tin | ✅ Owner |
| `DELETE` | `/api/jobs/{id}` | Xóa | ✅ Owner/Admin |

### Admin Job Approval Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/api/jobs/admin/pending` | Danh sách jobs chờ duyệt | ✅ ADMIN |
| `GET` | `/api/jobs/admin/status/{status}` | Lọc theo trạng thái | ✅ ADMIN |
| `PUT` | `/api/jobs/admin/{id}/approve` | Duyệt job → OPEN | ✅ ADMIN |
| `PUT` | `/api/jobs/admin/{id}/reject` | Từ chối + hoàn escrow | ✅ ADMIN |
| `GET` | `/api/jobs/admin/count/pending` | Đếm jobs chờ duyệt | ✅ ADMIN |

### Job Application Endpoints

| Method | Endpoint | Mô tả | Auth | Role |
|--------|----------|-------|------|------|
| `POST` | `/api/jobs/{id}/apply` | Ứng tuyển vào job | ✅ | FREELANCER |
| `GET` | `/api/jobs/my-applications` | Đơn ứng tuyển của tôi | ✅ | FREELANCER |
| `DELETE` | `/api/jobs/applications/{id}` | Rút đơn ứng tuyển | ✅ | FREELANCER |
| `GET` | `/api/jobs/{id}/applications` | Danh sách đơn của job (poster) | ✅ | OWNER |
| `PUT` | `/api/jobs/applications/{id}/accept` | Duyệt đơn (auto reject các đơn pending khác) | ✅ | OWNER |
| `PUT` | `/api/jobs/applications/{id}/reject` | Từ chối đơn | ✅ | OWNER |

### Payment Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/payments/jobs/{jobId}` | Tạo đơn thanh toán | ✅ Owner |
| `POST` | `/api/payments/callback` | Callback ZaloPay | ❌ |
| `GET` | `/api/payments/query/{appTransId}` | Truy vấn trạng thái | ✅ |
| `GET` | `/api/payments/jobs/{jobId}` | Thanh toán của job | ✅ Owner |
| `GET` | `/api/payments/my-payments` | Danh sách thanh toán | ✅ |

### Admin Payment Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/api/admin/payments/statistics` | Thống kê tổng quan | ✅ Admin |
| `GET` | `/api/admin/payments` | Danh sách tất cả thanh toán | ✅ Admin |
| `GET` | `/api/admin/payments/search` | Tìm kiếm thanh toán | ✅ Admin |
| `GET` | `/api/admin/payments/recent` | Giao dịch gần đây | ✅ Admin |

---

## 6. CHI TIẾT API - JOB

### POST /api/jobs
Tạo job mới (DRAFT - cần thanh toán để đăng)

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java (dòng 30-37)                     │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping                                                         │
│ public ResponseEntity<ApiResponse<JobResponse>> createJob(           │
│     @AuthenticationPrincipal UserDetailsImpl userDetails,            │
│     @Valid @RequestBody CreateJobRequest req) {                      │
│                                                                      │
│     ApiResponse<JobResponse> response =                              │
│         jobService.createJob(userDetails.getId(), req);              │
│     return ResponseEntity.status(HttpStatus.CREATED).body(response); │
│ }                                                                    │
│                                                                      │
│ → @AuthenticationPrincipal: Lấy user đang login                      │
│ → @Valid: Validate request body                                      │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/request/CreateJobRequest.java (dòng 18-52)                 │
├──────────────────────────────────────────────────────────────────────┤
│ @NotBlank(message = "Tiêu đề không được để trống")                   │
│ @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự")               │
│ private String title;                                                │
│                                                                      │
│ @NotBlank(message = "Mô tả công việc không được để trống")           │
│ private String description;                                          │
│                                                                      │
│ private String context;           // Bối cảnh (optional)             │
│ private String requirements;      // Yêu cầu (optional)              │
│ private String deliverables;      // Sản phẩm bàn giao (optional)    │
│                                                                      │
│ @Size(max = 10) private Set<String> skills;                          │
│ private EJobComplexity complexity;  // ENTRY/INTERMEDIATE/EXPERT     │
│ private EJobDuration duration;      // SHORT/MEDIUM/LONG_TERM        │
│ private EWorkType workType;         // PART_TIME/FULL_TIME           │
│                                                                      │
│ @DecimalMin("0") private BigDecimal budget;                          │
│ private String currency;            // VND/USD                       │
│                                                                      │
│ @Future private LocalDateTime applicationDeadline;                   │
│ private LocalDateTime expectedStartDate;                             │
│                                                                      │
│ → Validate sai → 400 Bad Request                                     │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java (dòng 29-54)                           │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<JobResponse> createJob(Long employerId,           │
│                                           CreateJobRequest req) {    │
│     // 1. Lấy thông tin employer                                     │
│     User employer = userService.getById(employerId);                 │
│                                                                      │
│     // 1.1 YÊU CẦU: employer phải có thông tin bank                  │
│     if (!employer.hasBankInfo()) {                                   │
│         throw new IllegalStateException(                             │
│             "Vui lòng cập nhật số tài khoản ngân hàng " +            │
│             "trong profile trước khi đăng tin tuyển dụng");         │
│     }                                                                │
│                                                                      │
│     // 2. Tính phí và trừ balance                                    │
   │     BigDecimal fee = budget.multiply(FEE_PERCENT)                    │
   │         .divide(new BigDecimal("100"), 0, RoundingMode.CEILING);     │
   │     BigDecimal total = budget.add(fee);  // escrow_amount           │
   │                                                                      │
   │     if (!employer.hasEnoughBalance(total)) {                         │
   │         throw new IllegalStateException("Không đủ số dư");           │
   │     }                                                                │
   │     employer.deductBalance(total);                                   │
   │     userService.save(employer);                                      │
   │                                                                      │
   │     // 3. Tạo Job entity (PENDING_APPROVAL)                          │
   │     Job job = Job.builder()                                          │
   │             .title(req.getTitle())                                   │
   │             .budget(req.getBudget())                                 │
   │             .escrowAmount(total)  ◄── Lưu số tiền đã giữ             │
   │             .status(EJobStatus.PENDING_APPROVAL)  ◄── CHỜ DUYỆT      │
   │             .employer(employer)                                      │
   │             ...                                                      │
   │             .build();                                                │
   │                                                                      │
   │     // 4. Lưu vào PostgreSQL                                         │
   │     Job savedJob = jobRepository.save(job);                          │
   │                                                                      │
   │     return ApiResponse.success(                                      │
   │         "Tạo job thành công, đang chờ admin duyệt",                  │
   │         buildJobResponse(savedJob));                                 │
   │ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 201 Created
{
    "status": "SUCCESS",
    "message": "Tạo job thành công, đang chờ admin duyệt",
    "data": {
        "id": 1,
        "title": "Viết bài SEO cho website du lịch",
        "status": "PENDING_APPROVAL",  ◄── Chờ admin duyệt
        "budget": 1000000,
        "escrowAmount": 1050000,  ◄── budget + 5% fee đã trừ
        "currency": "VND",
        "skills": ["SEO", "Content Writing"],
        "complexity": "INTERMEDIATE",
        "employer": { "id": 1, "fullName": "Nguyen Van A" },
        ...
    }
}
```

---

### GET /api/jobs
Lấy danh sách jobs đang tuyển (công khai, không cần auth)

```
Request (public)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java (dòng 42-50)                     │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping                                                          │
│ public ResponseEntity<ApiResponse<Page<JobResponse>>> getOpenJobs(   │
│     @RequestParam(defaultValue = "0") int page,                      │
│     @RequestParam(defaultValue = "10") int size,                     │
│     @RequestParam(defaultValue = "createdAt") String sortBy,         │
│     @RequestParam(defaultValue = "desc") String sortDir) {           │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         jobService.getOpenJobs(page, size, sortBy, sortDir));        │
│ }                                                                    │
│                                                                      │
│ → Không cần authentication (xem SecurityConfig)                      │
│ → Hỗ trợ phân trang và sắp xếp                                       │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java (dòng 68-78)                           │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<Page<JobResponse>> getOpenJobs(int page, int size,│
│                                         String sortBy, String sortDir)│
│ {                                                                    │
│     Sort sort = sortDir.equalsIgnoreCase("desc")                     │
│             ? Sort.by(sortBy).descending()                           │
│             : Sort.by(sortBy).ascending();                           │
│     Pageable pageable = PageRequest.of(page, size, sort);            │
│                                                                      │
│     // CHỈ LẤY JOB CÓ STATUS = OPEN                                  │
│     Page<Job> jobs = jobRepository.findByStatus(EJobStatus.OPEN,     │
│                                                  pageable);          │
│     Page<JobResponse> response = jobs.map(this::buildJobResponse);   │
│                                                                      │
│     return ApiResponse.success("Thành công", response);              │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "data": {
        "content": [
            { "id": 1, "title": "...", "status": "OPEN", ... },
            { "id": 2, "title": "...", "status": "OPEN", ... }
        ],
        "totalPages": 5,
        "totalElements": 50,
        "size": 10,
        "number": 0
    }
}
```

---

### GET /api/jobs/{id}
Lấy chi tiết job + tăng lượt xem

```
Request (public)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java (dòng 55-58)                     │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/{id}")                                                 │
│ public ResponseEntity<ApiResponse<JobResponse>> getJobById(          │
│     @PathVariable Long id) {                                         │
│                                                                      │
│     return ResponseEntity.ok(jobService.getJobByIdAndIncrementView(id));│
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java (dòng 61-66)                           │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<JobResponse> getJobByIdAndIncrementView(Long id) {│
│     Job job = getById(id);                                           │
│                                                                      │
│     // Tăng lượt xem                                                 │
│     job.incrementViewCount();                                        │
│     jobRepository.save(job);                                         │
│                                                                      │
│     return ApiResponse.success("Thành công", buildJobResponse(job)); │
│ }                                                                    │
│                                                                      │
│ public Job getById(Long id) {                                        │
│     return jobRepository.findById(id)                                │
│             .orElseThrow(() -> new JobNotFoundException(id));        │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: entity/Job.java                                                │
├──────────────────────────────────────────────────────────────────────┤
│ public void incrementViewCount() {                                   │
│     this.viewCount++;                                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "data": {
        "id": 1,
        "title": "Viết bài SEO...",
        "viewCount": 156,  ◄── Đã tăng 1
        ...
    }
}
```

---

### DELETE /api/jobs/{id}
Xóa job (Owner hoặc Admin)

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java (dòng 125-131)                   │
├──────────────────────────────────────────────────────────────────────┤
│ @DeleteMapping("/{id}")                                              │
│ public ResponseEntity<ApiResponse<Void>> deleteJob(                  │
│     @PathVariable Long id,                                           │
│     @AuthenticationPrincipal UserDetailsImpl userDetails) {          │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         jobService.deleteJob(id, userDetails.getId()));              │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java                                        │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<Void> deleteJob(Long jobId, Long userId) {        │
│     Job job = getById(jobId);                                        │
│     User user = userService.getById(userId);                         │
│                                                                      │
│     if (!job.isOwnedBy(userId) && !user.isAdmin()) {                 │
│         throw new UnauthorizedAccessException(...);                  │
│     }                                                                │
│                                                                      │
│     boolean refunded = false;                                        │
│     Payment payment = paymentRepository.findByJobId(jobId)           │
│         .orElse(null);                                               │
│                                                                      │
│     if (payment != null) {                                           │
│         if (payment.getStatus() == PAID && !payment.isRefunded()) {  │
│             paymentService.refundPayment(jobId, userId,              │
│                 "Xóa job - tự động hoàn tiền");                      │
│             refunded = true;    ◄── TỰ ĐỘNG REFUND                   │
│         }                                                            │
│         paymentRepository.delete(payment);                           │
│     }                                                                │
│                                                                      │
│     jobRepository.delete(job);                                       │
│     return ApiResponse.success(refunded                              │
│         ? "Xóa job thành công (đã hoàn tiền escrow)"                 │
│         : "Xóa job thành công");                                     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: entity/Job.java                                                │
├──────────────────────────────────────────────────────────────────────┤
│ public boolean isOwnedBy(Long userId) {                              │
│     return this.employer != null &&                                  │
│            this.employer.getId().equals(userId);                     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: entity/User.java                                               │
├──────────────────────────────────────────────────────────────────────┤
│ public boolean isAdmin() {                                           │
│     return roles.stream()                                            │
│             .anyMatch(r -> r.getName() == ERole.ROLE_ADMIN);         │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Xóa job thành công"
}

Errors:
- 401: Không có token
- 403: Không phải Owner và không phải Admin
- 404: Job không tồn tại
```

---

## 7. CHI TIẾT API - PAYMENT

### POST /api/payments/jobs/{jobId}
Tạo đơn hàng thanh toán ZaloPay (QUAN TRỌNG)

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/PaymentController.java (dòng 33-39)                 │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/jobs/{jobId}")                                        │
│ public ResponseEntity<ApiResponse<PaymentResponse>> createPaymentFor │
│     @PathVariable Long jobId,                                        │
│     @AuthenticationPrincipal UserDetailsImpl userDetails) {          │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         paymentService.createPaymentForJob(jobId, userDetails.getId())│
│     );                                                               │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/PaymentService.java (dòng 49-131)                      │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<PaymentResponse> createPaymentForJob(Long jobId,  │
│                                                         Long userId) │
│ {                                                                    │
│     // 1. Kiểm tra job tồn tại                                       │
│     Job job = jobRepository.findById(jobId)                          │
│             .orElseThrow(() -> new JobNotFoundException(jobId));     │
│                                                                      │
│     // 2. Kiểm tra quyền sở hữu                                      │
│     if (!job.isOwnedBy(userId)) {                                    │
│         throw new RuntimeException(                                  │
│             "Bạn không có quyền thanh toán cho job này");            │
│     }                                                                │
│                                                                      │
│     // 3. Kiểm tra job có ngân sách                                  │
│     if (job.getBudget() == null ||                                   │
│         job.getBudget().compareTo(BigDecimal.ZERO) <= 0) {           │
│         throw new RuntimeException("Job chưa có ngân sách");         │
│     }                                                                │
│                                                                      │
│     // 4. Kiểm tra đã thanh toán chưa                                │
│     if (paymentRepository.existsByJobIdAndStatus(jobId,              │
│                                          EPaymentStatus.PAID)) {     │
│         throw new RuntimeException("Job đã được thanh toán");        │
│     }                                                                │
│                                                                      │
│     // 5. TÍNH PHÍ                                                   │
│     BigDecimal jobAmount = job.getBudget();      // 1,000,000        │
│     BigDecimal feeAmount = jobAmount                                 │
│         .multiply(FEE_PERCENT)                   // × 5              │
│         .divide(new BigDecimal("100"), 0,                            │
│                 RoundingMode.CEILING);           // = 50,000         │
│     BigDecimal totalAmount = jobAmount                               │
│         .add(feeAmount);                         // = 1,050,000      │
│                                                                      │
│     // 6. Tạo mã giao dịch (format: yyMMdd_jobId_random)             │
│     String appTransId = generateAppTransId(jobId);                   │
│     // VD: "260112_1_123456"                                         │
│                                                                      │
│     // 7. Gọi ZaloPay API tạo đơn hàng                               │
│     JsonNode zaloPayResponse = callZaloPayCreateOrder(...);          │
│     // ...                                                           │
│                                                                      │
│     // 8. Lưu payment vào DB                                         │
│     Payment savedPayment = paymentRepository.save(payment);          │
│     return ApiResponse.success("Tạo đơn hàng thanh toán thành công", │
│                                buildPaymentResponse(savedPayment));  │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/PaymentService.java - callZaloPayCreateOrder           │
├──────────────────────────────────────────────────────────────────────┤
│ private JsonNode callZaloPayCreateOrder(...) throws Exception {      │
│     String url = zaloPayConfig.getEndpoint() + "/create";            │
│     // = "https://sb-openapi.zalopay.vn/v2/create"                   │
│                                                                      │
│     // Tạo MAC = HMAC(key1, app_id|app_trans_id|app_user|amount|...) │
│     String mac = zaloPayConfig.createOrderMac(appTransId, appUser,   │
│                                               amount, appTime,       │
│                                               embedData, item);      │
│                                                                      │
│     // Form data (application/x-www-form-urlencoded)                 │
│     MultiValueMap<String, String> params = new LinkedMultiValueMap();│
│     params.add("app_id", zaloPayConfig.getAppId());    // "2553"     │
│     params.add("app_user", appUser);                                 │
│     params.add("app_trans_id", appTransId);                          │
│     params.add("app_time", String.valueOf(appTime));                 │
│     params.add("amount", String.valueOf(amount));                    │
│     params.add("description", description);                          │
│     params.add("embed_data", embedData);                             │
│     params.add("item", item);                                        │
│     params.add("bank_code", "");                                     │
│     params.add("expire_duration_seconds", "900");                    │
│     params.add("mac", mac);                                          │
│                                                                      │
│     // POST to ZaloPay                                               │
│     ResponseEntity<String> response =                                │
│         restTemplate.postForEntity(url, request, String.class);      │
│                                                                      │
│     return objectMapper.readTree(response.getBody());                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: config/ZaloPayConfig.java (dòng 28-35)                         │
├──────────────────────────────────────────────────────────────────────┤
│ // Tạo MAC cho request tạo đơn hàng                                  │
│ // hmac_input = app_id|app_trans_id|app_user|amount|app_time|        │
│ //              embed_data|item                                      │
│ public String createOrderMac(String appTransId, String appUser,      │
│                              long amount, long appTime,              │
│                              String embedData, String item) {        │
│     String data = appId + "|" + appTransId + "|" + appUser + "|"     │
│                 + amount + "|" + appTime + "|" + embedData + "|"     │
│                 + item;                                              │
│     return hmacSHA256(key1, data);                                   │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Tạo đơn hàng thanh toán thành công",
    "data": {
        "id": 1,
        "appTransId": "260112_1_123456",
        "zpTransId": null,               ◄── Chưa có (chưa thanh toán)
        "jobId": 1,
        "jobTitle": "Viết bài SEO...",
        "jobAmount": 1000000,
        "feeAmount": 50000,
        "feePercent": 5.00,
        "totalAmount": 1050000,          ◄── User thanh toán số này
        "currency": "VND",
        "orderUrl": "https://qcgateway.zalopay.vn/openinapp?order=eyJ...",
        "qrCode": "00020101021226520010vn.zalopay...",
        "status": "PENDING",
        "expiredAt": "2026-01-12T16:15:00"
    }
}

→ User mở orderUrl hoặc quét qrCode để thanh toán
```

---

### POST /api/payments/callback
Callback nhận thông báo từ ZaloPay (TỰ ĐỘNG, KHÔNG CẦN AUTH)

```
ZaloPay gọi đến server
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/PaymentController.java (dòng 48-55)                 │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/callback")                                            │
│ public ResponseEntity<Map<String, Object>> handleCallback(           │
│     @RequestBody ZaloPayCallbackRequest request) {                   │
│                                                                      │
│     log.info("Received ZaloPay callback: type={}", request.getType())│
│     Map<String, Object> result =                                     │
│         paymentService.handleCallback(request);                      │
│     return ResponseEntity.ok(result);                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/request/ZaloPayCallbackRequest.java                        │
├──────────────────────────────────────────────────────────────────────┤
│ Request từ ZaloPay:                                                  │
│ {                                                                    │
│     "data": "{\"app_id\":2553,\"app_trans_id\":\"260112_1_123456\"," │
│             "\"amount\":1050000,\"zp_trans_id\":260112000000389,"    │
│             "\"channel\":38,...}",                                   │
│     "mac": "d8d33baf449b31d7f9b94fa50d7c942c...",                    │
│     "type": 1                                                        │
│ }                                                                    │
│                                                                      │
│ → data: JSON string chứa thông tin giao dịch                         │
│ → mac: HMAC(key2, data) - dùng để verify                             │
│ → type: 1 = Order, 2 = Agreement                                     │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/PaymentService.java (dòng 133-191)                     │
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
│         // 1. XÁC THỰC CALLBACK (QUAN TRỌNG!)                        │
│         if (!zaloPayConfig.verifyCallback(dataStr, requestMac)) {    │
│             log.warn("Callback không hợp lệ - MAC không khớp");      │
│             result.put("return_code", -1);                           │
│             result.put("return_message", "mac not equal");           │
│             return result;                                           │
│         }                                                            │
│                                                                      │
│         // 2. Parse data                                             │
│         ZaloPayCallbackRequest.CallbackData callbackData =           │
│             objectMapper.readValue(dataStr, CallbackData.class);     │
│                                                                      │
│         String appTransId = callbackData.getAppTransId();            │
│                                                                      │
│         // 3. Tìm payment                                            │
│         Payment payment = paymentRepository                          │
│             .findByAppTransId(appTransId).orElse(null);              │
│                                                                      │
│         if (payment == null) {                                       │
│             result.put("return_code", 1);                            │
│             result.put("return_message", "success");                 │
│             return result;                                           │
│         }                                                            │
│                                                                      │
│         // 4. Kiểm tra đã xử lý chưa (tránh xử lý trùng)             │
│         if (payment.isPaid()) {                                      │
│             result.put("return_code", 2);    // Duplicate            │
│             result.put("return_message", "duplicate");               │
│             return result;                                           │
│         }                                                            │
│                                                                      │
│         // 5. CẬP NHẬT PAYMENT → PAID                                │
│         payment.markAsPaid(callbackData.getZpTransId(),              │
│                           callbackData.getChannel());                │
│         paymentRepository.save(payment);                             │
│                                                                      │
│         // 6. CẬP NHẬT JOB → OPEN (QUAN TRỌNG!)                      │
│         Job job = payment.getJob();                                  │
│         job.publish();     // DRAFT → OPEN                           │
│         jobRepository.save(job);                                     │
│                                                                      │
│         log.info("Thanh toán thành công: appTransId={}, jobId={}",   │
│                  appTransId, job.getId());                           │
│                                                                      │
│         result.put("return_code", 1);                                │
│         result.put("return_message", "success");                     │
│                                                                      │
│     } catch (Exception e) {                                          │
│         result.put("return_code", 0);   // Lỗi → ZaloPay retry       │
│         result.put("return_message", e.getMessage());                │
│     }                                                                │
│                                                                      │
│     return result;                                                   │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: config/ZaloPayConfig.java (dòng 50-54)                         │
├──────────────────────────────────────────────────────────────────────┤
│ // Xác thực callback từ ZaloPay                                      │
│ // mac = HMAC(key2, data)                                            │
│ public boolean verifyCallback(String data, String requestMac) {      │
│     String calculatedMac = hmacSHA256(key2, data);                   │
│     return calculatedMac.equals(requestMac);                         │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: entity/Job.java                                                │
├──────────────────────────────────────────────────────────────────────┤
│ public void publish() {                                              │
│     if (this.status != EJobStatus.DRAFT) {                           │
│         throw new IllegalStateException("Chỉ có thể publish job DRAFT");│
│     }                                                                │
│     this.status = EJobStatus.OPEN;                                   │
│     this.publishedAt = LocalDateTime.now();                          │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK (BẮT BUỘC trả 2XX để ZaloPay xác nhận đã nhận)
{
    "return_code": 1,
    "return_message": "success"
}

Return codes:
- 1: Thành công
- 2: Trùng (đã xử lý trước đó)
- -1: MAC không hợp lệ
- 0: Lỗi (ZaloPay sẽ callback lại tối đa 3 lần)
```

---

### GET /api/payments/query/{appTransId}
Truy vấn trạng thái thanh toán (dùng khi không nhận được callback)

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/PaymentController.java (dòng 63-69)                 │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/query/{appTransId}")                                   │
│ public ResponseEntity<ApiResponse<PaymentResponse>> queryPaymentStatus│
│     @PathVariable String appTransId,                                 │
│     @AuthenticationPrincipal UserDetailsImpl userDetails) {          │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         paymentService.queryPaymentStatus(appTransId,                │
│                                           userDetails.getId()));     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/PaymentService.java (dòng 193-228)                     │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<PaymentResponse> queryPaymentStatus(String appTransId,│
│                                                        Long userId) {│
│     Payment payment = paymentRepository.findByAppTransId(appTransId) │
│             .orElseThrow(() -> new RuntimeException("Không tìm thấy"));│
│                                                                      │
│     // Kiểm tra quyền                                                │
│     if (!payment.getUser().getId().equals(userId)) {                 │
│         throw new RuntimeException("Bạn không có quyền xem");        │
│     }                                                                │
│                                                                      │
│     // Nếu đang PENDING, query ZaloPay để cập nhật                   │
│     if (payment.isPending()) {                                       │
│         try {                                                        │
│             JsonNode queryResult = callZaloPayQuery(appTransId);     │
│             int returnCode = queryResult.get("return_code").asInt(); │
│                                                                      │
│             if (returnCode == 1) {                                   │
│                 // Thanh toán thành công                             │
│                 Long zpTransId = queryResult.get("zp_trans_id").asLong();│
│                 payment.markAsPaid(zpTransId, null);                 │
│                                                                      │
│                 // Publish job                                       │
│                 Job job = payment.getJob();                          │
│                 job.publish();                                       │
│                 jobRepository.save(job);                             │
│                                                                      │
│                 payment = paymentRepository.save(payment);           │
│             } else if (returnCode == 2) {                            │
│                 // Thất bại                                          │
│                 payment.markAsCancelled();                           │
│                 payment = paymentRepository.save(payment);           │
│             }                                                        │
│             // returnCode == 3: Đang xử lý, giữ PENDING              │
│                                                                      │
│         } catch (Exception e) {                                      │
│             log.error("Lỗi query ZaloPay", e);                       │
│         }                                                            │
│     }                                                                │
│                                                                      │
│     return ApiResponse.success("Thành công",                         │
│                                buildPaymentResponse(payment));       │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "data": {
        "appTransId": "260112_1_123456",
        "zpTransId": 260112000000389,
        "status": "PAID",
        "paymentChannel": 38,   ◄── 38 = ZaloPay Wallet
        "paidAt": "2026-01-12T16:05:00"
    }
}

ZaloPay return_code:
- 1: Thanh toán thành công
- 2: Thất bại
- 3: Đang xử lý / Chưa thanh toán
```

---

## 7.5 CHI TIẾT API - ADMIN PAYMENT

### GET /api/admin/payments/statistics
Lấy thống kê thanh toán tổng quan cho Admin Dashboard

```
Request + Cookie accessToken (ROLE_ADMIN)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/AdminPaymentController.java                         │
├──────────────────────────────────────────────────────────────────────┤
│ @PreAuthorize("hasRole('ADMIN')")                                    │
│ public class AdminPaymentController {                                │
│                                                                      │
│     @GetMapping("/statistics")                                       │
│     public ResponseEntity<ApiResponse<PaymentStatisticsResponse>>    │
│             getPaymentStatistics() {                                 │
│         return ResponseEntity.ok(                                    │
│             paymentService.getPaymentStatistics());                  │
│     }                                                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/PaymentService.java                                    │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<PaymentStatisticsResponse> getPaymentStatistics() │
│ {                                                                    │
│     BigDecimal totalRevenue = paymentRepository                      │
│         .sumTotalAmountByStatus(EPaymentStatus.PAID);                │
│     BigDecimal totalEscrowAmount = paymentRepository                 │
│         .sumEscrowAmountByStatus(EPaymentStatus.PAID);               │
│     BigDecimal totalFeeAmount = paymentRepository                    │
│         .sumFeeAmountByStatus(EPaymentStatus.PAID);                  │
│                                                                      │
│     Long totalTransactions = paymentRepository.count();              │
│     Long paidTransactions = paymentRepository                        │
│         .countByStatus(EPaymentStatus.PAID);                         │
│     Long pendingTransactions = paymentRepository                     │
│         .countByStatus(EPaymentStatus.PENDING);                      │
│     ...                                                              │
│                                                                      │
│     LocalDateTime startOfToday = LocalDate.now().atStartOfDay();     │
│     BigDecimal todayRevenue = paymentRepository                      │
│         .sumTotalAmountByStatusAndPaidAtAfter(PAID, startOfToday);   │
│                                                                      │
│     LocalDateTime startOfMonth = LocalDate.now()                     │
│         .withDayOfMonth(1).atStartOfDay();                           │
│     BigDecimal monthRevenue = paymentRepository                      │
│         .sumTotalAmountByStatusAndPaidAtAfter(PAID, startOfMonth);   │
│                                                                      │
│     return ApiResponse.success("...", statistics);                   │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: repository/PaymentRepository.java                              │
├──────────────────────────────────────────────────────────────────────┤
│ Long countByStatus(EPaymentStatus status);                           │
│                                                                      │
│ @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Payment p        │
│         WHERE p.status = :status")                                   │
│ BigDecimal sumTotalAmountByStatus(@Param("status") EPaymentStatus);  │
│                                                                      │
│ @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Payment p        │
│         WHERE p.status = :status AND p.paidAt >= :fromDate")         │
│ BigDecimal sumTotalAmountByStatusAndPaidAtAfter(                     │
│     @Param("status") EPaymentStatus,                                 │
│     @Param("fromDate") LocalDateTime);                               │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "data": {
        "totalRevenue": 15750000,
        "totalJobAmount": 15000000,
        "totalFeeAmount": 750000,
        "totalTransactions": 10,
        "paidTransactions": 5,
        "pendingTransactions": 3,
        "cancelledTransactions": 1,
        "expiredTransactions": 1,
        "todayRevenue": 5250000,
        "todayTransactions": 2,
        "monthRevenue": 15750000,
        "monthTransactions": 5
    }
}
```

---

### GET /api/admin/payments
Lấy danh sách tất cả thanh toán (phân trang, filter theo status)

```
Request + Cookie accessToken (ROLE_ADMIN)
GET /api/admin/payments?status=PAID&page=0&size=10
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/AdminPaymentController.java                         │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping                                                          │
│ public ResponseEntity<ApiResponse<Page<PaymentResponse>>>            │
│         getAllPayments(                                              │
│             @RequestParam(required = false) EPaymentStatus status,   │
│             @RequestParam(defaultValue = "0") int page,              │
│             @RequestParam(defaultValue = "10") int size) {           │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         paymentService.getAllPayments(status, page, size));          │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/PaymentService.java                                    │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<Page<PaymentResponse>> getAllPayments(            │
│         EPaymentStatus status, int page, int size) {                 │
│                                                                      │
│     Pageable pageable = PageRequest.of(page, size,                   │
│         Sort.by("createdAt").descending());                          │
│                                                                      │
│     Page<Payment> payments;                                          │
│     if (status != null) {                                            │
│         payments = paymentRepository                                 │
│             .findByStatusOrderByCreatedAtDesc(status, pageable);     │
│     } else {                                                         │
│         payments = paymentRepository                                 │
│             .findAllByOrderByCreatedAtDesc(pageable);                │
│     }                                                                │
│                                                                      │
│     Page<PaymentResponse> response = payments                        │
│         .map(this::buildPaymentResponse);                            │
│     return ApiResponse.success("Thành công", response);              │
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
                "appTransId": "260112_1_123456",
                "zpTransId": 260112000000389,
                "jobId": 1,
                "jobTitle": "Viết bài SEO...",
                "totalAmount": 5250000,
                "status": "PAID",
                "paidAt": "2026-01-12T16:05:00"
            }
        ],
        "totalPages": 1,
        "totalElements": 1
    }
}
```

---

### GET /api/admin/payments/search
Tìm kiếm thanh toán theo appTransId hoặc tên job

```
Request + Cookie accessToken (ROLE_ADMIN)
GET /api/admin/payments/search?keyword=260112&page=0&size=10
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/AdminPaymentController.java                         │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/search")                                               │
│ public ResponseEntity<ApiResponse<Page<PaymentResponse>>>            │
│         searchPayments(                                              │
│             @RequestParam String keyword,                            │
│             @RequestParam(defaultValue = "0") int page,              │
│             @RequestParam(defaultValue = "10") int size) {           │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         paymentService.searchPayments(keyword, page, size));         │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: repository/PaymentRepository.java                              │
├──────────────────────────────────────────────────────────────────────┤
│ @Query("SELECT p FROM Payment p                                      │
│         WHERE p.appTransId LIKE %:keyword%                           │
│         OR p.job.title LIKE %:keyword%                               │
│         ORDER BY p.createdAt DESC")                                  │
│ Page<Payment> searchByKeyword(                                       │
│     @Param("keyword") String keyword, Pageable pageable);            │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK (danh sách payments matching keyword)
```

---

### GET /api/admin/payments/recent
Lấy 10 giao dịch thành công gần nhất (cho Dashboard)

```
Request + Cookie accessToken (ROLE_ADMIN)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/AdminPaymentController.java                         │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/recent")                                               │
│ public ResponseEntity<ApiResponse<List<PaymentResponse>>>            │
│         getRecentPayments() {                                        │
│     return ResponseEntity.ok(                                        │
│         paymentService.getRecentPaidPayments());                     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: repository/PaymentRepository.java                              │
├──────────────────────────────────────────────────────────────────────┤
│ List<Payment> findTop10ByStatusOrderByPaidAtDesc(EPaymentStatus);    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "data": [
        { "appTransId": "...", "status": "PAID", "paidAt": "..." },
        { "appTransId": "...", "status": "PAID", "paidAt": "..." },
        ...
    ]
}
```

---

## 7.6 CHI TIẾT API - JOB APPLICATION

### POST /api/jobs/{id}/apply
Ứng tuyển vào job (chỉ FREELANCER, tốn 1 credit)

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/{id}/apply")                                          │
│ public ResponseEntity<ApiResponse<JobApplicationResponse>> applyJob( │
│     @PathVariable Long id,                                           │
│     @AuthenticationPrincipal UserDetailsImpl userDetails,            │
│     @RequestBody(required = false) ApplyJobRequest req) {            │
│                                                                      │
│     ApiResponse<JobApplicationResponse> response =                   │
│         jobService.applyJob(id, userDetails.getId(), req);           │
│     return ResponseEntity.status(HttpStatus.CREATED).body(response); │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/request/ApplyJobRequest.java                               │
├──────────────────────────────────────────────────────────────────────┤
│ @Data                                                                │
│ public class ApplyJobRequest {                                       │
│     private String coverLetter;   // Thư giới thiệu (optional)       │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java                                        │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<JobApplicationResponse> applyJob(Long jobId,      │
│                         Long userId, ApplyJobRequest req) {          │
│                                                                      │
│     User user = userService.getById(userId);                         │
│                                                                      │
│     // 1. Kiểm tra role FREELANCER                                   │
│     if (!user.hasRole(ERole.ROLE_FREELANCER)) {                      │
│         throw new IllegalStateException(                             │
│             "Chỉ freelancer mới được ứng tuyển");                    │
│     }                                                                │
│                                                                      │
│     Job job = getById(jobId);                                        │
│                                                                      │
│     // 2. Kiểm tra không phải owner của job                          │
│     if (job.isOwnedBy(userId)) {                                     │
│         throw new IllegalStateException(                             │
│             "Bạn không thể ứng tuyển vào job của chính mình");       │
│     }                                                                │
│                                                                      │
│     // 3. Kiểm tra job status = OPEN                                 │
│     if (job.getStatus() != EJobStatus.OPEN) {                        │
│         throw new IllegalStateException(                             │
│             "Job này không còn nhận đơn ứng tuyển");                 │
│     }                                                                │
│                                                                      │
│     // 4. Kiểm tra chưa apply job này                                │
│     if (applicationRepository.existsByJobIdAndFreelancerId(          │
│             jobId, userId)) {                                        │
│         throw new IllegalStateException(                             │
│             "Bạn đã ứng tuyển vào job này rồi");                     │
│     }                                                                │
│                                                                      │
│     // 5. Kiểm tra có bank info                                      │
│     if (!user.hasBankInfo()) {                                       │
│         throw new IllegalStateException(                             │
│             "Vui lòng cập nhật thông tin ngân hàng trước khi apply");│
│     }                                                                │
│                                                                      │
│     // 6. Kiểm tra đủ credit                                         │
│     if (!user.hasEnoughCredits(1)) {                                 │
│         throw new IllegalStateException(                             │
│             "Bạn không đủ credit. Vui lòng mua thêm credit.");       │
│     }                                                                │
│                                                                      │
│     // 7. Trừ credit                                                 │
│     user.deductCredits(1);                                           │
│     userService.save(user);                                          │
│                                                                      │
│     // 8. Tạo application                                            │
│     JobApplication application = JobApplication.builder()            │
│         .job(job)                                                    │
│         .freelancer(user)                                            │
│         .coverLetter(req != null ? req.getCoverLetter() : null)      │
│         .status(EApplicationStatus.PENDING)                          │
│         .build();                                                    │
│                                                                      │
│     // 9. Tăng application count                                     │
│     job.incrementApplicationCount();                                 │
│     jobRepository.save(job);                                         │
│                                                                      │
│     JobApplication saved = applicationRepository.save(application);  │
│     return ApiResponse.success("Ứng tuyển thành công",               │
│                                buildApplicationResponse(saved));     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 201 Created
{
    "status": "SUCCESS",
    "message": "Ứng tuyển thành công",
    "data": {
        "id": 1,
        "jobId": 5,
        "jobTitle": "Viết bài SEO...",
        "coverLetter": "Tôi có 3 năm kinh nghiệm...",
        "status": "PENDING",
        "freelancer": {
            "id": 2,
            "fullName": "Nguyen Van B",
            "avatarUrl": "https://...",
            "phoneNumber": "0901234567",
            "bio": "Freelancer content writer",
            "skills": ["SEO", "Content Writing"]
        },
        "createdAt": "2026-01-12T10:00:00"
    }
}

Errors:
- 400: "Chỉ freelancer mới được ứng tuyển"
- 400: "Bạn không thể ứng tuyển vào job của chính mình"
- 400: "Job này không còn nhận đơn ứng tuyển"
- 400: "Bạn đã ứng tuyển vào job này rồi"
- 400: "Vui lòng cập nhật thông tin ngân hàng trước khi apply"
- 400: "Bạn không đủ credit. Vui lòng mua thêm credit."
```

---

### GET /api/jobs/my-applications
Lấy danh sách đơn ứng tuyển của tôi

```
Request + Cookie accessToken
GET /api/jobs/my-applications?status=PENDING&page=0&size=10
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/my-applications")                                      │
│ public ResponseEntity<ApiResponse<Page<JobApplicationResponse>>>    │
│         getMyApplications(                                           │
│             @AuthenticationPrincipal UserDetailsImpl userDetails,    │
│             @RequestParam(required = false) EApplicationStatus status,│
│             @RequestParam(defaultValue = "0") int page,              │
│             @RequestParam(defaultValue = "10") int size) {           │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         jobService.getMyApplications(userDetails.getId(),            │
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
                "jobId": 5,
                "jobTitle": "Viết bài SEO...",
                "status": "PENDING",
                "createdAt": "2026-01-12T10:00:00"
            },
            {
                "id": 2,
                "jobId": 8,
                "jobTitle": "Thiết kế logo...",
                "status": "ACCEPTED",
                "createdAt": "2026-01-11T15:30:00"
            }
        ],
        "totalPages": 1,
        "totalElements": 2
    }
}

Query params:
- status: PENDING, ACCEPTED, REJECTED, WITHDRAWN
```

---

### DELETE /api/jobs/applications/{applicationId}
Rút đơn ứng tuyển (chỉ được rút khi status = PENDING)

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @DeleteMapping("/applications/{applicationId}")                      │
│ public ResponseEntity<ApiResponse<Void>> withdrawApplication(        │
│     @PathVariable Long applicationId,                                │
│     @AuthenticationPrincipal UserDetailsImpl userDetails) {          │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         jobService.withdrawApplication(applicationId,                │
│                                        userDetails.getId()));        │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java                                        │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<Void> withdrawApplication(Long applicationId,     │
│                                              Long userId) {          │
│     JobApplication application = applicationRepository               │
│         .findById(applicationId)                                     │
│         .orElseThrow(() -> new RuntimeException("Không tìm thấy"));  │
│                                                                      │
│     // Kiểm tra quyền sở hữu                                         │
│     if (!application.isOwnedBy(userId)) {                            │
│         throw new UnauthorizedAccessException(                       │
│             "Bạn không có quyền rút đơn này");                       │
│     }                                                                │
│                                                                      │
│     // Chỉ được rút khi đang PENDING                                 │
│     if (!application.isPending()) {                                  │
│         throw new IllegalStateException(                             │
│             "Chỉ có thể rút đơn khi đang chờ xử lý");                │
│     }                                                                │
│                                                                      │
│     application.withdraw();  // status = WITHDRAWN                   │
│     applicationRepository.save(application);                         │
│                                                                      │
│     return ApiResponse.success("Đã rút đơn ứng tuyển");              │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Đã rút đơn ứng tuyển"
}

Errors:
- 403: "Bạn không có quyền rút đơn này"
- 400: "Chỉ có thể rút đơn khi đang chờ xử lý"
```

---

### GET /api/jobs/{id}/applications
Poster xem danh sách đơn ứng tuyển của job

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/{id}/applications")                                    │
│ public ResponseEntity<ApiResponse<List<JobApplicationResponse>>>     │
│         getJobApplications(                                          │
│             @PathVariable Long id,                                   │
│             @AuthenticationPrincipal UserDetailsImpl userDetails) {  │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         jobService.getJobApplications(id, userDetails.getId()));     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java                                        │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<List<JobApplicationResponse>> getJobApplications( │
│         Long jobId, Long userId) {                                   │
│     Job job = jobRepository.findById(jobId)                          │
│         .orElseThrow(() -> new JobNotFoundException(jobId));         │
│                                                                      │
│     if (!job.isOwnedBy(userId)) {                                    │
│         throw new UnauthorizedAccessException(                       │
│             "Bạn không có quyền xem đơn ứng tuyển của job này");     │
│     }                                                                │
│                                                                      │
│     List<JobApplication> applications =                              │
│         jobApplicationRepository.findByJobIdOrderByCreatedAtDesc(jobId);│
│     List<JobApplicationResponse> responses = applications.stream()   │
│         .map(this::buildApplicationResponse)                         │
│         .toList();                                                   │
│                                                                      │
│     return ApiResponse.success("Thành công", responses);             │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

### PUT /api/jobs/applications/{applicationId}/accept
Duyệt đơn ứng tuyển (poster). Khi duyệt 1 đơn, **tất cả đơn khác đang PENDING của job đó sẽ bị tự động REJECT**.

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @PutMapping("/applications/{applicationId}/accept")                  │
│ public ResponseEntity<ApiResponse<JobApplicationResponse>>           │
│         acceptApplication(                                           │
│             @PathVariable Long applicationId,                        │
│             @AuthenticationPrincipal UserDetailsImpl userDetails) {  │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         jobService.acceptApplication(applicationId,                  │
│                                       userDetails.getId()));         │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java                                        │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<JobApplicationResponse>                           │
│         acceptApplication(Long applicationId, Long userId) {         │
│     JobApplication application = jobApplicationRepository            │
│         .findById(applicationId)                                     │
│         .orElseThrow(() ->                                           │
│             new IllegalArgumentException("Không tìm thấy đơn"));     │
│                                                                      │
│     if (!application.isJobOwnedBy(userId)) {                         │
│         throw new UnauthorizedAccessException(                       │
│             "Bạn không có quyền duyệt đơn này");                     │
│     }                                                                │
│     if (!application.isPending()) {                                  │
│         throw new IllegalStateException(                             │
│             "Chỉ có thể duyệt đơn đang chờ xử lý");                  │
│     }                                                                │
│                                                                      │
│     // Duyệt đơn này                                                 │
│     application.accept();                                            │
│     jobApplicationRepository.save(application);                      │
│                                                                      │
│     // AUTO reject các đơn PENDING khác của job                      │
│     Long jobId = application.getJob().getId();                       │
│     List<JobApplication> otherPending = jobApplicationRepository     │
│         .findByJobIdAndStatusAndIdNot(jobId,                         │
│                 EApplicationStatus.PENDING, applicationId);          │
│     for (JobApplication other : otherPending) {                      │
│         other.reject();                                              │
│     }                                                                │
│     jobApplicationRepository.saveAll(otherPending);                  │
│                                                                      │
│     return ApiResponse.success(                                      │
│         otherPending.isEmpty()                                       │
│             ? "Đã duyệt đơn ứng tuyển"                               │
│             : "Đã duyệt đơn và từ chối " + otherPending.size()       │
│                 + " đơn khác",                                       │
│         buildApplicationResponse(application));                      │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

Lỗi thường gặp:
- 403: "Bạn không có quyền duyệt đơn này"
- 400: "Chỉ có thể duyệt đơn đang chờ xử lý"

---

### PUT /api/jobs/applications/{applicationId}/reject
Từ chối đơn ứng tuyển (poster)

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @PutMapping("/applications/{applicationId}/reject")                  │
│ public ResponseEntity<ApiResponse<JobApplicationResponse>>           │
│         rejectApplication(                                           │
│             @PathVariable Long applicationId,                        │
│             @AuthenticationPrincipal UserDetailsImpl userDetails) {  │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         jobService.rejectApplication(applicationId,                  │
│                                        userDetails.getId()));        │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java                                        │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<JobApplicationResponse>                           │
│         rejectApplication(Long applicationId, Long userId) {         │
│     JobApplication application = jobApplicationRepository            │
│         .findById(applicationId)                                     │
│         .orElseThrow(() -> new IllegalArgumentException(             │
│             "Không tìm thấy đơn ứng tuyển"));                        │
│                                                                      │
│     if (!application.isJobOwnedBy(userId)) {                         │
│         throw new UnauthorizedAccessException(                       │
│             "Bạn không có quyền từ chối đơn này");                   │
│     }                                                                │
│     if (!application.isPending()) {                                  │
│         throw new IllegalStateException(                             │
│             "Chỉ có thể từ chối đơn đang chờ xử lý");                │
│     }                                                                │
│                                                                      │
│     application.reject();                                            │
│     jobApplicationRepository.save(application);                      │
│                                                                      │
│     return ApiResponse.success(                                      │
│         "Đã từ chối đơn ứng tuyển",                                  │
│         buildApplicationResponse(application));                      │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

Lỗi thường gặp:
- 403: "Bạn không có quyền từ chối đơn này"
- 400: "Chỉ có thể từ chối đơn đang chờ xử lý"

---

### Application Status Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    APPLICATION STATUS TRANSITIONS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌─────────┐                                    │
│                              │ PENDING │ ◄── POST /api/jobs/{id}/apply      │
│                              └────┬────┘                                    │
│                                   │                                         │
│           ┌───────────────────────┼───────────────────────┐                 │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│    ┌─────────────┐         ┌───────────┐         ┌───────────────┐         │
│    │  WITHDRAWN  │         │ ACCEPTED  │         │   REJECTED    │         │
│    │(Freelancer) │         │ (Poster)  │         │   (Poster)    │         │
│    └─────────────┘         └───────────┘         └───────────────┘         │
│                                                                             │
│   Lưu ý:                                                                    │
│   - WITHDRAWN: Freelancer tự rút đơn                                        │
│   - ACCEPTED/REJECTED: Job poster quyết định                                │
│   - Credit KHÔNG được hoàn khi rút đơn                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Freelancer Info Visibility (Privacy)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              FREELANCER INFO TRONG APPLICATION RESPONSE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Khi job poster xem đơn ứng tuyển, họ CHỈ thấy các thông tin:             │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ FreelancerResponse (Limited Fields)                                 │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │ - id          : Long                                                │   │
│   │ - fullName    : String        ◄── Tên đầy đủ                        │   │
│   │ - avatarUrl   : String        ◄── Ảnh đại diện                      │   │
│   │ - phoneNumber : String        ◄── Số điện thoại                     │   │
│   │ - bio         : String        ◄── Giới thiệu bản thân               │   │
│   │ - skills      : Set<String>   ◄── Kỹ năng                           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   KHÔNG hiển thị:                                                           │
│   - email                                                                   │
│   - bankAccountNumber                                                       │
│   - bankName                                                                │
│   - credits                                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 8.4 ADMIN JOB APPROVAL APIs

#### GET /api/jobs/admin/pending - Danh sách jobs chờ duyệt
```http
GET http://localhost:8080/api/jobs/admin/pending?page=0&size=10
Authorization: Bearer <admin_access_token>
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "message": "Lấy danh sách jobs chờ duyệt thành công",
    "data": {
        "content": [
            {
                "id": 1,
                "title": "Viết bài SEO cho website du lịch",
                "status": "PENDING_APPROVAL",
                "budget": 1000000,
                "escrowAmount": 1050000,
                "employer": { "id": 2, "fullName": "ABC Company" },
                "createdAt": "2026-01-13T10:00:00"
            }
        ],
        "totalElements": 1,
        "totalPages": 1
    }
}
```

---

#### PUT /api/jobs/admin/{id}/approve - Duyệt job
```http
PUT http://localhost:8080/api/jobs/admin/1/approve
Authorization: Bearer <admin_access_token>
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "message": "Đã duyệt job thành công",
    "data": {
        "id": 1,
        "title": "Viết bài SEO cho website du lịch",
        "status": "OPEN",
        "budget": 1000000,
        "escrowAmount": 1050000,
        ...
    }
}
```

---

#### PUT /api/jobs/admin/{id}/reject - Từ chối job (hoàn tiền)
```http
PUT http://localhost:8080/api/jobs/admin/1/reject
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
    "reason": "Nội dung không phù hợp với quy định"
}
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "message": "Đã từ chối job và hoàn 1050000 VND cho employer",
    "data": {
        "id": 1,
        "title": "Viết bài SEO cho website du lịch",
        "status": "REJECTED",
        "rejectionReason": "Nội dung không phù hợp với quy định",
        "budget": 1000000,
        "escrowAmount": 1050000,
        ...
    }
}
```

---

#### GET /api/jobs/admin/count/pending - Đếm jobs chờ duyệt
```http
GET http://localhost:8080/api/jobs/admin/count/pending
Authorization: Bearer <admin_access_token>
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "message": "Thành công",
    "data": 5
}
```

---

### 8.5 TEST FLOW HOÀN CHỈNH

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLOW TEST ĐĂNG JOB (ADMIN APPROVAL)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. POST /api/auth/login          → Lấy accessToken (EMPLOYER)              │
│                                                                             │
│  2. POST /api/jobs                → Tạo Job (PENDING_APPROVAL)              │
│     Body: { title, description, budget: 1000000, ... }                      │
│     Response: { id: 1, status: "PENDING_APPROVAL", escrowAmount: 1050000 }  │
│     → Employer balance bị trừ 1,050,000 (1tr + 5% phí)                      │
│                                                                             │
│  3. GET /api/jobs/my-jobs         → Kiểm tra job PENDING_APPROVAL           │
│                                                                             │
│  ─────────── ADMIN LOGIN ───────────                                        │
│                                                                             │
│  4. POST /api/auth/login          → Lấy accessToken (ADMIN)                 │
│                                                                             │
│  5. GET /api/jobs/admin/pending   → Xem danh sách jobs chờ duyệt            │
│                                                                             │
│  6a. PUT /api/jobs/admin/1/approve → DUYỆT                                  │
│      → Job status = OPEN                                                    │
│      → Job xuất hiện trong danh sách công khai                              │
│                                                                             │
│  6b. PUT /api/jobs/admin/1/reject  → TỪ CHỐI                                │
│      Body: { reason: "Lý do từ chối" }                                      │
│      → Job status = REJECTED                                                │
│      → Hoàn escrowAmount (1,050,000) về balance employer                    │
│                                                                             │
│  7. GET /api/jobs                 → Job OPEN xuất hiện, REJECTED không      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLOW TEST TỪ CHỐI + HOÀN TIỀN                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Trước khi tạo job:                                                         │
│  - Employer balance = 5,000,000 VND                                         │
│                                                                             │
│  1. POST /api/jobs (budget: 1,000,000)                                      │
│     → escrowAmount = 1,050,000 (budget + 5% fee)                            │
│     → Employer balance = 3,950,000 VND                                      │
│                                                                             │
│  2. PUT /api/jobs/admin/1/reject                                            │
│     → Hoàn escrowAmount = 1,050,000                                         │
│     → Employer balance = 5,000,000 VND (về như ban đầu)                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLOW TEST ỨNG TUYỂN JOB                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  === CHUẨN BỊ (Freelancer) ===                                              │
│                                                                             │
│  1. POST /api/auth/login          → Đăng nhập (nhận daily credit)           │
│     Response: { user: { credits: 30 } }                                     │
│                                                                             │
│  2. PUT /api/users/me             → Cập nhật bank info (bắt buộc)           │
│     Body: { bankAccountNumber: "...", bankName: "..." }                     │
│     Response: { hasBankInfo: true }                                         │
│                                                                             │
│  === ỨNG TUYỂN ===                                                          │
│                                                                             │
│  3. GET /api/jobs                 → Xem danh sách jobs OPEN                 │
│                                                                             │
│  4. GET /api/jobs/5               → Xem chi tiết job                        │
│                                                                             │
│  5. POST /api/jobs/5/apply        → Ứng tuyển (tốn 1 credit)                │
│     Body: { coverLetter: "..." }                                            │
│     Response: { status: "PENDING" }                                         │
│     → credits: 30 - 1 = 29                                                  │
│                                                                             │
│  6. GET /api/jobs/my-applications → Xem đơn của tôi                         │
│     Response: { content: [{ jobId: 5, status: "PENDING" }] }                │
│                                                                             │
│  === RÚT ĐƠN (nếu muốn) ===                                                 │
│                                                                             │
│  7. DELETE /api/jobs/applications/1 → Rút đơn                               │
│     Response: "Đã rút đơn ứng tuyển"                                        │
│     → status = WITHDRAWN                                                    │
│     → Credit KHÔNG được hoàn                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---



### SecurityConfig
```
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: config/SecurityConfig.java                                     │
├──────────────────────────────────────────────────────────────────────┤
│ .authorizeHttpRequests(auth -> auth                                  │
│     .requestMatchers(GET, "/api/jobs").permitAll()                   │
│     .requestMatchers(GET, "/api/jobs/{id}").permitAll()              │
│     .requestMatchers(GET, "/api/jobs/search").permitAll()            │
│     .requestMatchers(GET, "/api/jobs/by-skills").permitAll()         │
│     .requestMatchers(POST, "/api/payments/callback").permitAll()     │
│     .requestMatchers("/api/admin/**").hasRole("ADMIN")               │
│     .anyRequest().authenticated()                                    │
│ )                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

---

## 11. APPLICATION STATUS ENUM

```
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: entity/EApplicationStatus.java                                 │
├──────────────────────────────────────────────────────────────────────┤
│ public enum EApplicationStatus {                                     │
│     PENDING,      // Chờ xử lý (mới apply)                           │
│     ACCEPTED,     // Đã chấp nhận (poster duyệt)                     │
│     REJECTED,     // Đã từ chối (poster từ chối)                     │
│     WITHDRAWN     // Đã rút đơn (freelancer rút)                     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 12. PAYMENT STATUS FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT STATUS FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌─────────┐                                   │
│                              │ PENDING │ ◄── Tạo payment                   │
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
│                                  │ Hủy job                                 │
│                                  ▼                                         │
│                           ┌─────────────┐                                  │
│                           │  REFUNDED   │ ← Hoàn escrow                    │
│                           │ (Hoàn tiền) │   (Admin giữ fee)                │
│                           └─────────────┘   → Job = CLOSED                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Refund khi Delete Job

```
DELETE /api/jobs/{id}
         │
         │ Nếu có payment PAID
         ▼
┌─────────────────────────────────────┐
│ 1. Tự động gọi ZaloPay refund       │
│ 2. Hoàn escrowAmount cho user       │
│ 3. Xóa payment record               │
│ 4. Xóa job                          │
└─────────────────────────────────────┘
```

### Chính sách hoàn tiền

| Trạng thái | escrowAmount | feeAmount | Ghi chú |
|------------|--------------|-----------|---------|
| Delete job (PAID) | ✅ Hoàn | ❌ Giữ | Tự động refund khi xóa |
| PAID → COMPLETED | → Freelancer | ❌ Giữ | Job hoàn thành |
