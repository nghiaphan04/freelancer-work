package com.workhub.api.entity;

public enum ENotificationType {
    // Freelancer notifications
    APPLICATION_ACCEPTED,      // Đơn ứng tuyển được chấp nhận
    APPLICATION_REJECTED,      // Đơn ứng tuyển bị từ chối
    
    // Employer notifications  
    NEW_APPLICATION,           // Có freelancer mới ứng tuyển
    
    // Job approval notifications
    JOB_APPROVED,              // Công việc được admin duyệt
    JOB_REJECTED,              // Công việc bị admin từ chối
    
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
    CONTRACT_SIGNING_TIMEOUT, // Freelancer không ký hợp đồng trong 24h
    WORK_SUBMISSION_TIMEOUT,  // Freelancer không nộp đúng hạn → bị clear
    WORK_REVIEW_TIMEOUT,      // Employer không review đúng hạn → auto approve
    JOB_REOPENED,             // Job được mở lại sau khi clear freelancer
    JOB_EXPIRED,              // Hết hạn ứng tuyển - đã hoàn tiền cho poster
    ADMIN_VOTE_TIMEOUT,       // Admin không vote đúng hạn
    BLOCKCHAIN_FAILED,        // Blockchain transaction failed
    
    // Dispute notifications (TH3)
    DISPUTE_CREATED,
    DISPUTE_RESPONSE_REQUESTED,
    DISPUTE_RESPONSE_SUBMITTED,
    DISPUTE_RESOLVED_WIN,
    DISPUTE_RESOLVED_LOSE,
    ADMIN_SELECTED_FOR_DISPUTE,
    SIGNATURE_REQUIRED,
    SIGNATURES_COLLECTED,
    PENDING_BLOCKCHAIN_ACTION,
    DISPUTE_CAN_CLAIM,         // Winner có thể claim tiền
    CAN_REMOVE_FREELANCER,     // Employer có thể xóa freelancer do timeout
    CAN_CLAIM_PAYMENT,         // Freelancer có thể claim thanh toán do employer timeout
    
    // Chat/Friend notifications
    CHAT_REQUEST_RECEIVED,    // Nhận được yêu cầu kết bạn
    CHAT_REQUEST_ACCEPTED,    // Yêu cầu kết bạn được chấp nhận
    CHAT_REQUEST_REJECTED,    // Yêu cầu kết bạn bị từ chối
    CHAT_BLOCKED,             // Bị chặn bởi người dùng
    
    // General
    SYSTEM                    // Thông báo hệ thống
}
