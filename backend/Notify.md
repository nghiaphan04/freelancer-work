# Notification System Documentation

## 1. Flow tổng quan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NOTIFICATION SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Các Service gọi NotificationService.notifyXxx() khi có sự kiện             │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐                  │
│  │ JobService  │  │ Withdrawal  │  │ (Các service khác)  │                  │
│  │             │  │   Service   │  │                     │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘                  │
│         │                │                    │                             │
│         └────────────────┼────────────────────┘                             │
│                          │                                                  │
│                          ▼                                                  │
│                ┌───────────────────┐                                        │
│                │NotificationService│                                        │
│                │ .notifyXxx()      │                                        │
│                └─────────┬─────────┘                                        │
│                          │                                                  │
│                          ▼                                                  │
│                ┌───────────────────┐                                        │
│                │NotificationRepo   │                                        │
│                └─────────┬─────────┘                                        │
│                          │                                                  │
│                          ▼                                                  │
│                ┌───────────────────┐      ┌───────────────────┐             │
│                │   notifications   │      │  NotificationCtrl │             │
│                │     (Table)       │◄─────│   (REST API)      │◄── Client   │
│                └───────────────────┘      └───────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Các loại Notification

```
FREELANCER nhận:
  APPLICATION_ACCEPTED     ← Đơn được duyệt
  APPLICATION_REJECTED     ← Đơn bị từ chối
  WITHDRAWAL_REQUESTED     ← Employer muốn hủy job
  WITHDRAWAL_APPROVED      ← Yêu cầu rút được chấp nhận
  WITHDRAWAL_REJECTED      ← Yêu cầu rút bị từ chối

EMPLOYER nhận:
  NEW_APPLICATION          ← Có người ứng tuyển
  JOB_APPROVED             ← Job được admin duyệt
  JOB_REJECTED             ← Job bị admin từ chối
  WITHDRAWAL_REQUESTED     ← Freelancer muốn rút
  WITHDRAWAL_APPROVED      ← Yêu cầu hủy được chấp nhận
  WITHDRAWAL_REJECTED      ← Yêu cầu hủy bị từ chối
  JOB_CANCELLED            ← Job bị hủy, escrow hoàn lại

CHUNG:
  SYSTEM                   ← Thông báo hệ thống
```

## 3. Code files

### Backend

```
backend/src/main/java/com/workhub/api/
├── entity/
│   ├── ENotificationType.java           ← Enum các loại notify
│   └── Notification.java                ← Entity chính
├── repository/
│   └── NotificationRepository.java      ← JPA Repository
├── dto/response/
│   └── NotificationResponse.java        ← DTO response + getTypeLabel()
├── service/
│   └── NotificationService.java         ← notifyXxx() methods
└── controller/
    └── NotificationController.java      ← REST API
```

### Frontend

```
client/
├── lib/
│   └── api.ts                           ← NotificationType + NOTIFICATION_TYPE_CONFIG
│                                        ← API methods
└── components/layout/
    ├── Header.tsx                       ← Tích hợp NotificationDropdown
    └── NotificationDropdown.tsx         ← Component chuông thông báo
```

## 4. API Endpoints

| Method | URL | Mô tả |
|--------|-----|-------|
| GET | `/api/notifications` | Lấy 20 thông báo mới nhất |
| GET | `/api/notifications/paged` | Lấy phân trang |
| GET | `/api/notifications/unread-count` | Đếm chưa đọc |
| PATCH | `/api/notifications/{id}/read` | Đánh dấu đã đọc |
| PATCH | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc |

## 5. Khi nào gửi Notification

| Sự kiện | Người nhận | Type |
|---------|------------|------|
| Freelancer ứng tuyển | Employer | NEW_APPLICATION |
| Employer duyệt đơn | Freelancer | APPLICATION_ACCEPTED |
| Employer từ chối đơn | Freelancer | APPLICATION_REJECTED |
| Admin duyệt job | Employer | JOB_APPROVED |
| Admin từ chối job | Employer | JOB_REJECTED |
| Freelancer tạo yêu cầu rút | Employer | WITHDRAWAL_REQUESTED |
| Employer tạo yêu cầu hủy | Freelancer | WITHDRAWAL_REQUESTED |
| Chấp nhận yêu cầu rút/hủy | Người tạo yêu cầu | WITHDRAWAL_APPROVED |
| Từ chối yêu cầu rút/hủy | Người tạo yêu cầu | WITHDRAWAL_REJECTED |
| Job bị hủy | Employer | JOB_CANCELLED |
