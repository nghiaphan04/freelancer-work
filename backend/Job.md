# WorkHub - Job & Payment System Documentation

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
│   │ status (ENUM)                   │◄── DRAFT/OPEN/IN_PROGRESS/...         │
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
│                                  │ job_amount (DECIMAL)  ◄── Ngân sách │   │
│                                  │ fee_amount (DECIMAL)  ◄── Phí 5%    │   │
│                                  │ total_amount (DECIMAL)◄── Tổng      │   │
│                                  │ order_url (VARCHAR)   ◄── Link TT   │   │
│                                  │ qr_code (TEXT)        ◄── Mã QR     │   │
│                                  │ status (ENUM)         ◄── PENDING/  │   │
│                                  │                          PAID/...   │   │
│                                  │ payment_channel (INT) ◄── Kênh TT   │   │
│                                  │ paid_at (DATETIME)                  │   │
│                                  │ expired_at (DATETIME)               │   │
│                                  └─────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. PROJECT STRUCTURE

```
backend/src/main/java/com/workhub/api/
├── controller/
│   ├── JobController.java              # /api/jobs/*
│   └── PaymentController.java          # /api/payments/*
│
├── service/
│   ├── JobService.java                 # Xử lý logic job
│   └── PaymentService.java             # Xử lý thanh toán + ZaloPay
│
├── repository/
│   ├── JobRepository.java              # Truy vấn jobs
│   └── PaymentRepository.java          # Truy vấn payments
│
├── entity/
│   ├── Job.java                        # Entity job
│   ├── Payment.java                    # Entity thanh toán
│   ├── EJobComplexity.java             # ENTRY/INTERMEDIATE/EXPERT
│   ├── EJobDuration.java               # SHORT/MEDIUM/LONG_TERM
│   ├── EWorkType.java                  # PART_TIME/FULL_TIME
│   ├── EJobStatus.java                 # DRAFT/OPEN/IN_PROGRESS/...
│   └── EPaymentStatus.java             # PENDING/PAID/CANCELLED/EXPIRED
│
├── dto/
│   ├── request/
│   │   ├── CreateJobRequest.java
│   │   ├── UpdateJobRequest.java
│   │   └── ZaloPayCallbackRequest.java
│   └── response/
│       ├── JobResponse.java
│       └── PaymentResponse.java
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

### 4.2 Job Status Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    JOB STATUS TRANSITIONS (VỚI ZALOPAY)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌─────────┐                                    │
│                              │  DRAFT  │ ◄── POST /api/jobs                 │
│                              └────┬────┘                                    │
│                                   │                                         │
│                    POST /api/payments/jobs/{id}                             │
│                                   │                                         │
│                                   ▼                                         │
│                         ┌─────────────────┐                                 │
│                         │ PAYMENT PENDING │                                 │
│                         └────────┬────────┘                                 │
│                                  │                                          │
│                    ZaloPay Callback (thanh toán thành công)                 │
│                                  │                                          │
│                                  ▼                                          │
│   ┌─────────┐              ┌─────────┐                                      │
│   │CANCELLED│◄─────────────│  OPEN   │ ◄── Đang tuyển dụng                  │
│   └─────────┘              └────┬────┘                                      │
│                                 │                                           │
│                                 ▼                                           │
│                          ┌─────────────┐                                    │
│                          │ IN_PROGRESS │                                    │
│                          └──────┬──────┘                                    │
│                                 │                                           │
│                                 ▼                                           │
│                          ┌─────────────┐                                    │
│                          │  COMPLETED  │                                    │
│                          └─────────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. API ENDPOINTS

### Job Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/jobs` | Tạo job mới (DRAFT) | ✅ |
| `GET` | `/api/jobs` | Danh sách jobs OPEN | ❌ |
| `GET` | `/api/jobs/{id}` | Chi tiết job | ❌ |
| `GET` | `/api/jobs/my-jobs` | Jobs của tôi | ✅ |
| `GET` | `/api/jobs/search` | Tìm kiếm | ❌ |
| `GET` | `/api/jobs/by-skills` | Tìm theo skill | ❌ |
| `PUT` | `/api/jobs/{id}` | Cập nhật | ✅ Owner |
| `PATCH` | `/api/jobs/{id}/close` | Đóng tin | ✅ Owner |
| `DELETE` | `/api/jobs/{id}` | Xóa | ✅ Owner/Admin |

### Payment Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/payments/jobs/{jobId}` | Tạo đơn thanh toán | ✅ Owner |
| `POST` | `/api/payments/callback` | Callback ZaloPay | ❌ |
| `GET` | `/api/payments/query/{appTransId}` | Truy vấn trạng thái | ✅ |
| `GET` | `/api/payments/jobs/{jobId}` | Thanh toán của job | ✅ Owner |
| `GET` | `/api/payments/my-payments` | Danh sách thanh toán | ✅ |

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
│     // 2. Tạo Job entity                                             │
│     Job job = Job.builder()                                          │
│             .title(req.getTitle())                                   │
│             .description(req.getDescription())                       │
│             .context(req.getContext())                               │
│             .requirements(req.getRequirements())                     │
│             .deliverables(req.getDeliverables())                     │
│             .skills(req.getSkills() != null ? req.getSkills()        │
│                                             : new HashSet<>())       │
│             .complexity(req.getComplexity() != null                  │
│                         ? req.getComplexity()                        │
│                         : EJobComplexity.INTERMEDIATE)               │
│             .duration(req.getDuration())                             │
│             .workType(req.getWorkType())                             │
│             .budget(req.getBudget())                                 │
│             .currency(req.getCurrency() != null                      │
│                       ? req.getCurrency() : "VND")                   │
│             .applicationDeadline(req.getApplicationDeadline())       │
│             .expectedStartDate(req.getExpectedStartDate())           │
│             .status(EJobStatus.DRAFT)   ◄── LUÔN LÀ DRAFT            │
│             .employer(employer)                                      │
│             .build();                                                │
│                                                                      │
│     // 3. Lưu vào PostgreSQL                                         │
│     Job savedJob = jobRepository.save(job);                          │
│                                                                      │
│     return ApiResponse.success(                                      │
│         "Tạo job thành công. Vui lòng thanh toán để đăng tin.",      │
│         buildJobResponse(savedJob));                                 │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 201 Created
{
    "status": "SUCCESS",
    "message": "Tạo job thành công. Vui lòng thanh toán để đăng tin.",
    "data": {
        "id": 1,
        "title": "Viết bài SEO cho website du lịch",
        "status": "DRAFT",  ◄── Cần thanh toán mới chuyển OPEN
        "budget": 1000000,
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
│ FILE: service/JobService.java (dòng 153-164)                         │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<Void> deleteJob(Long jobId, Long userId) {        │
│     Job job = getById(jobId);                                        │
│     User user = userService.getById(userId);                         │
│                                                                      │
│     // CHECK QUYỀN: Owner HOẶC Admin                                 │
│     if (!job.isOwnedBy(userId) && !user.isAdmin()) {                 │
│         throw new UnauthorizedAccessException(                       │
│             "Bạn không có quyền xóa job này");                       │
│     }                                                                │
│                                                                      │
│     jobRepository.delete(job);                                       │
│     return ApiResponse.success("Xóa job thành công");                │
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

## 8. POSTMAN TEST

### 8.0 Đăng nhập (Lấy Token)
```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "Password123!"
}
```

**Response:** Cookie `accessToken` được set tự động

---

### 8.1 JOB APIs

#### POST /api/jobs - Tạo Job (DRAFT)
```http
POST http://localhost:8080/api/jobs
Cookie: accessToken=eyJ...
Content-Type: application/json

{
    "title": "Viết bài SEO cho website du lịch",
    "description": "Cần freelancer viết 10 bài blog về du lịch Việt Nam, mỗi bài 1500-2000 từ, chuẩn SEO on-page.",
    "context": "Công ty du lịch ABC đang mở rộng thị trường online",
    "requirements": "- Có kinh nghiệm viết content du lịch\n- Biết SEO cơ bản\n- Nộp bài đúng deadline",
    "deliverables": "- 10 bài viết format Word/Google Docs\n- Ảnh minh họa kèm theo",
    "skills": ["SEO", "Content Writing", "Travel"],
    "complexity": "INTERMEDIATE",
    "duration": "SHORT_TERM",
    "workType": "PART_TIME",
    "budget": 5000000,
    "currency": "VND",
    "applicationDeadline": "2026-02-01T23:59:59",
    "expectedStartDate": "2026-02-05T09:00:00"
}
```

**Response: 201 Created**
```json
{
    "status": "SUCCESS",
    "message": "Tạo job thành công. Vui lòng thanh toán để đăng tin.",
    "data": {
        "id": 1,
        "title": "Viết bài SEO cho website du lịch",
        "status": "DRAFT",
        "budget": 5000000,
        ...
    }
}
```

---

#### GET /api/jobs - Danh sách Jobs OPEN (Public)
```http
GET http://localhost:8080/api/jobs?page=0&size=10&sortBy=createdAt&sortDir=desc
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "data": {
        "content": [
            {
                "id": 1,
                "title": "Viết bài SEO...",
                "status": "OPEN",
                "budget": 5000000,
                "viewCount": 15,
                "employer": {
                    "id": 1,
                    "fullName": "Nguyen Van A"
                }
            }
        ],
        "totalPages": 1,
        "totalElements": 1,
        "number": 0,
        "size": 10
    }
}
```

---

#### GET /api/jobs/{id} - Chi tiết Job (Public)
```http
GET http://localhost:8080/api/jobs/1
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "data": {
        "id": 1,
        "title": "Viết bài SEO cho website du lịch",
        "description": "Cần freelancer viết 10 bài blog...",
        "context": "Công ty du lịch ABC...",
        "requirements": "- Có kinh nghiệm...",
        "deliverables": "- 10 bài viết...",
        "skills": ["SEO", "Content Writing", "Travel"],
        "complexity": "INTERMEDIATE",
        "duration": "SHORT_TERM",
        "workType": "PART_TIME",
        "budget": 5000000,
        "currency": "VND",
        "status": "OPEN",
        "viewCount": 16,
        "applicationCount": 0,
        "employer": {
            "id": 1,
            "fullName": "Nguyen Van A",
            "avatarUrl": null,
            "isVerified": false
        },
        "createdAt": "2026-01-12T10:00:00",
        "updatedAt": "2026-01-12T10:00:00"
    }
}
```

---

#### GET /api/jobs/my-jobs - Jobs của tôi (Auth)
```http
GET http://localhost:8080/api/jobs/my-jobs?status=DRAFT&page=0&size=10
Cookie: accessToken=eyJ...
```

**Query params:**
- `status` (optional): `DRAFT`, `OPEN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- `page`: 0, 1, 2...
- `size`: 10, 20...
- `sortBy`: `createdAt`, `budget`, `title`
- `sortDir`: `asc`, `desc`

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "data": {
        "content": [
            { "id": 1, "status": "DRAFT", ... },
            { "id": 2, "status": "DRAFT", ... }
        ],
        "totalElements": 2
    }
}
```

---

#### GET /api/jobs/search - Tìm kiếm (Public)
```http
GET http://localhost:8080/api/jobs/search?keyword=SEO&page=0&size=10
```

**Response: 200 OK** - Tìm trong title, description

---

#### GET /api/jobs/by-skills - Tìm theo kỹ năng (Public)
```http
GET http://localhost:8080/api/jobs/by-skills?skills=SEO&skills=Content&page=0&size=10
```

**Response: 200 OK** - Jobs có chứa ít nhất 1 skill

---

#### PUT /api/jobs/{id} - Cập nhật Job (Owner)
```http
PUT http://localhost:8080/api/jobs/1
Cookie: accessToken=eyJ...
Content-Type: application/json

{
    "title": "Viết bài SEO cho website du lịch (Updated)",
    "budget": 6000000,
    "skills": ["SEO", "Content Writing", "Travel", "Vietnamese"]
}
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "message": "Cập nhật job thành công",
    "data": { ... }
}
```

---

#### PATCH /api/jobs/{id}/close - Đóng tin (Owner)
```http
PATCH http://localhost:8080/api/jobs/1/close
Cookie: accessToken=eyJ...
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "message": "Đã đóng tin tuyển dụng",
    "data": {
        "id": 1,
        "status": "CANCELLED"
    }
}
```

---

#### DELETE /api/jobs/{id} - Xóa Job (Owner/Admin)
```http
DELETE http://localhost:8080/api/jobs/1
Cookie: accessToken=eyJ...
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "message": "Xóa job thành công"
}
```

**Errors:**
- `403`: Không phải Owner và không phải Admin
- `404`: Job không tồn tại

---

### 8.2 PAYMENT APIs

#### POST /api/payments/jobs/{jobId} - Tạo Đơn Thanh Toán
```http
POST http://localhost:8080/api/payments/jobs/1
Cookie: accessToken=eyJ...
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "message": "Tạo đơn hàng thanh toán thành công",
    "data": {
        "id": 1,
        "appTransId": "260112_1_123456",
        "zpTransId": null,
        "jobId": 1,
        "jobTitle": "Viết bài SEO cho website du lịch",
        "jobAmount": 5000000,
        "feeAmount": 250000,
        "feePercent": 5.00,
        "totalAmount": 5250000,
        "currency": "VND",
        "description": "WorkHub - Thanh toan job #1",
        "orderUrl": "https://qcgateway.zalopay.vn/openinapp?order=eyJ...",
        "qrCode": "00020101021226520010vn.zalopay...",
        "status": "PENDING",
        "paymentChannel": null,
        "expiredAt": "2026-01-12T16:15:00",
        "paidAt": null,
        "createdAt": "2026-01-12T16:00:00"
    }
}
```

**→ Mở `orderUrl` trong browser hoặc quét `qrCode` để thanh toán**

---

#### POST /api/payments/callback - ZaloPay Callback (Public)
```http
POST http://localhost:8080/api/payments/callback
Content-Type: application/json

{
    "data": "{\"app_id\":2553,\"app_trans_id\":\"260112_1_123456\",\"app_time\":1736668800000,\"app_user\":\"Nguyen Van A\",\"amount\":5250000,\"embed_data\":\"{\\\"redirecturl\\\":\\\"http://localhost:3000/payment/success\\\",\\\"jobId\\\":1}\",\"item\":\"[]\",\"zp_trans_id\":260112000000389,\"server_time\":1736668813498,\"channel\":38,\"merchant_user_id\":\"zalo_user_123\",\"user_fee_amount\":0,\"discount_amount\":0}",
    "mac": "d8d33baf449b31d7f9b94fa50d7c942c08cd4d83f28fa185557da21acb104f67",
    "type": 1
}
```

**Response: 200 OK**
```json
{
    "return_code": 1,
    "return_message": "success"
}
```

**Return codes:**
| Code | Ý nghĩa |
|------|---------|
| 1 | Thành công |
| 2 | Trùng (đã xử lý) |
| -1 | MAC không hợp lệ |
| 0 | Lỗi (ZaloPay retry) |

**⚠️ Test local:** Tạm comment verify MAC trong `PaymentService.handleCallback()`

---

#### GET /api/payments/query/{appTransId} - Truy vấn trạng thái
```http
GET http://localhost:8080/api/payments/query/260112_1_123456
Cookie: accessToken=eyJ...
```

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "data": {
        "appTransId": "260112_1_123456",
        "zpTransId": 260112000000389,
        "status": "PAID",
        "paymentChannel": 38,
        "paidAt": "2026-01-12T16:05:00"
    }
}
```

---

#### GET /api/payments/jobs/{jobId} - Thanh toán của Job
```http
GET http://localhost:8080/api/payments/jobs/1
Cookie: accessToken=eyJ...
```

**Response: 200 OK** - Giống response của POST /api/payments/jobs/{jobId}

---

#### GET /api/payments/my-payments - Danh sách thanh toán
```http
GET http://localhost:8080/api/payments/my-payments?status=PAID&page=0&size=10
Cookie: accessToken=eyJ...
```

**Query params:**
- `status` (optional): `PENDING`, `PAID`, `CANCELLED`, `EXPIRED`

**Response: 200 OK**
```json
{
    "status": "SUCCESS",
    "data": {
        "content": [
            {
                "id": 1,
                "appTransId": "260112_1_123456",
                "jobId": 1,
                "jobTitle": "Viết bài SEO...",
                "totalAmount": 5250000,
                "status": "PAID",
                "paidAt": "2026-01-12T16:05:00"
            }
        ],
        "totalElements": 1
    }
}
```

---

### 8.3 TEST FLOW HOÀN CHỈNH

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLOW TEST THANH TOÁN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. POST /api/auth/login          → Lấy accessToken                         │
│                                                                             │
│  2. POST /api/jobs                → Tạo Job (DRAFT)                         │
│     Body: { title, description, budget, ... }                               │
│     Response: { id: 1, status: "DRAFT" }                                    │
│                                                                             │
│  3. GET /api/jobs/my-jobs?status=DRAFT → Kiểm tra job DRAFT                 │
│                                                                             │
│  4. POST /api/payments/jobs/1     → Tạo đơn thanh toán                      │
│     Response: { orderUrl, qrCode, status: "PENDING" }                       │
│                                                                             │
│  5. Mở orderUrl hoặc quét qrCode  → Thanh toán qua ZaloPay                  │
│                                                                             │
│  6. POST /api/payments/callback   → ZaloPay gọi (hoặc giả lập)              │
│     Body: { data, mac, type }                                               │
│     → Job tự động chuyển OPEN                                               │
│                                                                             │
│  7. GET /api/jobs/1               → Kiểm tra status = "OPEN"                │
│                                                                             │
│  8. GET /api/payments/query/260112_1_123456 → Kiểm tra payment PAID         │
│                                                                             │
│  9. GET /api/jobs                 → Job xuất hiện trong danh sách công khai │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 8.4 ERROR RESPONSES

#### 400 Bad Request - Validation Error
```json
{
    "status": "ERROR",
    "message": "Validation failed",
    "errors": {
        "title": "Tiêu đề không được để trống",
        "budget": "Ngân sách phải >= 0"
    }
}
```

#### 401 Unauthorized - Chưa đăng nhập
```json
{
    "status": "ERROR",
    "message": "Unauthorized"
}
```

#### 403 Forbidden - Không có quyền
```json
{
    "status": "ERROR",
    "message": "Bạn không có quyền xóa job này"
}
```

#### 404 Not Found - Không tìm thấy
```json
{
    "status": "ERROR",
    "message": "Không tìm thấy job với id: 999"
}
```

---

## 9. CẤU HÌNH

### .env
```env
ZALOPAY_APP_ID=2553
ZALOPAY_KEY1=PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL
ZALOPAY_KEY2=kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn/v2

# Payment URLs
PAYMENT_RETURN_URL=http://localhost:3000/payment/success
PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel
```

### SecurityConfig
```
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: config/SecurityConfig.java                                     │
├──────────────────────────────────────────────────────────────────────┤
│ .authorizeHttpRequests(auth -> auth                                  │
│     // Public - Job                                                  │
│     .requestMatchers(GET, "/api/jobs").permitAll()                   │
│     .requestMatchers(GET, "/api/jobs/{id}").permitAll()              │
│     .requestMatchers(GET, "/api/jobs/search").permitAll()            │
│     .requestMatchers(GET, "/api/jobs/by-skills").permitAll()         │
│                                                                      │
│     // Public - Payment Callback                                     │
│     .requestMatchers(POST, "/api/payments/callback").permitAll()     │
│                            ▲                                         │
│                            │                                         │
│                   ZaloPay cần gọi được!                              │
│                                                                      │
│     // Protected                                                     │
│     .anyRequest().authenticated()                                    │
│ )                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```
