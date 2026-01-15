# WorkHub - Saved Jobs API Documentation

> Cập nhật 2026-01: Tính năng lưu công việc yêu thích cho user.

## 1. KIẾN TRÚC TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SAVED JOBS SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Client    │───>│ JWT Filter  │───>│ Controller  │───>│  Service    │   │
│  │  (Next.js)  │    │             │    │ SavedJob    │    │ SavedJob    │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘   │
│                                                                   │         │
│                                              ┌────────────────────┼────┐    │
│                                              │                    │    │    │
│                                              ▼                    ▼    ▼    │
│                                        ┌──────────┐        ┌──────────────┐ │
│                                        │SavedJob  │        │    Job       │ │
│                                        │Repository│        │ Repository   │ │
│                                        └────┬─────┘        └──────────────┘ │
│                                             │                               │
│                                             ▼                               │
│                                       ┌────────────┐                        │
│                                       │  Database  │                        │
│                                       │(PostgreSQL)│                        │
│                                       └────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DATABASE SCHEMA

```sql
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE DESIGN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────┐                                               │
│   │       saved_jobs        │                                               │
│   ├─────────────────────────┤                                               │
│   │ id (PK, BIGINT)         │                                               │
│   │ job_id (FK → jobs)      │◄── Công việc được lưu                         │
│   │ user_id (FK → users)    │◄── User đã lưu                                │
│   │ created_at              │◄── Thời điểm lưu                              │
│   └─────────────────────────┘                                               │
│                                                                             │
│   UNIQUE CONSTRAINT: (job_id, user_id)                                      │
│   → Mỗi user chỉ lưu 1 job 1 lần                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```


---

## 3. API ENDPOINTS

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/saved-jobs/{jobId}` | Lưu công việc | ✅ |
| DELETE | `/api/saved-jobs/{jobId}` | Bỏ lưu công việc | ✅ |
| POST | `/api/saved-jobs/{jobId}/toggle` | Toggle lưu/bỏ lưu | ✅ |
| GET | `/api/saved-jobs` | Lấy danh sách đã lưu | ✅ |
| GET | `/api/saved-jobs/ids` | Lấy danh sách ID đã lưu | ✅ |
| GET | `/api/saved-jobs/{jobId}/check` | Kiểm tra đã lưu chưa | ✅ |

---

## 4. POST /api/saved-jobs/{jobId}
Lưu công việc vào danh sách yêu thích

```
Request + Cookie accessToken (Authenticated)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/SavedJobController.java                             │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/{jobId}")                                             │
│ @PreAuthorize("isAuthenticated()")                                   │
│ public ResponseEntity<ApiResponse<SavedJobResponse>> saveJob(        │
│     @AuthenticationPrincipal UserDetailsImpl userDetails,            │
│     @PathVariable Long jobId) {                                      │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         savedJobService.saveJob(userDetails.getId(), jobId));        │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/SavedJobService.java                                   │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<SavedJobResponse> saveJob(Long userId, Long jobId)│
│ {                                                                    │
│     User user = userService.getById(userId);                         │
│     Job job = jobRepository.findById(jobId)                          │
│         .orElseThrow(() -> new JobNotFoundException("..."));         │
│                                                                      │
│     // Check if already saved                                        │
│     if (savedJobRepository.existsByJobIdAndUserId(jobId, userId)) {  │
│         return ApiResponse.error("Công việc đã được lưu trước đó");  │
│     }                                                                │
│                                                                      │
│     SavedJob savedJob = SavedJob.builder()                           │
│         .job(job).user(user).build();                                │
│     savedJobRepository.save(savedJob);                               │
│                                                                      │
│     return ApiResponse.success("Đã lưu công việc",                   │
│         buildResponse(savedJob));                                    │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: repository/SavedJobRepository.java                             │
├──────────────────────────────────────────────────────────────────────┤
│ boolean existsByJobIdAndUserId(Long jobId, Long userId);             │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Đã lưu công việc",
    "data": {
        "id": 1,
        "jobId": 1,
        "jobTitle": "Thiết kế website bán hàng",
        "jobBudget": 15000000,
        "jobStatus": "OPEN",
        "employer": { "id": 2, "fullName": "ABC Tech", ... },
        "savedAt": "2026-01-13T20:30:00"
    }
}
```

---

## 5. DELETE /api/saved-jobs/{jobId}
Bỏ lưu công việc khỏi danh sách yêu thích

```
Request + Cookie accessToken (Authenticated)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/SavedJobController.java                             │
├──────────────────────────────────────────────────────────────────────┤
│ @DeleteMapping("/{jobId}")                                           │
│ @PreAuthorize("isAuthenticated()")                                   │
│ public ResponseEntity<ApiResponse<Void>> unsaveJob(                  │
│     @AuthenticationPrincipal UserDetailsImpl userDetails,            │
│     @PathVariable Long jobId) {                                      │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         savedJobService.unsaveJob(userDetails.getId(), jobId));      │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/SavedJobService.java                                   │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<Void> unsaveJob(Long userId, Long jobId) {        │
│     if (!savedJobRepository.existsByJobIdAndUserId(jobId, userId)) { │
│         return ApiResponse.error("Công việc chưa được lưu");         │
│     }                                                                │
│                                                                      │
│     savedJobRepository.deleteByJobIdAndUserId(jobId, userId);        │
│     return ApiResponse.success("Đã bỏ lưu công việc", null);         │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: repository/SavedJobRepository.java                             │
├──────────────────────────────────────────────────────────────────────┤
│ void deleteByJobIdAndUserId(Long jobId, Long userId);                │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Đã bỏ lưu công việc",
    "data": null
}
```

---

## 6. POST /api/saved-jobs/{jobId}/toggle
Toggle lưu/bỏ lưu công việc (tiện dụng khi không biết trạng thái hiện tại)

```
Request + Cookie accessToken (Authenticated)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/SavedJobController.java                             │
├──────────────────────────────────────────────────────────────────────┤
│ @PostMapping("/{jobId}/toggle")                                      │
│ @PreAuthorize("isAuthenticated()")                                   │
│ public ResponseEntity<ApiResponse<SavedJobResponse>> toggleSaveJob(  │
│     @AuthenticationPrincipal UserDetailsImpl userDetails,            │
│     @PathVariable Long jobId) {                                      │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         savedJobService.toggleSaveJob(userDetails.getId(), jobId));  │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/SavedJobService.java                                   │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ApiResponse<SavedJobResponse> toggleSaveJob(                  │
│     Long userId, Long jobId) {                                       │
│                                                                      │
│     if (savedJobRepository.existsByJobIdAndUserId(jobId, userId)) {  │
│         savedJobRepository.deleteByJobIdAndUserId(jobId, userId);    │
│         return ApiResponse.success("Đã bỏ lưu công việc", null);     │
│     } else {                                                         │
│         return saveJob(userId, jobId);                               │
│     }                                                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response (if saved): 200 OK
{
    "status": "SUCCESS",
    "message": "Đã lưu công việc",
    "data": { ... savedJob details ... }
}

Response (if unsaved): 200 OK
{
    "status": "SUCCESS",
    "message": "Đã bỏ lưu công việc",
    "data": null
}
```

---

## 7. GET /api/saved-jobs
Lấy danh sách công việc đã lưu (có phân trang)

```
Request + Cookie accessToken (Authenticated)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/SavedJobController.java                             │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping                                                          │
│ @PreAuthorize("isAuthenticated()")                                   │
│ public ResponseEntity<ApiResponse<Page<SavedJobResponse>>>           │
│     getSavedJobs(                                                    │
│         @AuthenticationPrincipal UserDetailsImpl userDetails,        │
│         @RequestParam(defaultValue = "0") int page,                  │
│         @RequestParam(defaultValue = "10") int size) {               │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         savedJobService.getSavedJobs(userDetails.getId(), page,size))│
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/SavedJobService.java                                   │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<Page<SavedJobResponse>> getSavedJobs(             │
│     Long userId, int page, int size) {                               │
│                                                                      │
│     Pageable pageable = PageRequest.of(page, size);                  │
│     Page<SavedJob> savedJobs =                                       │
│         savedJobRepository.findByUserIdWithJob(userId, pageable);    │
│                                                                      │
│     Page<SavedJobResponse> responsePage =                            │
│         savedJobs.map(this::buildResponse);                          │
│     return ApiResponse.success(                                      │
│         "Lấy danh sách công việc đã lưu thành công", responsePage);  │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: repository/SavedJobRepository.java                             │
├──────────────────────────────────────────────────────────────────────┤
│ @Query("SELECT sj FROM SavedJob sj JOIN FETCH sj.job j " +           │
│        "JOIN FETCH j.employer WHERE sj.user.id = :userId " +         │
│        "ORDER BY sj.createdAt DESC")                                 │
│ Page<SavedJob> findByUserIdWithJob(@Param("userId") Long userId,     │
│                                    Pageable pageable);               │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Lấy danh sách công việc đã lưu thành công",
    "data": {
        "content": [
            { "id": 1, "jobId": 1, "jobTitle": "...", ... },
            { "id": 2, "jobId": 3, "jobTitle": "...", ... }
        ],
        "totalElements": 5,
        "totalPages": 1,
        "size": 10,
        "number": 0
    }
}
```

---

## 8. GET /api/saved-jobs/ids
Lấy danh sách ID các công việc đã lưu (dùng để load nhanh trạng thái)

```
Request + Cookie accessToken (Authenticated)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/SavedJobController.java                             │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/ids")                                                  │
│ @PreAuthorize("isAuthenticated()")                                   │
│ public ResponseEntity<ApiResponse<List<Long>>> getSavedJobIds(       │
│     @AuthenticationPrincipal UserDetailsImpl userDetails) {          │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         savedJobService.getSavedJobIds(userDetails.getId()));        │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/SavedJobService.java                                   │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<List<Long>> getSavedJobIds(Long userId) {         │
│     List<Long> jobIds =                                              │
│         savedJobRepository.findSavedJobIdsByUserId(userId);          │
│     return ApiResponse.success(                                      │
│         "Lấy danh sách ID công việc đã lưu thành công", jobIds);     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: repository/SavedJobRepository.java                             │
├──────────────────────────────────────────────────────────────────────┤
│ @Query("SELECT sj.job.id FROM SavedJob sj WHERE sj.user.id = :userId")│
│ List<Long> findSavedJobIdsByUserId(@Param("userId") Long userId);    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Lấy danh sách ID công việc đã lưu thành công",
    "data": [1, 3, 5, 7, 12]
}
```

---

## 9. GET /api/saved-jobs/{jobId}/check
Kiểm tra công việc đã được lưu chưa

```
Request + Cookie accessToken (Authenticated)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/SavedJobController.java                             │
├──────────────────────────────────────────────────────────────────────┤
│ @GetMapping("/{jobId}/check")                                        │
│ @PreAuthorize("isAuthenticated()")                                   │
│ public ResponseEntity<ApiResponse<Boolean>> isJobSaved(              │
│     @AuthenticationPrincipal UserDetailsImpl userDetails,            │
│     @PathVariable Long jobId) {                                      │
│                                                                      │
│     return ResponseEntity.ok(                                        │
│         savedJobService.isJobSaved(userDetails.getId(), jobId));     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/SavedJobService.java                                   │
├──────────────────────────────────────────────────────────────────────┤
│ public ApiResponse<Boolean> isJobSaved(Long userId, Long jobId) {    │
│     boolean isSaved =                                                │
│         savedJobRepository.existsByJobIdAndUserId(jobId, userId);    │
│     return ApiResponse.success("Kiểm tra thành công", isSaved);      │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Kiểm tra thành công",
    "data": true
}
```

---

## 10. DTO RESPONSE

```
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/response/SavedJobResponse.java                             │
├──────────────────────────────────────────────────────────────────────┤
│ @Data @Builder @NoArgsConstructor @AllArgsConstructor                │
│ public class SavedJobResponse {                                      │
│     private Long id;                                                 │
│     private Long jobId;                                              │
│     private String jobTitle;                                         │
│     private String jobDescription;                                   │
│     private BigDecimal jobBudget;                                    │
│     private String jobStatus;                                        │
│     private Set<String> jobSkills;                                   │
│     private EmployerInfo employer;                                   │
│     private LocalDateTime savedAt;                                   │
│                                                                      │
│     @Data @Builder @NoArgsConstructor @AllArgsConstructor            │
│     public static class EmployerInfo {                               │
│         private Long id;                                             │
│         private String fullName;                                     │
│         private String company;                                      │
│         private String location;                                     │
│         private String avatarUrl;                                    │
│     }                                                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---


### 2. CREATE - Lưu công việc
```
POST http://localhost:8080/api/saved-jobs/1
Authorization: Bearer <access_token>
```

**Response:**
```json
{
    "status": "SUCCESS",
    "message": "Đã lưu công việc",
    "data": {
        "id": 1,
        "jobId": 1,
        "jobTitle": "Thiết kế website bán hàng",
        "jobDescription": "Mô tả công việc...",
        "jobBudget": 15000000,
        "jobStatus": "OPEN",
        "jobSkills": ["ReactJS", "NextJS"],
        "employer": {
            "id": 2,
            "fullName": "ABC Tech",
            "company": "ABC Tech Company",
            "location": "Hà Nội",
            "avatarUrl": null
        },
        "savedAt": "2026-01-13T20:30:00"
    }
}
```

---

### 3. READ - Lấy danh sách đã lưu
```
GET http://localhost:8080/api/saved-jobs?page=0&size=10
Authorization: Bearer <access_token>
```

**Response:**
```json
{
    "status": "SUCCESS",
    "message": "Lấy danh sách công việc đã lưu thành công",
    "data": {
        "content": [
            {
                "id": 1,
                "jobId": 1,
                "jobTitle": "Thiết kế website bán hàng",
                "jobBudget": 15000000,
                "jobStatus": "OPEN",
                "employer": { "id": 2, "fullName": "ABC Tech" },
                "savedAt": "2026-01-13T20:30:00"
            }
        ],
        "totalElements": 1,
        "totalPages": 1,
        "size": 10,
        "number": 0
    }
}
```

---

### 4. DELETE - Bỏ lưu công việc
```
DELETE http://localhost:8080/api/saved-jobs/1
Authorization: Bearer <access_token>
```

**Response:**
```json
{
    "status": "SUCCESS",
    "message": "Đã bỏ lưu công việc",
    "data": null
}
```

