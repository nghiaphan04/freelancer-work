package com.workhub.api.entity;

public enum EMessageStatus {
    SENT,       // Đã gửi - chưa đến receiver
    DELIVERED,  // Đã nhận - receiver online nhưng chưa xem
    READ        // Đã xem - receiver đã mở conversation
}
