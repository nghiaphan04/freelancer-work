package com.workhub.api.service;

import com.workhub.api.dto.request.SendMessageRequest;
import com.workhub.api.dto.response.ChatMessageResponse;
import com.workhub.api.dto.response.ConversationResponse;
import com.workhub.api.entity.*;
import com.workhub.api.exception.MessageRateLimitException;
import com.workhub.api.exception.UserNotFoundException;
import com.workhub.api.repository.ChatMessageRepository;
import com.workhub.api.repository.ConversationRepository;
import com.workhub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final OnlineStatusService onlineStatusService;

    private static final int MAX_MESSAGES_PER_MINUTE = 15;
    private static final long RATE_LIMIT_WINDOW_MS = 60_000;
    
    private final ConcurrentHashMap<Long, RateLimitInfo> rateLimitMap = new ConcurrentHashMap<>();

    private static class RateLimitInfo {
        AtomicInteger count = new AtomicInteger(0);
        volatile long windowStart = System.currentTimeMillis();
        
        synchronized boolean tryAcquire() {
            long now = System.currentTimeMillis();
            if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
                windowStart = now;
                count.set(1);
                return true;
            }
            return count.incrementAndGet() <= MAX_MESSAGES_PER_MINUTE;
        }
        
        int getRemainingSeconds() {
            long elapsed = System.currentTimeMillis() - windowStart;
            return (int) Math.ceil((RATE_LIMIT_WINDOW_MS - elapsed) / 1000.0);
        }
    }

    @Transactional
    public ChatMessageResponse sendMessage(Long senderId, SendMessageRequest request) {
        RateLimitInfo rateLimitInfo = rateLimitMap.computeIfAbsent(senderId, k -> new RateLimitInfo());
        if (!rateLimitInfo.tryAcquire()) {
            int remainingSeconds = rateLimitInfo.getRemainingSeconds();
            log.warn("User {} is rate limited. Remaining wait: {} seconds", senderId, remainingSeconds);
            throw new MessageRateLimitException("Bạn đang gửi tin nhắn quá nhanh. Vui lòng thử lại sau " + remainingSeconds + " giây.");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new UserNotFoundException("Sender not found"));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new UserNotFoundException("Receiver not found"));

        // Không cho phép nhắn tin với tài khoản admin
        if (receiver.isAdmin()) {
            throw new RuntimeException("Không thể gửi tin nhắn cho tài khoản quản trị viên");
        }

        Conversation conversation = conversationRepository.findByUsers(sender, receiver)
                .orElseThrow(() -> new RuntimeException("Chưa có cuộc hội thoại với người này. Hãy gửi chat request trước."));

        if (conversation.getStatus() != EConversationStatus.ACCEPTED) {
            throw new RuntimeException("Cuộc hội thoại chưa được chấp nhận. Vui lòng đợi đối phương accept.");
        }

        EMessageStatus initialStatus = onlineStatusService.isUserOnline(receiver.getId())
                ? EMessageStatus.DELIVERED
                : EMessageStatus.SENT;

        ChatMessage.ChatMessageBuilder messageBuilder = ChatMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.getContent())
                .messageType(request.getMessageType())
                .status(initialStatus);

        if (request.getReplyToId() != null) {
            ChatMessage replyToMessage = chatMessageRepository.findById(request.getReplyToId()).orElse(null);
            if (replyToMessage != null) {
                messageBuilder.replyTo(replyToMessage);
            }
        }

        ChatMessage message = messageBuilder.build();
        message = chatMessageRepository.save(message);

        conversation.setLastMessageId(message.getId());
        conversation.setLastMessage(request.getContent());
        conversation.setLastMessageType(request.getMessageType());
        conversation.setLastMessageDeleted(false);
        conversation.setLastMessageStatus(initialStatus);
        conversation.setLastMessageSenderId(sender.getId());
        conversation.setLastMessageTime(LocalDateTime.now());
        conversation.incrementUnreadForUser(receiver.getId());
        conversationRepository.save(conversation);

        ChatMessageResponse response = ChatMessageResponse.fromEntity(message);

        messagingTemplate.convertAndSendToUser(
                receiver.getEmail(),
                "/queue/messages",
                response
        );

        messagingTemplate.convertAndSendToUser(
                receiver.getEmail(),
                "/queue/conversations",
                ConversationResponse.fromEntity(conversation, receiver.getId())
        );

        log.info("Message sent from {} to {} with status {}", sender.getEmail(), receiver.getEmail(), initialStatus);

        return response;
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getMessages(Long conversationId, Long userId, int page, int size) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.hasUser(userId)) {
            throw new RuntimeException("Access denied to this conversation");
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<ChatMessage> messages = chatMessageRepository.findByConversationWithReplyTo(conversation, pageable);

        return messages.map(ChatMessageResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ChatMessageResponse getMessage(Long messageId, Long userId) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Tin nhắn không tồn tại"));

        if (!message.getConversation().hasUser(userId)) {
            throw new RuntimeException("Bạn không có quyền xem tin nhắn này");
        }

        return ChatMessageResponse.fromEntity(message);
    }

    @Transactional
    public ChatMessageResponse updateMessage(Long messageId, Long userId, String newContent) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Tin nhắn không tồn tại"));

        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("Bạn chỉ có thể sửa tin nhắn của chính mình");
        }

        if (message.getIsDeleted()) {
            throw new RuntimeException("Không thể sửa tin nhắn đã bị xóa");
        }

        message.setContent(newContent);
        message.setIsEdited(true);
        message.setEditedAt(LocalDateTime.now());
        message = chatMessageRepository.save(message);

        ChatMessageResponse response = ChatMessageResponse.fromEntity(message);

        User otherUser = message.getConversation().getOtherUser(userId);
        messagingTemplate.convertAndSendToUser(
                otherUser.getEmail(),
                "/queue/message-updated",
                response
        );

        log.info("Message {} updated by user {}", messageId, userId);

        return response;
    }

    @Transactional
    public ChatMessageResponse deleteMessage(Long messageId, Long userId) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Tin nhắn không tồn tại"));

        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("Bạn chỉ có thể xóa tin nhắn của chính mình");
        }

        if (message.getIsDeleted()) {
            throw new RuntimeException("Tin nhắn đã bị xóa trước đó");
        }

        message.setIsDeleted(true);
        message.setDeletedAt(LocalDateTime.now());
        message = chatMessageRepository.save(message);

        Conversation conversation = message.getConversation();
        if (conversation.getLastMessageId() != null && 
            conversation.getLastMessageId().equals(message.getId())) {
            conversation.setLastMessageDeleted(true);
            conversationRepository.save(conversation);
        }

        ChatMessageResponse response = ChatMessageResponse.fromEntity(message);

        User sender = message.getSender();
        User otherUser = conversation.getOtherUser(userId);
        
        messagingTemplate.convertAndSendToUser(
                otherUser.getEmail(),
                "/queue/message-deleted",
                response
        );

        messagingTemplate.convertAndSendToUser(
                otherUser.getEmail(),
                "/queue/conversations",
                ConversationResponse.fromEntity(conversation, otherUser.getId())
        );

        messagingTemplate.convertAndSendToUser(
                sender.getEmail(),
                "/queue/conversations",
                ConversationResponse.fromEntity(conversation, sender.getId())
        );

        log.info("Message {} deleted by user {}", messageId, userId);

        return response;
    }

    @Transactional
    public void markAsRead(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.hasUser(userId)) {
            throw new RuntimeException("Access denied to this conversation");
        }

        chatMessageRepository.markMessagesAsRead(conversationId, userId);
        conversation.resetUnreadForUser(userId);

        User otherUser = conversation.getOtherUser(userId);
        if (conversation.getLastMessageSenderId() != null
                && conversation.getLastMessageSenderId().equals(otherUser.getId())) {
            conversation.setLastMessageStatus(EMessageStatus.READ);
        }

        conversationRepository.save(conversation);

        messagingTemplate.convertAndSendToUser(
                otherUser.getEmail(),
                "/queue/message-status",
                Map.of(
                        "conversationId", conversationId,
                        "status", EMessageStatus.READ.name(),
                        "readBy", userId
                )
        );
    }
}
