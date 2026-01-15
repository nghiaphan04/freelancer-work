package com.workhub.api.entity;

public enum EWithdrawalRequestStatus {
    PENDING,      // Đang chờ bên kia xác nhận
    APPROVED,     // Đã được chấp nhận
    REJECTED,     // Bị từ chối
    CANCELLED     // Người tạo hủy yêu cầu
}
