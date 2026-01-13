package com.workhub.api.entity;

public enum ENotificationType {
    // Freelancer notifications
    APPLICATION_ACCEPTED,      // Đơn ứng tuyển được chấp nhận
    APPLICATION_REJECTED,      // Đơn ứng tuyển bị từ chối
    
    // Employer notifications  
    NEW_APPLICATION,           // Có freelancer mới ứng tuyển
    JOB_APPROVED,             // Job được admin duyệt
    JOB_REJECTED,             // Job bị admin từ chối
    
    // Withdrawal notifications
    WITHDRAWAL_REQUESTED,      // Có yêu cầu rút/hủy mới
    WITHDRAWAL_APPROVED,       // Yêu cầu rút/hủy được chấp nhận
    WITHDRAWAL_REJECTED,       // Yêu cầu rút/hủy bị từ chối
    JOB_CANCELLED,            // Công việc đã bị hủy
    
    // General
    SYSTEM                    // Thông báo hệ thống
}
