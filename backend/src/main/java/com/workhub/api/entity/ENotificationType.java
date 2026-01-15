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
    
    // Work submission notifications
    WORK_SUBMITTED,           // Freelancer nộp sản phẩm
    WORK_APPROVED,            // Employer duyệt sản phẩm
    WORK_REVISION_REQUESTED,  // Employer yêu cầu chỉnh sửa
    PAYMENT_RELEASED,         // Thanh toán đã được chuyển
    JOB_COMPLETED,            // Công việc hoàn thành
    
    // Timeout notifications
    WORK_SUBMISSION_TIMEOUT,  // Freelancer không nộp đúng hạn → bị clear
    WORK_REVIEW_TIMEOUT,      // Employer không review đúng hạn → auto approve
    JOB_REOPENED,             // Job được mở lại sau khi clear freelancer
    
    // Dispute notifications (TH3)
    DISPUTE_CREATED,          // Employer tạo khiếu nại
    DISPUTE_RESPONSE_REQUESTED,  // Admin yêu cầu freelancer phản hồi
    DISPUTE_RESPONSE_SUBMITTED,  // Freelancer đã gửi phản hồi
    DISPUTE_RESOLVED_WIN,     // Bạn thắng tranh chấp
    DISPUTE_RESOLVED_LOSE,    // Bạn thua tranh chấp
    
    // Chat/Friend notifications
    CHAT_REQUEST_RECEIVED,    // Nhận được yêu cầu kết bạn
    CHAT_REQUEST_ACCEPTED,    // Yêu cầu kết bạn được chấp nhận
    CHAT_REQUEST_REJECTED,    // Yêu cầu kết bạn bị từ chối
    CHAT_BLOCKED,             // Bị chặn bởi người dùng
    
    // General
    SYSTEM                    // Thông báo hệ thống
}
