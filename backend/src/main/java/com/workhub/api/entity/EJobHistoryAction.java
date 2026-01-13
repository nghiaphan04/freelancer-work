package com.workhub.api.entity;

public enum EJobHistoryAction {
    // Employer actions
    JOB_CREATED,           // Tạo job
    JOB_UPDATED,           // Cập nhật job
    JOB_SUBMITTED,         // Gửi duyệt
    JOB_OPENED,            // Mở tuyển
    JOB_CLOSED,            // Đóng tuyển
    APPLICATION_ACCEPTED,  // Duyệt ứng viên
    APPLICATION_REJECTED,  // Từ chối ứng viên
    WORK_APPROVED,         // Duyệt công việc hoàn thành
    WORK_REJECTED,         // Yêu cầu làm lại
    PAYMENT_RELEASED,      // Thanh toán cho freelancer

    // Freelancer actions
    APPLICATION_SUBMITTED, // Nộp đơn ứng tuyển
    APPLICATION_WITHDRAWN, // Rút đơn ứng tuyển
    WORK_STARTED,          // Bắt đầu làm việc
    WORK_SUBMITTED,        // Nộp bài/sản phẩm
    WORK_REVISED,          // Nộp lại sau chỉnh sửa

    // System actions
    JOB_APPROVED,          // Admin duyệt job
    JOB_REJECTED,          // Admin từ chối job
    JOB_COMPLETED,         // Job hoàn thành
    JOB_CANCELLED,         // Job bị hủy

    // Withdrawal actions
    WITHDRAWAL_REQUESTED,  // Tạo yêu cầu rút/hủy
    WITHDRAWAL_APPROVED,   // Chấp nhận yêu cầu rút/hủy
    WITHDRAWAL_REJECTED,   // Từ chối yêu cầu rút/hủy
    WITHDRAWAL_CANCELLED,  // Hủy yêu cầu của mình

    // Timeout actions
    FREELANCER_TIMEOUT,    // Freelancer không nộp đúng hạn
    EMPLOYER_TIMEOUT,      // Employer không review đúng hạn
    JOB_REOPENED,          // Job được mở lại
    AUTO_APPROVED,         // Tự động duyệt do timeout

    // Dispute actions (TH3)
    DISPUTE_CREATED,       // Employer tạo khiếu nại
    DISPUTE_RESPONSE_SUBMITTED,  // Freelancer phản hồi
    DISPUTE_RESOLVED       // Admin quyết định tranh chấp
}
