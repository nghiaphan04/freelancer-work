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
}
