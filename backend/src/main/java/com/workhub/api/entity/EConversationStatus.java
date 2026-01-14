package com.workhub.api.entity;

public enum EConversationStatus {
    PENDING,    // Đang chờ accept
    ACCEPTED,   // Đã accept, có thể chat thoải mái
    REJECTED,   // Bị từ chối
    BLOCKED     // Bị block
}
