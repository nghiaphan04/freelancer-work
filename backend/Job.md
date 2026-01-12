# WorkHub - Job Management System Documentation

## 1. KIẾN TRÚC TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JOB MANAGEMENT SYSTEM                             │
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
│                                        │   Job    │        │   Security   │ │
│                                        │ Service  │        │   Config     │ │
│                                        └────┬─────┘        └──────────────┘ │
│                                             │                               │
│                          ┌──────────────────┼──────────────────┐            │
│                          │                  │                  │            │
│                          ▼                  ▼                  ▼            │
│                   ┌────────────┐     ┌────────────┐     ┌────────────┐      │
│                   │    Job     │     │    User    │     │   Search   │      │
│                   │ Repository │     │  Service   │     │   (JPA)    │      │
│                   └─────┬──────┘     └────────────┘     └────────────┘      │
│                         │                                                   │
│                         ▼                                                   │
│                   ┌────────────┐                                            │
│                   │  Database  │                                            │
│                   │(PostgreSQL)│                                            │
│                   └────────────┘                                            │
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
│                │ 1:N                                                        │
│                ▼                                                            │
│   ┌─────────────────────────────────┐         ┌─────────────────────────┐   │
│   │          job_skills             │         │         users           │   │
│   ├─────────────────────────────────┤         ├─────────────────────────┤   │
│   │ job_id (FK)                     │         │ id (PK)                 │   │
│   │ skill (VARCHAR 100)             │         │ email                   │   │
│   │                                 │         │ full_name               │   │
│   │ Ví dụ:                          │    N:1  │ company                 │   │
│   │  - "SEO"                        │◄───────►│ ...                     │   │
│   │  - "Content Writing"            │         │                         │   │
│   │  - "React"                      │         │                         │   │
│   └─────────────────────────────────┘         └─────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```


## 4. JOB FLOWS

### 4.1 Tạo Job Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Server  │     │    DB    │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     │ POST /api/jobs │                │
     │ {title, desc,  │                │
     │  skills, ...}  │                │
     │───────────────>│                │
     │                │                │
     │                │ Verify JWT     │
     │                │ (Cookie)       │
     │                │                │
     │                │ Validate       │
     │                │ Request        │
     │                │                │
     │                │ Get Employer   │
     │                │───────────────>│
     │                │<───────────────│
     │                │                │
     │                │ Create Job     │
     │                │ (DRAFT/OPEN)   │
     │                │───────────────>│
     │                │                │
     │                │ Save Skills    │
     │                │───────────────>│
     │                │                │
     │<───────────────│                │
     │ 201 Created    │                │
     │ {job data}     │                │
```

---

### 4.2 Cập Nhật Job Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Server  │     │    DB    │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     │ PUT /api/jobs/1│                │
     │ {title, ...}   │                │
     │───────────────>│                │
     │                │                │
     │                │ Verify JWT     │
     │                │                │
     │                │ Find Job       │
     │                │───────────────>│
     │                │<───────────────│
     │                │                │
     │                │ Check Owner    │
     │                │ (job.employer  │
     │                │  == user.id?)  │
     │                │                │
     │                │ [Không phải    │
     │                │  owner]        │
     │                │ → 403 Forbidden│
     │                │                │
     │                │ [Là owner]     │
     │                │ Update Job     │
     │                │───────────────>│
     │                │                │
     │<───────────────│                │
     │ 200 OK         │                │
```

---

### 4.3 Job Status Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JOB STATUS TRANSITIONS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌─────────┐                                    │
│                              │  DRAFT  │ ◄── Tạo job mới (publishNow=false) │
│                              └────┬────┘                                    │
│                                   │                                         │
│                     PATCH /{id}/publish                                     │
│                                   │                                         │
│                                   ▼                                         │
│   ┌─────────┐              ┌─────────┐                                      │
│   │CANCELLED│◄─────────────│  OPEN   │ ◄── Đang tuyển dụng                  │
│   └─────────┘  PATCH       └────┬────┘                                      │
│       ▲        /{id}/close      │                                           │
│       │                         │ (Chọn freelancer)                         │
│       │                         ▼                                           │
│       │                  ┌─────────────┐                                    │
│       └──────────────────│ IN_PROGRESS │ ◄── Đang thực hiện                 │
│                          └──────┬──────┘                                    │
│                                 │                                           │
│                                 │ (Hoàn thành công việc)                    │
│                                 ▼                                           │
│                          ┌─────────────┐                                    │
│                          │  COMPLETED  │ ◄── Đã hoàn thành                  │
│                          └─────────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. PROJECT STRUCTURE

```
backend/src/main/java/com/workhub/api/
├── controller/
│   └── JobController.java              # /api/jobs/*
│
├── service/
│   └── JobService.java                 # Xử lý logic job
│
├── repository/
│   └── JobRepository.java              # Truy vấn database
│
├── entity/
│   ├── Job.java                        # Entity chính
│   ├── EJobComplexity.java             # Enum độ phức tạp
│   ├── EJobDuration.java               # Enum thời hạn
│   ├── EWorkType.java                  # Enum loại hình
│   └── EJobStatus.java                 # Enum trạng thái
│
├── dto/
│   ├── request/
│   │   ├── CreateJobRequest.java       # DTO tạo job
│   │   └── UpdateJobRequest.java       # DTO cập nhật job
│   └── response/
│       └── JobResponse.java            # DTO response
│
└── exception/
    ├── JobNotFoundException.java       # Không tìm thấy job
    └── UnauthorizedAccessException.java# Không có quyền
```

---

## 6. API ENDPOINTS

### Job Endpoints

| Method | Endpoint | Mô tả | Auth | 
|--------|----------|-------|------|
| `POST` | `/api/jobs` | Tạo job mới | ✅ |
| `GET` | `/api/jobs` | Danh sách jobs đang tuyển | ❌ |
| `GET` | `/api/jobs/{id}` | Chi tiết job | ❌ |
| `GET` | `/api/jobs/my-jobs` | Jobs của tôi | ✅ |
| `GET` | `/api/jobs/search` | Tìm kiếm jobs | ❌ |
| `GET` | `/api/jobs/by-skills` | Tìm theo kỹ năng | ❌ |
| `PUT` | `/api/jobs/{id}` | Cập nhật job | ✅ (Owner) |
| `PATCH` | `/api/jobs/{id}/publish` | Đăng tin | ✅ (Owner) |
| `PATCH` | `/api/jobs/{id}/close` | Đóng tin | ✅ (Owner) |
| `DELETE` | `/api/jobs/{id}` | Xóa job | ✅ (Owner/Admin) |

---

### POST /api/jobs
Tạo tin tuyển dụng mới

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: security/jwt/JwtAuthFilter.java                                │
├──────────────────────────────────────────────────────────────────────┤
│ → Đọc JWT từ cookie accessToken                                      │
│ → Giải mã JWT, lấy email                                             │
│ → Load user từ DB, set vào SecurityContext                           │
│ → Không có token → 401 Unauthorized                                  │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java                                  │
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
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/request/CreateJobRequest.java                              │
├──────────────────────────────────────────────────────────────────────┤
│ @NotBlank(message = "Tiêu đề không được để trống")                   │
│ @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự")               │
│ private String title;                                                │
│                                                                      │
│ @NotBlank(message = "Mô tả công việc không được để trống")           │
│ private String description;                                          │
│                                                                      │
│ private String context;          // Bối cảnh dự án                   │
│ private String requirements;     // Yêu cầu cụ thể                   │
│ private String deliverables;     // Sản phẩm bàn giao                │
│                                                                      │
│ @Size(max = 10, message = "Tối đa 10 kỹ năng")                       │
│ private Set<String> skills;                                          │
│                                                                      │
│ private EJobComplexity complexity;  // ENTRY/INTERMEDIATE/EXPERT     │
│ private EJobDuration duration;      // SHORT/MEDIUM/LONG_TERM        │
│ private EWorkType workType;         // PART_TIME/FULL_TIME           │
│                                                                      │
│ @DecimalMin(value = "0", message = "Ngân sách phải >= 0")            │
│ private BigDecimal budget;                                           │
│ private String currency;            // VND/USD                       │
│                                                                      │
│ @Future(message = "Hạn nộp hồ sơ phải trong tương lai")              │
│ private LocalDateTime applicationDeadline;                           │
│ private LocalDateTime expectedStartDate;                             │
│                                                                      │
│ private Boolean publishNow;         // true: đăng luôn, false: nháp  │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java                                        │
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
│             .skills(req.getSkills())                                 │
│             .complexity(req.getComplexity())                         │
│             .duration(req.getDuration())                             │
│             .workType(req.getWorkType())                             │
│             .budget(req.getBudget())                                 │
│             .currency(req.getCurrency())                             │
│             .applicationDeadline(req.getApplicationDeadline())       │
│             .expectedStartDate(req.getExpectedStartDate())           │
│             .status(EJobStatus.DRAFT)                                │
│             .employer(employer)                                      │
│             .build();                                                │
│                                                                      │
│     // 3. Nếu publishNow = true → đăng luôn                          │
│     if (Boolean.TRUE.equals(req.getPublishNow())) {                  │
│         job.publish();  // DRAFT → OPEN                              │
│     }                                                                │
│                                                                      │
│     // 4. Lưu vào database                                           │
│     Job savedJob = jobRepository.save(job);                          │
│                                                                      │
│     return ApiResponse.success(message, buildJobResponse(savedJob)); │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 201 Created
{
    "status": "SUCCESS",
    "message": "Đăng tin tuyển dụng thành công",
    "data": {
        "id": 1,
        "title": "Viết bài SEO cho website du lịch",
        "description": "...",
        "skills": ["SEO", "Content Writing"],
        "complexity": "INTERMEDIATE",
        "duration": "SHORT_TERM",
        "workType": "PART_TIME",
        "budget": 1000000,
        "currency": "VND",
        "status": "OPEN",
        "employer": {
            "id": 1,
            "fullName": "Nguyễn Văn A",
            "company": "ABC Company"
        },
        "createdAt": "2026-01-12T10:00:00"
    }
}
```

---

### GET /api/jobs
Lấy danh sách jobs đang tuyển (công khai)

```
Request (không cần auth)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping                                                          │
│ public ResponseEntity<ApiResponse<Page<JobResponse>>> getOpenJobs(   │
│     @RequestParam(defaultValue = "0") int page,                      │
│     @RequestParam(defaultValue = "10") int size,                     │
│     @RequestParam(defaultValue = "createdAt") String sortBy,         │
│     @RequestParam(defaultValue = "desc") String sortDir) {           │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         jobService.getOpenJobs(page, size, sortBy, sortDir)          │
│     );                                                               │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java                                        │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<Page<JobResponse>> getOpenJobs(...) {             │
│     Sort sort = sortDir.equalsIgnoreCase("desc")                     │
│             ? Sort.by(sortBy).descending()                           │
│             : Sort.by(sortBy).ascending();                           │
│     Pageable pageable = PageRequest.of(page, size, sort);            │
│                                                                      │
│     // Chỉ lấy jobs có status = OPEN                                 │
│     Page<Job> jobs = jobRepository.findByStatus(                     │
│         EJobStatus.OPEN, pageable                                    │
│     );                                                               │
│                                                                      │
│     Page<JobResponse> response = jobs.map(this::buildJobResponse);   │
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
Lấy chi tiết job (tăng lượt xem)

```
Request (không cần auth)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/{id}")                                                 │
│ public ResponseEntity<ApiResponse<JobResponse>> getJobById(          │
│     @PathVariable Long id) {                                         │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         jobService.getJobByIdAndIncrementView(id)                    │
│     );                                                               │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java                                        │
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
    "status": "SUCCESS",
    "data": {
        "id": 1,
        "title": "Viết bài SEO cho website du lịch",
        "description": "Cần freelancer viết 10 bài blog...",
        "context": "Công ty du lịch ABC đang xây dựng website...",
        "requirements": "- Bài viết 1000-1500 chữ\n- Có ảnh minh họa",
        "deliverables": "File Word hoặc Google Docs",
        "skills": ["SEO", "Content Writing", "Vietnamese"],
        "complexity": "INTERMEDIATE",
        "duration": "SHORT_TERM",
        "workType": "PART_TIME",
        "budget": 1000000,
        "currency": "VND",
        "applicationDeadline": "2026-01-20T23:59:59",
        "status": "OPEN",
        "viewCount": 15,
        "applicationCount": 3,
        "employer": {
            "id": 1,
            "fullName": "Nguyễn Văn A",
            "avatarUrl": "...",
            "company": "ABC Company",
            "isVerified": true
        },
        "createdAt": "2026-01-12T10:00:00"
    }
}
```

---

### GET /api/jobs/my-jobs
Lấy danh sách jobs của tôi

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/my-jobs")                                              │
│ public ResponseEntity<ApiResponse<Page<JobResponse>>> getMyJobs(     │
│     @AuthenticationPrincipal UserDetailsImpl userDetails,            │
│     @RequestParam(required = false) EJobStatus status,               │
│     @RequestParam(defaultValue = "0") int page,                      │
│     @RequestParam(defaultValue = "10") int size,                     │
│     @RequestParam(defaultValue = "createdAt") String sortBy,         │
│     @RequestParam(defaultValue = "desc") String sortDir) {           │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         jobService.getMyJobs(userDetails.getId(), status, ...)       │
│     );                                                               │
│ }                                                                    │
│                                                                      │
│ → Có thể filter theo status: ?status=DRAFT, ?status=OPEN, ...        │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java                                        │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<Page<JobResponse>> getMyJobs(Long employerId,     │
│         EJobStatus status, ...) {                                    │
│                                                                      │
│     Page<Job> jobs;                                                  │
│     if (status != null) {                                            │
│         // Lọc theo status                                           │
│         jobs = jobRepository.findByEmployerIdAndStatus(              │
│             employerId, status, pageable                             │
│         );                                                           │
│     } else {                                                         │
│         // Lấy tất cả                                                │
│         jobs = jobRepository.findByEmployerId(employerId, pageable); │
│     }                                                                │
│                                                                      │
│     return ApiResponse.success("Thành công", ...);                   │
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
            { "id": 2, "title": "...", "status": "DRAFT", ... }
        ],
        "totalElements": 5
    }
}
```

---

### GET /api/jobs/search
Tìm kiếm jobs theo từ khóa

```
Request (không cần auth)
GET /api/jobs/search?keyword=SEO&page=0&size=10
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/search")                                               │
│ public ResponseEntity<ApiResponse<Page<JobResponse>>> searchJobs(    │
│     @RequestParam String keyword,                                    │
│     @RequestParam(defaultValue = "0") int page,                      │
│     @RequestParam(defaultValue = "10") int size) {                   │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         jobService.searchJobs(keyword, page, size)                   │
│     );                                                               │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: repository/JobRepository.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @Query("SELECT j FROM Job j WHERE j.status = :status AND " +         │
│        "(LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +│
│        "LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%')))") │
│ Page<Job> searchJobs(@Param("keyword") String keyword,               │
│                      @Param("status") EJobStatus status,             │
│                      Pageable pageable);                             │
│                                                                      │
│ → Tìm trong title và description                                     │
│ → Chỉ tìm jobs có status = OPEN                                      │
│ → Case-insensitive (LOWER)                                           │
└──────────────────────────────────────────────────────────────────────┘
```

---

### GET /api/jobs/by-skills
Tìm jobs theo kỹ năng

```
Request (không cần auth)
GET /api/jobs/by-skills?skills=SEO,React&page=0&size=10
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: repository/JobRepository.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @Query("SELECT DISTINCT j FROM Job j JOIN j.skills s " +             │
│        "WHERE s IN :skills AND j.status = :status")                  │
│ Page<Job> findBySkillsAndStatus(@Param("skills") List<String> skills,│
│                                  @Param("status") EJobStatus status, │
│                                  Pageable pageable);                 │
│                                                                      │
│ → JOIN bảng job_skills                                               │
│ → Tìm jobs có ít nhất 1 skill khớp                                   │
│ → DISTINCT để tránh duplicate                                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

### PUT /api/jobs/{id}
Cập nhật job (chỉ owner)

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @PutMapping("/{id}")                                                 │
│ public ResponseEntity<ApiResponse<JobResponse>> updateJob(           │
│     @PathVariable Long id,                                           │
│     @AuthenticationPrincipal UserDetailsImpl userDetails,            │
│     @Valid @RequestBody UpdateJobRequest req) {                      │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         jobService.updateJob(id, userDetails.getId(), req)           │
│     );                                                               │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java                                        │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<JobResponse> updateJob(Long jobId, Long userId,   │
│                                           UpdateJobRequest req) {    │
│     Job job = getById(jobId);                                        │
│                                                                      │
│     // KIỂM TRA QUYỀN SỞ HỮU                                         │
│     if (!job.isOwnedBy(userId)) {                                    │
│         throw new UnauthorizedAccessException(                       │
│             "Bạn không có quyền sửa job này"                         │
│         );                                                           │
│     }                                                                │
│                                                                      │
│     // Cập nhật các field                                            │
│     job.update(req.getTitle(), req.getDescription(), ...);           │
│                                                                      │
│     Job updatedJob = jobRepository.save(job);                        │
│     return ApiResponse.success("Cập nhật job thành công", ...);      │
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
│                                                                      │
│ public void update(String title, String description, ...) {          │
│     if (title != null && !title.isBlank()) {                         │
│         this.title = title;                                          │
│     }                                                                │
│     // ... cập nhật các field khác                                   │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK hoặc 403 Forbidden (nếu không phải owner)
```

---

### PATCH /api/jobs/{id}/publish
Đăng tin (DRAFT → OPEN)

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/JobController.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @PatchMapping("/{id}/publish")                                       │
│ public ResponseEntity<ApiResponse<JobResponse>> publishJob(          │
│     @PathVariable Long id,                                           │
│     @AuthenticationPrincipal UserDetailsImpl userDetails) {          │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         jobService.publishJob(id, userDetails.getId())               │
│     );                                                               │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java                                        │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<JobResponse> publishJob(Long jobId, Long userId) {│
│     Job job = getById(jobId);                                        │
│                                                                      │
│     if (!job.isOwnedBy(userId)) {                                    │
│         throw new UnauthorizedAccessException(...);                  │
│     }                                                                │
│                                                                      │
│     job.publish();  // Chuyển status → OPEN                          │
│     Job updatedJob = jobRepository.save(job);                        │
│                                                                      │
│     return ApiResponse.success("Đăng tin tuyển dụng thành công",...);│
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: entity/Job.java                                                │
├──────────────────────────────────────────────────────────────────────┤
│ public void publish() {                                              │
│     if (this.status == EJobStatus.DRAFT ||                           │
│         this.status == EJobStatus.CANCELLED) {                       │
│         this.status = EJobStatus.OPEN;                               │
│     }                                                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

### PATCH /api/jobs/{id}/close
Đóng tin tuyển dụng

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/JobService.java                                        │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<JobResponse> closeJob(Long jobId, Long userId) {  │
│     Job job = getById(jobId);                                        │
│                                                                      │
│     if (!job.isOwnedBy(userId)) {                                    │
│         throw new UnauthorizedAccessException(...);                  │
│     }                                                                │
│                                                                      │
│     job.close();  // Chuyển status → CANCELLED                       │
│     Job updatedJob = jobRepository.save(job);                        │
│                                                                      │
│     return ApiResponse.success("Đã đóng tin tuyển dụng", ...);       │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: entity/Job.java                                                │
├──────────────────────────────────────────────────────────────────────┤
│ public void close() {                                                │
│     this.status = EJobStatus.CANCELLED;                              │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

### DELETE /api/jobs/{id}
Xóa job

```
Request + Cookie accessToken
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
│     // Owner HOẶC Admin đều có quyền xóa                             │
│     if (!job.isOwnedBy(userId) && !user.isAdmin()) {                 │
│         throw new UnauthorizedAccessException(                       │
│             "Bạn không có quyền xóa job này"                         │
│         );                                                           │
│     }                                                                │
│                                                                      │
│     jobRepository.delete(job);                                       │
│     return ApiResponse.success("Xóa job thành công");                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Xóa job thành công"
}

Error Response (không phải owner và không phải admin): 403 Forbidden
{
    "status": "ERROR",
    "message": "Bạn không có quyền xóa job này"
}
```

---

## 7. RESPONSE DTO

```
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/response/JobResponse.java                                  │
├──────────────────────────────────────────────────────────────────────┤
│ @Data                                                                │
│ @Builder                                                             │
│ public class JobResponse {                                           │
│     private Long id;                                                 │
│     private String title;                                            │
│     private String description;                                      │
│     private String context;                                          │
│     private String requirements;                                     │
│     private String deliverables;                                     │
│     private Set<String> skills;                                      │
│     private EJobComplexity complexity;                               │
│     private EJobDuration duration;                                   │
│     private EWorkType workType;                                      │
│     private BigDecimal budget;                                       │
│     private String currency;                                         │
│     private LocalDateTime applicationDeadline;                       │
│     private LocalDateTime expectedStartDate;                         │
│     private EJobStatus status;                                       │
│     private Integer viewCount;                                       │
│     private Integer applicationCount;                                │
│     private EmployerResponse employer;                               │
│     private LocalDateTime createdAt;                                 │
│     private LocalDateTime updatedAt;                                 │
│                                                                      │
│     @Data                                                            │
│     @Builder                                                         │
│     public static class EmployerResponse {                           │
│         private Long id;                                             │
│         private String fullName;                                     │
│         private String avatarUrl;                                    │
│         private String title;                                        │
│         private String company;                                      │
│         private String location;                                     │
│         private Boolean isVerified;                                  │
│     }                                                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 8. SECURITY CONFIG

```
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: config/SecurityConfig.java                                     │
├──────────────────────────────────────────────────────────────────────┤
│ .authorizeHttpRequests(auth -> auth                                  │
│     // Public endpoints (không cần đăng nhập)                        │
│     .requestMatchers(GET, "/api/jobs").permitAll()                   │
│     .requestMatchers(GET, "/api/jobs/{id}").permitAll()              │
│     .requestMatchers(GET, "/api/jobs/search").permitAll()            │
│     .requestMatchers(GET, "/api/jobs/by-skills").permitAll()         │
│                                                                      │
│     // Protected endpoints (cần đăng nhập)                           │
│     .anyRequest().authenticated()                                    │
│ )                                                                    │
│                                                                      │
│ → GET /api/jobs, /api/jobs/{id}, /search, /by-skills: Ai cũng xem    │
│ → POST, PUT, PATCH, DELETE: Phải đăng nhập                           │
│ → Owner check trong Service layer                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 9. POSTMAN TEST

### Tạo Job
```
POST http://localhost:8080/api/jobs
Content-Type: application/json
Cookie: accessToken=eyJ...

{
    "title": "Viết bài SEO cho website du lịch",
    "description": "Cần freelancer viết 10 bài blog về du lịch Việt Nam",
    "context": "Công ty du lịch ABC đang xây dựng website mới",
    "requirements": "- Bài viết 1000-1500 chữ\n- Có ảnh minh họa",
    "deliverables": "File Word hoặc Google Docs",
    "skills": ["SEO", "Content Writing", "Vietnamese"],
    "complexity": "INTERMEDIATE",
    "duration": "SHORT_TERM",
    "workType": "PART_TIME",
    "budget": 1000000,
    "currency": "VND",
    "applicationDeadline": "2026-01-20T23:59:59",
    "publishNow": true
}
```

### Lấy danh sách Jobs
```
GET http://localhost:8080/api/jobs?page=0&size=10&sortBy=createdAt&sortDir=desc
```

### Tìm kiếm
```
GET http://localhost:8080/api/jobs/search?keyword=SEO&page=0&size=10
```

### Tìm theo skills
```
GET http://localhost:8080/api/jobs/by-skills?skills=SEO,React&page=0&size=10
```

### Cập nhật Job
```
PUT http://localhost:8080/api/jobs/1
Cookie: accessToken=eyJ...

{
    "title": "Viết bài SEO - CẬP NHẬT",
    "budget": 1500000
}
```

### Đăng tin
```
PATCH http://localhost:8080/api/jobs/1/publish
Cookie: accessToken=eyJ...
```

### Đóng tin
```
PATCH http://localhost:8080/api/jobs/1/close
Cookie: accessToken=eyJ...
```

### Xóa Job
```
DELETE http://localhost:8080/api/jobs/1
Cookie: accessToken=eyJ...
```
