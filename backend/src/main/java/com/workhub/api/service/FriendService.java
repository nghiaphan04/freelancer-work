package com.workhub.api.service;

import com.workhub.api.dto.request.ChatRequestDto;
import com.workhub.api.dto.response.ConversationResponse;
import com.workhub.api.dto.response.UserSearchResponse;
import com.workhub.api.entity.*;
import com.workhub.api.exception.UserNotFoundException;
import com.workhub.api.repository.ChatMessageRepository;
import com.workhub.api.repository.ConversationRepository;
import com.workhub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FriendService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final OnlineStatusService onlineStatusService;

    @Transactional(readOnly = true)
    public List<UserSearchResponse> searchUsersByEmail(Long currentUserId, String email) {
        List<User> users = userRepository.findByEmailContainingIgnoreCase(email);

        return users.stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .filter(u -> !u.isAdmin())
                .map(user -> {
                    User currentUser = userRepository.findById(currentUserId).orElse(null);
                    boolean canSendRequest = true;
                    String relationStatus = "NONE";
                    Long conversationId = null;

                    if (currentUser != null) {
                        Optional<Conversation> existingConv = conversationRepository.findByUsers(currentUser, user);
                        if (existingConv.isPresent()) {
                            Conversation conv = existingConv.get();
                            relationStatus = conv.getStatus().name();
                            conversationId = conv.getId();

                            switch (conv.getStatus()) {
                                case ACCEPTED:
                                case PENDING:
                                case BLOCKED:
                                    canSendRequest = false;
                                    break;
                                case REJECTED:
                                    canSendRequest = true;
                                    break;
                            }
                        }
                    }

                    return UserSearchResponse.fromEntity(user, canSendRequest, relationStatus, conversationId);
                })
                .collect(Collectors.toList());
    }

    /**
     * Gửi chat request (tin nhắn đầu tiên)
     */
    @Transactional
    public ConversationResponse sendChatRequest(Long senderId, ChatRequestDto request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new UserNotFoundException("Sender not found"));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new UserNotFoundException("Receiver not found"));

        if (receiver.isAdmin()) {
            throw new RuntimeException("Không thể kết bạn với tài khoản quản trị viên");
        }

        Optional<Conversation> existingConv = conversationRepository.findByUsers(sender, receiver);
        Conversation conversation;

        EMessageStatus initialStatus = onlineStatusService.isUserOnline(receiver.getId())
                ? EMessageStatus.DELIVERED
                : EMessageStatus.SENT;

        if (existingConv.isPresent()) {
            Conversation existing = existingConv.get();
            if (existing.getStatus() == EConversationStatus.REJECTED) {
                existing.setStatus(EConversationStatus.PENDING);
                existing.setInitiator(sender);
                existing.setReceiver(receiver);
                existing.setFirstMessage(request.getMessage());
                existing.setLastMessage(request.getMessage());
                existing.setLastMessageStatus(initialStatus);
                existing.setLastMessageSenderId(sender.getId());
                existing.setLastMessageTime(LocalDateTime.now());
                existing.setReceiverUnreadCount(1);
                existing.setInitiatorUnreadCount(0);
                conversation = conversationRepository.save(existing);
            } else if (existing.getStatus() == EConversationStatus.ACCEPTED) {
                throw new RuntimeException("Đã là bạn bè với người này");
            } else if (existing.getStatus() == EConversationStatus.BLOCKED) {
                throw new RuntimeException("Bạn đã bị chặn bởi người này");
            } else {
                throw new RuntimeException("Đã gửi yêu cầu kết bạn trước đó");
            }
        } else {
            conversation = Conversation.builder()
                    .initiator(sender)
                    .receiver(receiver)
                    .status(EConversationStatus.PENDING)
                    .firstMessage(request.getMessage())
                    .lastMessage(request.getMessage())
                    .lastMessageStatus(initialStatus)
                    .lastMessageSenderId(sender.getId())
                    .lastMessageTime(LocalDateTime.now())
                    .receiverUnreadCount(1)
                    .build();

            conversation = conversationRepository.save(conversation);
        }

        ChatMessage message = ChatMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.getMessage())
                .messageType(EMessageType.TEXT)
                .status(initialStatus)
                .build();

        chatMessageRepository.save(message);

        log.info("Chat request saved: conversation {} from {} to {}", conversation.getId(), sender.getEmail(), receiver.getEmail());

        try {
            messagingTemplate.convertAndSendToUser(
                    receiver.getEmail(),
                    "/queue/chat-requests",
                    ConversationResponse.fromEntity(conversation, receiver.getId())
            );
        } catch (Exception e) {
            log.warn("Failed to send WebSocket notification for chat request: {}", e.getMessage());
        }

        try {
            notificationService.notifyChatRequestReceived(receiver, sender, conversation.getId());
        } catch (Exception e) {
            log.warn("Failed to send notification for chat request: {}", e.getMessage());
        }

        return ConversationResponse.fromEntity(conversation, senderId);
    }

    @Transactional
    public ConversationResponse acceptChatRequest(Long userId, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.isReceiver(userId)) {
            throw new RuntimeException("Bạn không có quyền accept request này");
        }

        if (conversation.getStatus() != EConversationStatus.PENDING) {
            throw new RuntimeException("Request này không còn ở trạng thái chờ");
        }

        conversation.setStatus(EConversationStatus.ACCEPTED);
        conversation = conversationRepository.save(conversation);

        messagingTemplate.convertAndSendToUser(
                conversation.getInitiator().getEmail(),
                "/queue/request-accepted",
                ConversationResponse.fromEntity(conversation, conversation.getInitiator().getId())
        );

        notificationService.notifyChatRequestAccepted(
                conversation.getInitiator(),
                conversation.getReceiver(),
                conversation.getId()
        );

        log.info("Chat request {} accepted by {}", conversationId, userId);

        return ConversationResponse.fromEntity(conversation, userId);
    }

    @Transactional
    public void rejectChatRequest(Long userId, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.isReceiver(userId)) {
            throw new RuntimeException("Bạn không có quyền reject request này");
        }

        if (conversation.getStatus() != EConversationStatus.PENDING) {
            throw new RuntimeException("Request này không còn ở trạng thái chờ");
        }

        conversation.setStatus(EConversationStatus.REJECTED);
        conversationRepository.save(conversation);

        notificationService.notifyChatRequestRejected(
                conversation.getInitiator(),
                conversation.getReceiver(),
                conversation.getId()
        );

        log.info("Chat request {} rejected by {}", conversationId, userId);
    }

    @Transactional
    public void cancelChatRequest(Long userId, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.isInitiator(userId)) {
            throw new RuntimeException("Bạn không có quyền hủy request này");
        }

        if (conversation.getStatus() != EConversationStatus.PENDING) {
            throw new RuntimeException("Request này không còn ở trạng thái chờ");
        }

        conversationRepository.delete(conversation);

        log.info("Chat request {} cancelled by {}", conversationId, userId);
    }

    @Transactional
    public void blockUser(Long userId, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.hasUser(userId)) {
            throw new RuntimeException("Bạn không thuộc cuộc hội thoại này");
        }

        conversation.setStatus(EConversationStatus.BLOCKED);
        conversation.setBlockedById(userId);
        conversationRepository.save(conversation);

        User blocker = conversation.isInitiator(userId) ? conversation.getInitiator() : conversation.getReceiver();
        User blockedUser = conversation.getOtherUser(userId);

        messagingTemplate.convertAndSendToUser(
                blockedUser.getEmail(),
                "/queue/conversations",
                ConversationResponse.fromEntity(conversation, blockedUser.getId())
        );

        messagingTemplate.convertAndSendToUser(
                blocker.getEmail(),
                "/queue/conversations",
                ConversationResponse.fromEntity(conversation, blocker.getId())
        );

        notificationService.notifyChatBlocked(blockedUser, blocker);

        log.info("User {} blocked conversation {}", userId, conversationId);
    }

    @Transactional
    public ConversationResponse unblockUser(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội thoại"));

        if (!conversation.hasUser(userId)) {
            throw new RuntimeException("Bạn không có quyền thao tác hội thoại này");
        }

        if (conversation.getStatus() != EConversationStatus.BLOCKED) {
            throw new RuntimeException("Hội thoại này không bị chặn");
        }

        if (!userId.equals(conversation.getBlockedById())) {
            throw new RuntimeException("Bạn không có quyền bỏ chặn hội thoại này");
        }

        conversation.setStatus(EConversationStatus.ACCEPTED);
        conversation.setBlockedById(null);
        conversation = conversationRepository.save(conversation);

        User unblocker = conversation.isInitiator(userId) ? conversation.getInitiator() : conversation.getReceiver();
        User otherUser = conversation.getOtherUser(userId);

        messagingTemplate.convertAndSendToUser(
                unblocker.getEmail(),
                "/queue/conversations",
                ConversationResponse.fromEntity(conversation, unblocker.getId())
        );

        messagingTemplate.convertAndSendToUser(
                otherUser.getEmail(),
                "/queue/conversations",
                ConversationResponse.fromEntity(conversation, otherUser.getId())
        );

        log.info("User {} unblocked conversation {}", userId, conversationId);

        return ConversationResponse.fromEntity(conversation, userId);
    }
}
