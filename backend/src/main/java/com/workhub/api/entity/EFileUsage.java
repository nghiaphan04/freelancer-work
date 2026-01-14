package com.workhub.api.entity;

/**
 * Mục đích sử dụng của file - dùng để phân loại và quản lý
 */
public enum EFileUsage {
    // User profile
    AVATAR,             // Ảnh đại diện user
    COVER_IMAGE,        // Ảnh bìa profile
    
    // Messenger
    MESSAGE_IMAGE,      // Ảnh trong tin nhắn
    MESSAGE_FILE,       // File đính kèm tin nhắn
    
    // Job
    JOB_ATTACHMENT,     // File đính kèm job description
    
    // Application
    APPLICATION_CV,     // CV ứng tuyển
    WORK_SUBMISSION,    // File nộp sản phẩm
    
    // Dispute
    DISPUTE_EVIDENCE,   // Bằng chứng tranh chấp
    
    // Other
    OTHER               // Khác
}
