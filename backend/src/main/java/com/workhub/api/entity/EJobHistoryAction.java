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
    JOB_CANCELLED          // Job bị hủy
}
