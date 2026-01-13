# Job History System Documentation

## 1. Flow tổng quan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JOB HISTORY SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Các Service gọi JobHistoryService.logHistory() khi có action               │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐                  │
│  │ JobService  │  │ Withdrawal  │  │ (Các service khác)  │                  │
│  │             │  │   Service   │  │                     │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘                  │
│         │                │                    │                             │
│         └────────────────┼────────────────────┘                             │
│                          │                                                  │
│                          ▼                                                  │
│                   ┌────────────────┐                                        │
│                   │ JobHistoryService│                                      │
│                   │  .logHistory() │                                        │
│                   └───────┬────────┘                                        │
│                           │                                                 │
│                           ▼                                                 │
│                   ┌────────────────┐                                        │
│                   │ JobHistoryRepo │                                        │
│                   └───────┬────────┘                                        │
│                           │                                                 │
│                           ▼                                                 │
│                   ┌────────────────┐                                        │
│                   │   job_history  │                                        │
│                   │     (Table)    │                                        │
│                   └────────────────┘                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Các loại Action

```
EMPLOYER:
  JOB_CREATED, JOB_UPDATED, JOB_SUBMITTED, JOB_OPENED, JOB_CLOSED
  APPLICATION_ACCEPTED, APPLICATION_REJECTED
  WORK_APPROVED, WORK_REJECTED, PAYMENT_RELEASED

FREELANCER:
  APPLICATION_SUBMITTED, APPLICATION_WITHDRAWN
  WORK_STARTED, WORK_SUBMITTED, WORK_REVISED

SYSTEM/ADMIN:
  JOB_APPROVED, JOB_REJECTED, JOB_COMPLETED, JOB_CANCELLED

WITHDRAWAL:
  WITHDRAWAL_REQUESTED, WITHDRAWAL_APPROVED, WITHDRAWAL_REJECTED, WITHDRAWAL_CANCELLED
```

## 3. Code files

### Backend

```
backend/src/main/java/com/workhub/api/
├── entity/
│   ├── EJobHistoryAction.java           ← Enum các loại action
│   └── JobHistory.java                  ← Entity chính
├── repository/
│   └── JobHistoryRepository.java        ← JPA Repository
├── dto/response/
│   └── JobHistoryResponse.java          ← DTO response + getActionLabel()
├── service/
│   └── JobHistoryService.java           ← logHistory(job, user, action, description)
└── controller/
    └── JobController.java               ← GET /api/jobs/{id}/history
```

### Frontend

```
client/
├── types/
│   └── job.ts                           ← JobHistoryAction type + JOB_HISTORY_ACTION_CONFIG
├── lib/
│   └── api.ts                           ← getJobHistory()
└── components/jobs/shared/
    └── JobHistoryTimeline.tsx           ← Component hiển thị timeline
```

## 4. API Endpoint

| Method | URL | Mô tả |
|--------|-----|-------|
| GET | `/api/jobs/{jobId}/history` | Lấy lịch sử của job |

## 5. Khi nào ghi History

| Service | Action | Trigger |
|---------|--------|---------|
| JobService | JOB_CREATED | Tạo job |
| JobService | JOB_SUBMITTED | Gửi duyệt |
| JobService | JOB_APPROVED/REJECTED | Admin duyệt/từ chối |
| JobService | APPLICATION_SUBMITTED | Freelancer nộp đơn |
| JobService | APPLICATION_ACCEPTED/REJECTED | Employer duyệt/từ chối |
| WithdrawalRequestService | WITHDRAWAL_REQUESTED | Tạo yêu cầu rút/hủy |
| WithdrawalRequestService | WITHDRAWAL_APPROVED | Chấp nhận yêu cầu |
| WithdrawalRequestService | WITHDRAWAL_REJECTED | Từ chối yêu cầu |
| WithdrawalRequestService | WITHDRAWAL_CANCELLED | Tự hủy yêu cầu |
| WithdrawalRequestService | JOB_CANCELLED | Job bị hủy |
