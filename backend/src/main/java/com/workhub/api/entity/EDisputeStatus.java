package com.workhub.api.entity;

public enum EDisputeStatus {
    PENDING_FREELANCER_RESPONSE,  // Chờ freelancer phản hồi
    PENDING_ADMIN_DECISION,       // Chờ admin quyết định
    EMPLOYER_WON,                 // Employer thắng
    FREELANCER_WON,               // Freelancer thắng
    CANCELLED                     // Đã hủy
}
