package com.workhub.api.entity;
public enum EJobStatus {
    DRAFT,              // Bản nháp
    PENDING_APPROVAL,   // Chờ admin duyệt
    OPEN,               // Đang tuyển (đã duyệt)
    REJECTED,           // Admin từ chối
    IN_PROGRESS,        // Đang thực hiện
    COMPLETED,          // Hoàn thành
    CLOSED,
    CANCELLED
}
