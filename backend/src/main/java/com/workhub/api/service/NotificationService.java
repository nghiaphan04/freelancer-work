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
                .title("Có người ứng tuyển mới")
                .message(freelancer.getFullName() + " đã ứng tuyển vào công việc \"" + job.getTitle() + "\"")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

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

    @Transactional
    public void notifyWithdrawalRejected(User requester, Job job, User responder) {
        Notification notification = Notification.builder()
                .user(requester)
                .type(ENotificationType.WITHDRAWAL_REJECTED)
                .title("Yêu cầu bị từ chối")
                .message(responder.getFullName() + " đã từ chối yêu cầu của bạn cho công việc \"" + job.getTitle() + "\"")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

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

    @Transactional
    public void notifyJobCancelled(User employer, Job job) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.JOB_CANCELLED)
                .title("Công việc đã bị hủy")
                .message("Công việc \"" + job.getTitle() + "\" đã bị hủy")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyWorkSubmitted(User employer, Job job, User freelancer) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.WORK_SUBMITTED)
                .title("Có sản phẩm mới nộp")
                .message(freelancer.getFullName() + " đã nộp sản phẩm cho công việc \"" + job.getTitle() + "\"")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyWorkApproved(User freelancer, Job job) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.WORK_APPROVED)
                .title("Sản phẩm được duyệt")
                .message("Sản phẩm của bạn cho công việc \"" + job.getTitle() + "\" đã được duyệt")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

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

    @Transactional
    public void notifyPaymentReleased(User freelancer, Job job, String amount) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.PAYMENT_RELEASED)
                .title("Đã nhận thanh toán")
                .message("Bạn đã nhận được " + amount + " cho công việc \"" + job.getTitle() + "\"")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyJobCompleted(User user, Job job) {
        Notification notification = Notification.builder()
                .user(user)
                .type(ENotificationType.JOB_COMPLETED)
                .title("Công việc hoàn thành")
                .message("Công việc \"" + job.getTitle() + "\" đã hoàn thành thành công")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyJobExpired(User employer, Job job) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.JOB_EXPIRED)
                .title("Công việc hết hạn ứng tuyển")
                .message("Công việc \"" + job.getTitle() + "\" đã hết hạn ứng tuyển. Tiền ký quỹ đã được hoàn trả.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifySigningTimeout(User freelancer, Job job) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.CONTRACT_SIGNING_TIMEOUT)
                .title("Quá hạn ký hợp đồng")
                .message("Bạn đã không ký hợp đồng trong 1p30s cho công việc \"" + job.getTitle() + "\"")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyWorkSubmissionTimeout(User freelancer, Job job) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.WORK_SUBMISSION_TIMEOUT)
                .title("Quá hạn nộp sản phẩm")
                .message("Bạn đã không nộp sản phẩm đúng hạn cho công việc \"" + job.getTitle() + "\"")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyFreelancerCleared(User employer, Job job, User freelancer) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.JOB_REOPENED)
                .title("Công việc được mở lại")
                .message("Freelancer " + freelancer.getFullName() + " đã không nộp sản phẩm đúng hạn. Công việc đã được mở lại.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyWorkReviewTimeout(User employer, Job job) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.WORK_REVIEW_TIMEOUT)
                .title("Quá hạn duyệt sản phẩm")
                .message("Bạn đã không duyệt sản phẩm đúng hạn cho công việc \"" + job.getTitle() + "\"")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyAutoApproved(User freelancer, Job job, String amount) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.WORK_APPROVED)
                .title("Sản phẩm được tự động duyệt")
                .message("Hệ thống đã tự động duyệt và bạn đã nhận được " + amount + " cho công việc \"" + job.getTitle() + "\"")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyDisputeCreated(User freelancer, Job job, User employer) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.DISPUTE_CREATED)
                .title("Có khiếu nại mới")
                .message(employer.getFullName() + " đã tạo khiếu nại về sản phẩm của bạn cho công việc \"" + job.getTitle() + "\"")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyDisputeResponseRequested(User freelancer, Job job, int daysToRespond) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.DISPUTE_RESPONSE_REQUESTED)
                .title("Yêu cầu phản hồi khiếu nại")
                .message("Admin yêu cầu bạn phản hồi khiếu nại cho công việc \"" + job.getTitle() + "\" trong vòng " + daysToRespond + " ngày")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyDisputeResponseSubmitted(User employer, Job job, User freelancer) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.DISPUTE_RESPONSE_SUBMITTED)
                .title("Freelancer đã phản hồi khiếu nại")
                .message(freelancer.getFullName() + " đã gửi phản hồi cho khiếu nại của bạn về công việc \"" + job.getTitle() + "\"")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyDisputeResolvedWin(User winner, Job job, String amount) {
        Notification notification = Notification.builder()
                .user(winner)
                .type(ENotificationType.DISPUTE_RESOLVED_WIN)
                .title("Bạn thắng tranh chấp")
                .message("Chúc mừng! Bạn đã thắng tranh chấp cho công việc \"" + job.getTitle() + "\". Số tiền " + amount + " đã được chuyển cho bạn.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyDisputeResolvedLose(User loser, Job job) {
        Notification notification = Notification.builder()
                .user(loser)
                .type(ENotificationType.DISPUTE_RESOLVED_LOSE)
                .title("Bạn thua tranh chấp")
                .message("Rất tiếc, bạn đã thua tranh chấp cho công việc \"" + job.getTitle() + "\"")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyAdminSelectedForDispute(User admin, Job job, int roundNumber) {
        Notification notification = Notification.builder()
                .user(admin)
                .type(ENotificationType.ADMIN_SELECTED_FOR_DISPUTE)
                .title("Bạn được chọn xét xử tranh chấp")
                .message("Bạn được chọn xét xử tranh chấp Round " + roundNumber + " cho công việc \"" + job.getTitle() + "\". Bạn có 3 phút để vote.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

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

    @Transactional
    public void notifyChatRequestAccepted(User initiator, User accepter, Long conversationId) {
        Notification notification = Notification.builder()
                .user(initiator)
                .type(ENotificationType.CHAT_REQUEST_ACCEPTED)
                .title("Yêu cầu kết bạn được chấp nhận")
                .message(accepter.getFullName() + " đã chấp nhận yêu cầu kết bạn của bạn")
                .referenceId(conversationId)
                .referenceType("CONVERSATION")
                .build();
        notificationRepository.save(notification);
    }

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

    @Transactional
    public void notifyChatBlocked(User blockedUser, User blocker) {
        Notification notification = Notification.builder()
                .user(blockedUser)
                .type(ENotificationType.CHAT_BLOCKED)
                .title("Bạn đã bị chặn")
                .message(blocker.getFullName() + " đã chặn bạn")
                .referenceType("USER")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifySignatureRequired(User user, Job job, String role) {
        String roleLabel = switch (role) {
            case "employer" -> "người thuê";
            case "freelancer" -> "người làm";
            case "admin" -> "quản trị viên";
            default -> role;
        };
        Notification notification = Notification.builder()
                .user(user)
                .type(ENotificationType.SIGNATURE_REQUIRED)
                .title("Yêu cầu ký xác nhận tranh chấp")
                .message("Vui lòng ký xác nhận quyết định tranh chấp cho công việc \"" + job.getTitle() + "\" với vai trò " + roleLabel)
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyAllSignaturesCollected(User user, Job job) {
        Notification notification = Notification.builder()
                .user(user)
                .type(ENotificationType.SIGNATURES_COLLECTED)
                .title("Đã thu thập đủ chữ ký")
                .message("Tất cả các bên đã ký xác nhận quyết định tranh chấp cho công việc \"" + job.getTitle() + "\". Đang xử lý.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyPendingBlockchainAction(User user, Job job, String actionType) {
        Notification notification = Notification.builder()
                .user(user)
                .type(ENotificationType.PENDING_BLOCKCHAIN_ACTION)
                .title("Cần xử lý hệ thống")
                .message("Công việc \"" + job.getTitle() + "\" cần xử lý " + actionType)
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyCanClaimTimeoutWin(User employer, Job job) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.DISPUTE_CAN_CLAIM)
                .title("Có thể nhận thắng tranh chấp")
                .message("Freelancer không phản hồi trong thời hạn cho công việc \"" + job.getTitle() + "\". Bạn có thể claim thắng ngay!")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyLostDueToTimeout(User freelancer, Job job) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.DISPUTE_RESOLVED_LOSE)
                .title("Thua tranh chấp do không phản hồi")
                .message("Bạn đã thua tranh chấp cho công việc \"" + job.getTitle() + "\" do không gửi bằng chứng trong thời hạn.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyCanClaimRefund(User winner, Job job, String amount) {
        Notification notification = Notification.builder()
                .user(winner)
                .type(ENotificationType.DISPUTE_CAN_CLAIM)
                .title("Có thể nhận tiền hoàn trả")
                .message("Bạn đã thắng tranh chấp cho công việc \"" + job.getTitle() + "\". Nhận " + amount + " ngay!")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyEmployerCanRemoveFreelancer(User employer, Job job) {
        Notification notification = Notification.builder()
                .user(employer)
                .type(ENotificationType.CAN_REMOVE_FREELANCER)
                .title("Có thể xóa freelancer")
                .message("Freelancer không thực hiện đúng hạn cho công việc \"" + job.getTitle() + "\". Bạn có thể xóa freelancer và tuyển người mới.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyFreelancerCanClaimPayment(User freelancer, Job job) {
        Notification notification = Notification.builder()
                .user(freelancer)
                .type(ENotificationType.CAN_CLAIM_PAYMENT)
                .title("Có thể nhận thanh toán")
                .message("Employer không duyệt đúng hạn cho công việc \"" + job.getTitle() + "\". Bạn có thể claim thanh toán ngay!")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyAdminVoteTimeout(User admin, Job job, int roundNumber) {
        Notification notification = Notification.builder()
                .user(admin)
                .type(ENotificationType.ADMIN_VOTE_TIMEOUT)
                .title("Hết thời gian vote")
                .message("Bạn đã không vote đúng hạn cho tranh chấp Round " + roundNumber + " công việc \"" + job.getTitle() + "\". Đã chuyển cho admin khác.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyBlockchainFailed(User user, Job job, String action) {
        Notification notification = Notification.builder()
                .user(user)
                .type(ENotificationType.BLOCKCHAIN_FAILED)
                .title("Lỗi blockchain")
                .message("Giao dịch " + action + " thất bại cho công việc \"" + job.getTitle() + "\". Vui lòng liên hệ hỗ trợ.")
                .referenceId(job.getId())
                .referenceType("JOB")
                .build();
        notificationRepository.save(notification);
    }
}
