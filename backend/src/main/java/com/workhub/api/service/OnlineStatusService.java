package com.workhub.api.service;

import com.workhub.api.entity.*;
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
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnlineStatusService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private final Map<Long, Boolean> onlineUsers = new ConcurrentHashMap<>();
    private final Map<Long, LocalDateTime> lastActiveMap = new ConcurrentHashMap<>();

    public boolean isUserOnline(Long userId) {
        return onlineUsers.getOrDefault(userId, false);
    }

    @Transactional
    public void userConnected(Long userId) {
        onlineUsers.put(userId, true);
        broadcastOnlineStatus(userId, true);
        markPendingMessagesAsDelivered(userId);
    }

    @Transactional
    public void userDisconnected(Long userId) {
        onlineUsers.remove(userId);
        LocalDateTime now = LocalDateTime.now();
        lastActiveMap.put(userId, now);
        
        userRepository.findById(userId).ifPresent(user -> {
            user.updateLastActive();
            userRepository.save(user);
        });
        
        broadcastOnlineStatus(userId, false, now);
    }
    
    public LocalDateTime getLastActiveAt(Long userId) {
        LocalDateTime cached = lastActiveMap.get(userId);
        if (cached != null) {
            return cached;
        }
        return userRepository.findById(userId)
                .map(User::getLastActiveAt)
                .orElse(null);
    }

    private void broadcastOnlineStatus(Long userId, boolean online) {
        broadcastOnlineStatus(userId, online, null);
    }

    private void broadcastOnlineStatus(Long userId, boolean online, LocalDateTime lastActiveAt) {
        List<Conversation> conversations = conversationRepository.findAllByUserId(userId);

        for (Conversation conv : conversations) {
            User otherUser = conv.getOtherUser(userId);
            try {
                Map<String, Object> payload = new java.util.HashMap<>();
                payload.put("userId", userId);
                payload.put("online", online);
                if (lastActiveAt != null) {
                    payload.put("lastActiveAt", lastActiveAt.toString());
                }
                
                messagingTemplate.convertAndSendToUser(
                        otherUser.getIdentifier(),
                        "/queue/online-status",
                        payload
                );
            } catch (Exception e) {
            }
        }
    }

    @Transactional
    public void markPendingMessagesAsDelivered(Long userId) {
        List<ChatMessage> sentMessages = chatMessageRepository.findAllSentMessagesForUser(userId);

        for (ChatMessage message : sentMessages) {
            message.setStatus(EMessageStatus.DELIVERED);
            chatMessageRepository.save(message);

            Conversation conversation = message.getConversation();
            if (conversation.getLastMessageSenderId() != null
                    && conversation.getLastMessageSenderId().equals(message.getSender().getId())
                    && conversation.getLastMessageStatus() == EMessageStatus.SENT) {
                conversation.setLastMessageStatus(EMessageStatus.DELIVERED);
                conversationRepository.save(conversation);
            }

            messagingTemplate.convertAndSendToUser(
                    message.getSender().getIdentifier(),
                    "/queue/message-status",
                    Map.of(
                            "messageId", message.getId(),
                            "conversationId", message.getConversation().getId(),
                            "status", EMessageStatus.DELIVERED.name()
                    )
            );
        }

    }
}
