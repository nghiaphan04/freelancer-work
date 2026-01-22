package com.workhub.api.entity;
public enum EJobStatus {
    DRAFT,              // Bản nháp
    OPEN,               // Đang tuyển (escrow đã tạo trên blockchain)
    PENDING_SIGNATURE,  // Chờ freelancer ký hợp đồng
    IN_PROGRESS,        // Đang thực hiện
    DISPUTED,           // Đang tranh chấp (job bị khóa)
    COMPLETED,          // Hoàn thành
    CLOSED,
    CANCELLED,
    
    // Timeout statuses - user needs to sign blockchain transaction
    SIGNING_TIMEOUT,    // Freelancer không ký - employer có thể remove
    WORK_TIMEOUT,       // Freelancer không nộp - employer có thể remove
    REVIEW_TIMEOUT,     // Employer không duyệt - freelancer có thể claim
    
    EXPIRED             // Hết hạn ứng tuyển - đã hoàn tiền cho poster
}
