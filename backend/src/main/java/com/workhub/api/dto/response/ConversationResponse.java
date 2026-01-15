package com.workhub.api.dto.response;

import com.workhub.api.entity.Conversation;
import com.workhub.api.entity.EConversationStatus;
import com.workhub.api.entity.EMessageStatus;
import com.workhub.api.entity.EMessageType;
import com.workhub.api.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {

    private Long id;
    private UserInfo otherUser;
    private EConversationStatus status;
    private Long blockedById;
    private Boolean isInitiator;
    private String firstMessage;
    private String lastMessage;
    private EMessageType lastMessageType;
    private Boolean lastMessageDeleted;
    private EMessageStatus lastMessageStatus;
    private Long lastMessageSenderId;
    private LocalDateTime lastMessageTime;
    private Integer unreadCount;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String fullName;
        private String email;
        private String avatarUrl;
        private Boolean online;
        private LocalDateTime lastActiveAt;
    }

    public static ConversationResponse fromEntity(Conversation conversation, Long currentUserId) {
        User otherUser = conversation.getOtherUser(currentUserId);
        
        return ConversationResponse.builder()
                .id(conversation.getId())
                .otherUser(UserInfo.builder()
                        .id(otherUser.getId())
                        .fullName(otherUser.getFullName())
                        .email(otherUser.getEmail())
                        .avatarUrl(otherUser.getAvatarUrl())
                        .online(false) // Will be updated by online status service
                        .lastActiveAt(otherUser.getLastActiveAt())
                        .build())
                .status(conversation.getStatus())
                .blockedById(conversation.getBlockedById())
                .isInitiator(conversation.isInitiator(currentUserId))
                .firstMessage(conversation.getFirstMessage())
                .lastMessage(conversation.getLastMessage())
                .lastMessageType(conversation.getLastMessageType())
                .lastMessageDeleted(conversation.getLastMessageDeleted())
                .lastMessageStatus(conversation.getLastMessageStatus())
                .lastMessageSenderId(conversation.getLastMessageSenderId())
                .lastMessageTime(conversation.getLastMessageTime())
                .unreadCount(conversation.getUnreadCountForUser(currentUserId))
                .createdAt(conversation.getCreatedAt())
                .build();
    }
}
