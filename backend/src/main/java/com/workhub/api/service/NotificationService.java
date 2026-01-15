package com.workhub.api.service;

import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.NotificationResponse;
import com.workhub.api.entity.*;
import com.workhub.api.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final NotificationRepository notificationRepository;

    public ApiResponse<List<NotificationResponse>> getRecentNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId);
        List<NotificationResponse> responses = notifications.stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
        return ApiResponse.success("Thành công", responses);
    }

    public ApiResponse<Page<NotificationResponse>> getNotifications(Long userId, int page, int size) {
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size));
        Page<NotificationResponse> responses = notifications.map(NotificationResponse::fromEntity);
        return ApiResponse.success("Thành công", responses);
    }

    public ApiResponse<Long> getUnreadCount(Long userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        return ApiResponse.success("Thành công", count);
    }

    @Transactional
    public ApiResponse<Void> markAsRead(Long notificationId, Long userId) {
        int updated = notificationRepository.markAsRead(notificationId, userId);
        if (updated > 0) {
            return ApiResponse.success("Đã đánh dấu đã đọc", null);
        }
        return ApiResponse.error("Không tìm thấy thông báo");
    }

    @Transactional
    public ApiResponse<Void> markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
        return ApiResponse.success("Đã đánh dấu tất cả đã đọc", null);
    }

    @Transactional
    public void notifyApplicationAccepted(User freelancer, Job job) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.APPLICATION_ACCEPTED)
                .title("Đơn ứng tuyển được chấp nhận")
                .message("Chúc mừng! Đơn ứng tuyển của bạn cho công việc \"" + job.getTitle() + "\" đã được chấp nhận.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyApplicationRejected(User freelancer, Job job) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.APPLICATION_REJECTED)
                .title("Đơn ứng tuyển bị từ chối")
                .message("Đơn ứng tuyển của bạn cho công việc \"" + job.getTitle() + "\" đã bị từ chối.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyNewApplication(User employer, Job job, User freelancer) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.NEW_APPLICATION)
                .title("Có ứng viên mới")
                .message(freelancer.getFullName() + " đã ứng tuyển vào công việc \"" + job.getTitle() + "\"")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyJobApproved(User employer, Job job) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.JOB_APPROVED)
                .title("Công việc đã được duyệt")
                .message("Công việc \"" + job.getTitle() + "\" đã được duyệt và hiển thị công khai.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyJobRejected(User employer, Job job, String reason) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.JOB_REJECTED)
                .title("Công việc bị từ chối")
                .message("Công việc \"" + job.getTitle() + "\" đã bị từ chối. Lý do: " + reason)
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    // ==================== WITHDRAWAL NOTIFICATIONS ====================

    /**
     * Thông báo cho đối phương khi có yêu cầu rút/hủy mới
     */
    @Transactional
    public void notifyWithdrawalRequested(User recipient, Job job, User requester, boolean isFreelancerRequest) {
        String requestType = isFreelancerRequest ? "rút khỏi" : "hủy";
        Notification notification = Notification.builder()
                .user(recipient)
                .type(ENotificationType.WITHDRAWAL_REQUESTED)
                .title("Có yêu cầu " + requestType + " công việc")
                .message(requester.getFullName() + " đã gửi yêu cầu " + requestType + " công việc \"" + job.getTitle() + "\"")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo cho người tạo yêu cầu khi bị từ chối
     */
    @Transactional
    public void notifyWithdrawalRejected(User requester, Job job, User responder) {
        Notification notification = Notification.builder()
                .user(requester)
                .type(ENotificationType.WITHDRAWAL_REJECTED)
                .title("Yêu cầu bị từ chối")
                .message(responder.getFullName() + " đã từ chối yêu cầu của bạn cho công việc \"" + job.getTitle() + "\". Tiền phạt đã được hoàn lại.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo cho người tạo yêu cầu khi được chấp nhận
     */
    @Transactional
    public void notifyWithdrawalApproved(User requester, Job job, User responder) {
        Notification notification = Notification.builder()
                .user(requester)
                .type(ENotificationType.WITHDRAWAL_APPROVED)
                .title("Yêu cầu được chấp nhận")
                .message(responder.getFullName() + " đã chấp nhận yêu cầu của bạn. Công việc \"" + job.getTitle() + "\" đã được hủy.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo cho employer khi job bị hủy (nhận lại tiền escrow)
     */
    @Transactional
    public void notifyJobCancelled(User employer, Job job) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.JOB_CANCELLED)
                .title("Công việc đã bị hủy")
                .message("Công việc \"" + job.getTitle() + "\" đã bị hủy. Tiền escrow đã được hoàn lại vào số dư của bạn.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    // ==================== WORK SUBMISSION NOTIFICATIONS ====================

    /**
     * Thông báo cho employer khi freelancer nộp sản phẩm
     */
    @Transactional
    public void notifyWorkSubmitted(User employer, Job job, User freelancer) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.WORK_SUBMITTED)
                .title("Có sản phẩm mới nộp")
                .message(freelancer.getFullName() + " đã nộp sản phẩm cho công việc \"" + job.getTitle() + "\". Vui lòng kiểm tra và duyệt.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo cho freelancer khi employer duyệt sản phẩm
     */
    @Transactional
    public void notifyWorkApproved(User freelancer, Job job) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.WORK_APPROVED)
                .title("Sản phẩm được duyệt")
                .message("Sản phẩm của bạn cho công việc \"" + job.getTitle() + "\" đã được duyệt. Thanh toán đang được xử lý.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo cho freelancer khi employer yêu cầu chỉnh sửa
     */
    @Transactional
    public void notifyWorkRevisionRequested(User freelancer, Job job, String note) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.WORK_REVISION_REQUESTED)
                .title("Yêu cầu chỉnh sửa")
                .message("Employer yêu cầu chỉnh sửa sản phẩm cho công việc \"" + job.getTitle() + "\". Ghi chú: " + note)
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo cho freelancer khi nhận được thanh toán
     */
    @Transactional
    public void notifyPaymentReleased(User freelancer, Job job, String amount) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.PAYMENT_RELEASED)
                .title("Đã nhận thanh toán")
                .message("Bạn đã nhận được " + amount + " VND cho công việc \"" + job.getTitle() + "\".")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo cho cả 2 bên khi job hoàn thành
     */
    @Transactional
    public void notifyJobCompleted(User user, Job job) {
        Notification notification = Notification.builder()
                .user(user)
                .type(ENotificationType.JOB_COMPLETED)
                .title("Công việc hoàn thành")
                .message("Công việc \"" + job.getTitle() + "\" đã hoàn thành thành công. Điểm uy tín của bạn đã được +1.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    // ==================== TIMEOUT NOTIFICATIONS  ====================

    /**
     * Thông báo cho freelancer khi bị clear do quá hạn nộp sản phẩm
     */
    @Transactional
    public void notifyWorkSubmissionTimeout(User freelancer, Job job) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.WORK_SUBMISSION_TIMEOUT)
                .title("Quá hạn nộp sản phẩm")
                .message("Bạn đã không nộp sản phẩm đúng hạn cho công việc \"" + job.getTitle() + "\". Bạn đã bị loại khỏi công việc này và điểm không uy tín +1.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo cho employer khi freelancer bị clear do timeout
     */
    @Transactional
    public void notifyFreelancerCleared(User employer, Job job, User freelancer) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.JOB_REOPENED)
                .title("Công việc được mở lại")
                .message("Freelancer " + freelancer.getFullName() + " đã không nộp sản phẩm đúng hạn cho công việc \"" + job.getTitle() + "\". Công việc đã được mở lại để tuyển freelancer mới.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo cho employer khi hệ thống tự động duyệt do quá hạn review
     */
    @Transactional
    public void notifyWorkReviewTimeout(User employer, Job job) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.WORK_REVIEW_TIMEOUT)
                .title("Quá hạn duyệt sản phẩm")
                .message("Bạn đã không duyệt sản phẩm đúng hạn cho công việc \"" + job.getTitle() + "\". Hệ thống đã tự động duyệt và thanh toán cho freelancer.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo cho freelancer khi employer quá hạn review → auto approve
     */
    @Transactional
    public void notifyAutoApproved(User freelancer, Job job, String amount) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.WORK_APPROVED)
                .title("Sản phẩm được tự động duyệt")
                .message("Employer đã không duyệt sản phẩm đúng hạn. Hệ thống đã tự động duyệt và bạn đã nhận được " + amount + " VND cho công việc \"" + job.getTitle() + "\".")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    // ==================== DISPUTE NOTIFICATIONS (TH3) ====================

    /**
     * Thông báo cho freelancer khi employer tạo khiếu nại
     */
    @Transactional
    public void notifyDisputeCreated(User freelancer, Job job, User employer) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.DISPUTE_CREATED)
                .title("Có khiếu nại mới")
                .message(employer.getFullName() + " đã tạo khiếu nại về sản phẩm của bạn cho công việc \"" + job.getTitle() + "\". Công việc đã bị khóa, chờ admin xử lý.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo cho freelancer khi admin yêu cầu phản hồi
     */
    @Transactional
    public void notifyDisputeResponseRequested(User freelancer, Job job, int daysToRespond) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.DISPUTE_RESPONSE_REQUESTED)
                .title("Yêu cầu phản hồi khiếu nại")
                .message("Admin yêu cầu bạn phản hồi khiếu nại cho công việc \"" + job.getTitle() + "\" trong vòng " + daysToRespond + " ngày. Vui lòng gửi bằng chứng và giải thích.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo cho employer khi freelancer đã gửi phản hồi
     */
    @Transactional
    public void notifyDisputeResponseSubmitted(User employer, Job job, User freelancer) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.DISPUTE_RESPONSE_SUBMITTED)
                .title("Freelancer đã phản hồi khiếu nại")
                .message(freelancer.getFullName() + " đã gửi phản hồi cho khiếu nại của bạn về công việc \"" + job.getTitle() + "\". Chờ admin quyết định.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo cho bên thắng tranh chấp
     */
    @Transactional
    public void notifyDisputeResolvedWin(User winner, Job job, String amount) {
        Notification notification = Notification.builder()
                .user(winner)
                .type(ENotificationType.DISPUTE_RESOLVED_WIN)
                .title("Bạn thắng tranh chấp")
                .message("Chúc mừng! Bạn đã thắng tranh chấp cho công việc \"" + job.getTitle() + "\". Số tiền " + amount + " VND đã được chuyển vào tài khoản của bạn.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo cho bên thua tranh chấp
     */
    @Transactional
    public void notifyDisputeResolvedLose(User loser, Job job) {
        Notification notification = Notification.builder()
                .user(loser)
                .type(ENotificationType.DISPUTE_RESOLVED_LOSE)
                .title("Bạn thua tranh chấp")
                .message("Rất tiếc, bạn đã thua tranh chấp cho công việc \"" + job.getTitle() + "\". Điểm uy tín của bạn đã bị trừ 1 và điểm không uy tín đã tăng 1.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    // ==================== CHAT/FRIEND NOTIFICATIONS ====================

    /**
     * Thông báo khi nhận được yêu cầu kết bạn
     */
    @Transactional
    public void notifyChatRequestReceived(User receiver, User sender, Long conversationId) {
        Notification notification = Notification.builder()
                .user(receiver)
                .type(ENotificationType.CHAT_REQUEST_RECEIVED)
                .title("Có yêu cầu kết bạn mới")
                .message(sender.getFullName() + " đã gửi yêu cầu kết bạn cho bạn.")
                .referenceId(conversationId)
                .referenceType("CONVERSATION")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo khi yêu cầu kết bạn được chấp nhận
     */
    @Transactional
    public void notifyChatRequestAccepted(User initiator, User accepter, Long conversationId) {
        Notification notification = Notification.builder()
                .user(initiator)
                .type(ENotificationType.CHAT_REQUEST_ACCEPTED)
                .title("Yêu cầu kết bạn được chấp nhận")
                .message(accepter.getFullName() + " đã chấp nhận yêu cầu kết bạn của bạn. Bạn có thể bắt đầu nhắn tin ngay!")
                .referenceId(conversationId)
                .referenceType("CONVERSATION")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo khi yêu cầu kết bạn bị từ chối
     */
    @Transactional
    public void notifyChatRequestRejected(User initiator, User rejecter, Long conversationId) {
        Notification notification = Notification.builder()
                .user(initiator)
                .type(ENotificationType.CHAT_REQUEST_REJECTED)
                .title("Yêu cầu kết bạn bị từ chối")
                .message(rejecter.getFullName() + " đã từ chối yêu cầu kết bạn của bạn.")
                .referenceId(conversationId)
                .referenceType("CONVERSATION")
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Thông báo khi bị chặn
     */
    @Transactional
    public void notifyChatBlocked(User blockedUser, User blocker) {
        Notification notification = Notification.builder()
                .user(blockedUser)
                .type(ENotificationType.CHAT_BLOCKED)
                .title("Bạn đã bị chặn")
                .message(blocker.getFullName() + " đã chặn bạn. Bạn không thể gửi tin nhắn cho người này nữa.")
                .referenceType("USER")
                .build();
        notificationRepository.save(notification);
    }
}
