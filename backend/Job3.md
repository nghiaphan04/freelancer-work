# Withdrawal Request System Documentation

## 1. Flow tổng quan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WITHDRAWAL REQUEST SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Client    │───>│    Auth     │───>│ Controller  │───>│   Service   │   │
│  │  (Next.js)  │    │   Filter    │    │             │    │             │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘   │
│                                                                   │         │
│                          ┌────────────────────────────────────────┤         │
│                          │                    │                   │         │
│                          ▼                    ▼                   ▼         │
│                   ┌────────────┐       ┌────────────┐      ┌────────────┐   │
│                   │   User     │       │    Job     │      │ Withdrawal │   │
│                   │  Service   │       │   Repo     │      │    Repo    │   │
│                   └────────────┘       └────────────┘      └────────────┘   │
│                          │                    │                   │         │
│                          └────────────────────┴───────────────────┘         │
│                                              │                              │
│                                              ▼                              │
│                                       ┌────────────┐                        │
│                                       │  Database  │                        │
│                                       │(PostgreSQL)│                        │
│                                       └────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Luồng xử lý

```
FREELANCER RÚT (12% phí phạt):
Freelancer → Tạo yêu cầu → Trừ 12% escrow → Employer nhận notify
                                          → Employer approve → Job CANCELLED + Hoàn escrow cho Employer
                                          → Employer reject  → Hoàn phí phạt cho Freelancer

EMPLOYER HỦY (40% phí phạt):
Employer → Tạo yêu cầu → Trừ 40% escrow → Freelancer nhận notify
                                        → Freelancer approve → Job CANCELLED + Hoàn escrow cho Employer
                                        → Freelancer reject  → Hoàn phí phạt cho Employer

TỰ HỦY YÊU CẦU:
Người tạo → Hủy yêu cầu → KHÔNG hoàn phí phạt
```

## 3. Code files

### Backend

```
backend/src/main/java/com/workhub/api/
├── entity/
│   ├── EWithdrawalRequestStatus.java    ← Enum: PENDING, APPROVED, REJECTED, CANCELLED
│   ├── EWithdrawalRequestType.java      ← Enum: FREELANCER_WITHDRAW, EMPLOYER_CANCEL
│   └── WithdrawalRequest.java           ← Entity chính
├── repository/
│   └── WithdrawalRequestRepository.java ← JPA Repository
├── dto/
│   ├── request/
│   │   ├── CreateWithdrawalRequest.java ← DTO tạo yêu cầu
│   │   └── RespondWithdrawalRequest.java← DTO phản hồi
│   └── response/
│       └── WithdrawalRequestResponse.java← DTO response
├── service/
│   └── WithdrawalRequestService.java    ← Business logic
└── controller/
    └── WithdrawalRequestController.java ← REST API
```

### Frontend

```
client/
└── lib/
    └── api.ts                           ← API methods + types
        - WithdrawalRequestType
        - WithdrawalRequestStatus
        - WithdrawalRequest interface
        - createFreelancerWithdrawal()
        - createEmployerCancellation()
        - approveWithdrawalRequest()
        - rejectWithdrawalRequest()
        - cancelWithdrawalRequest()
        - getPendingWithdrawalRequest()
        - getWithdrawalRequestHistory()
```

## 4. API Endpoints

| Method | URL | Mô tả |
|--------|-----|-------|
| POST | `/api/jobs/{jobId}/withdrawal/freelancer` | Freelancer tạo yêu cầu rút |
| POST | `/api/jobs/{jobId}/withdrawal/employer` | Employer tạo yêu cầu hủy |
| PUT | `/api/withdrawal-requests/{id}/approve` | Chấp nhận yêu cầu |
| PUT | `/api/withdrawal-requests/{id}/reject` | Từ chối yêu cầu |
| DELETE | `/api/withdrawal-requests/{id}` | Tự hủy yêu cầu |
| GET | `/api/jobs/{jobId}/withdrawal/pending` | Lấy yêu cầu đang chờ |
| GET | `/api/jobs/{jobId}/withdrawal/history` | Lấy lịch sử yêu cầu |

## 5. Phí phạt

| Loại | Phần trăm | Ví dụ (escrow = 1,000,000đ) |
|------|-----------|------------------------------|
| Freelancer rút | 12% | 120,000đ |
| Employer hủy | 40% | 400,000đ |
