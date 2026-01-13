package com.workhub.api.entity;

public enum ENotificationType {
    // Freelancer notifications
    APPLICATION_ACCEPTED,      // Đơn ứng tuyển được chấp nhận
    APPLICATION_REJECTED,      // Đơn ứng tuyển bị từ chối
    
    // Employer notifications  
    NEW_APPLICATION,           // Có freelancer mới ứng tuyển
    JOB_APPROVED,             // Job được admin duyệt
    JOB_REJECTED,             // Job bị admin từ chối
    
    // General
    SYSTEM                    // Thông báo hệ thống
}
