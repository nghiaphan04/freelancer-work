package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Người gửi request (khởi tạo conversation)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiator_id", nullable = false)
    private User initiator;

    // Người nhận request
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EConversationStatus status = EConversationStatus.PENDING;

    @Column(name = "blocked_by_id")
    private Long blockedById;

    @Column(name = "first_message", columnDefinition = "TEXT")
    private String firstMessage;

    @Column(name = "last_message")
    private String lastMessage;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_message_type")
    private EMessageType lastMessageType;

    @Column(name = "last_message_deleted")
    @Builder.Default
    private Boolean lastMessageDeleted = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_message_status")
    private EMessageStatus lastMessageStatus;

    @Column(name = "last_message_id")
    private Long lastMessageId;

    @Column(name = "last_message_sender_id")
    private Long lastMessageSenderId;

    @Column(name = "last_message_time")
    private LocalDateTime lastMessageTime;

    @Column(name = "initiator_unread_count")
    @Builder.Default
    private Integer initiatorUnreadCount = 0;

    @Column(name = "receiver_unread_count")
    @Builder.Default
    private Integer receiverUnreadCount = 0;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChatMessage> messages = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Helper: Lấy user còn lại trong conversation
    public User getOtherUser(Long userId) {
        return initiator.getId().equals(userId) ? receiver : initiator;
    }

    // Helper: Check xem user có phải initiator không
    public boolean isInitiator(Long userId) {
        return initiator.getId().equals(userId);
    }

    // Helper: Check xem user có phải receiver không
    public boolean isReceiver(Long userId) {
        return receiver.getId().equals(userId);
    }

    // Helper: Lấy unread count cho user
    public Integer getUnreadCountForUser(Long userId) {
        return isInitiator(userId) ? initiatorUnreadCount : receiverUnreadCount;
    }

    // Helper: Tăng unread count cho user
    public void incrementUnreadForUser(Long userId) {
        if (isInitiator(userId)) {
            initiatorUnreadCount++;
        } else {
            receiverUnreadCount++;
        }
    }

    // Helper: Reset unread count khi user đọc tin nhắn
    public void resetUnreadForUser(Long userId) {
        if (isInitiator(userId)) {
            initiatorUnreadCount = 0;
        } else {
            receiverUnreadCount = 0;
        }
    }

    // Helper: Check user có trong conversation không
    public boolean hasUser(Long userId) {
        return isInitiator(userId) || isReceiver(userId);
    }

    // Helper: Check có thể gửi tin nhắn không
    public boolean canSendMessage(Long senderId) {
        if (status == EConversationStatus.ACCEPTED) {
            return true; // Đã accept, ai cũng gửi được
        }
        if (status == EConversationStatus.PENDING) {
            // Chỉ initiator được gửi tin đầu tiên, và chỉ 1 tin
            return isInitiator(senderId) && (messages == null || messages.isEmpty());
        }
        return false; // REJECTED hoặc BLOCKED
    }
}
