package com.workhub.api.service;

import com.workhub.api.dto.request.ChatRequestDto;
import com.workhub.api.dto.request.SendMessageRequest;
import com.workhub.api.dto.response.ChatMessageResponse;
import com.workhub.api.dto.response.ConversationResponse;
import com.workhub.api.dto.response.UserSearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final FriendService friendService;
    private final MessageService messageService;
    private final ConversationService conversationService;
    private final OnlineStatusService onlineStatusService;

    public List<UserSearchResponse> searchUsersByName(Long currentUserId, String name) {
        return friendService.searchUsersByName(currentUserId, name);
    }

    public ConversationResponse sendChatRequest(Long senderId, ChatRequestDto request) {
        return friendService.sendChatRequest(senderId, request);
    }

    public ConversationResponse acceptChatRequest(Long userId, Long conversationId) {
        return friendService.acceptChatRequest(userId, conversationId);
    }

    public void rejectChatRequest(Long userId, Long conversationId) {
        friendService.rejectChatRequest(userId, conversationId);
    }

    public void cancelChatRequest(Long userId, Long conversationId) {
        friendService.cancelChatRequest(userId, conversationId);
    }

    public void blockUser(Long userId, Long conversationId) {
        friendService.blockUser(userId, conversationId);
    }

    public ConversationResponse unblockUser(Long userId, Long conversationId) {
        return friendService.unblockUser(conversationId, userId);
    }

    public ChatMessageResponse sendMessage(Long senderId, SendMessageRequest request) {
        return messageService.sendMessage(senderId, request);
    }

    public Page<ChatMessageResponse> getMessages(Long conversationId, Long userId, int page, int size) {
        return messageService.getMessages(conversationId, userId, page, size);
    }

    public ChatMessageResponse getMessage(Long messageId, Long userId) {
        return messageService.getMessage(messageId, userId);
    }

    public ChatMessageResponse updateMessage(Long messageId, Long userId, String newContent) {
        return messageService.updateMessage(messageId, userId, newContent);
    }

    public ChatMessageResponse deleteMessage(Long messageId, Long userId) {
        return messageService.deleteMessage(messageId, userId);
    }

    public void markAsRead(Long conversationId, Long userId) {
        messageService.markAsRead(conversationId, userId);
    }

    public List<ConversationResponse> getConversations(Long userId) {
        return conversationService.getConversations(userId);
    }

    public List<ConversationResponse> getPendingRequests(Long userId) {
        return conversationService.getPendingRequests(userId);
    }

    public List<ConversationResponse> getSentRequests(Long userId) {
        return conversationService.getSentRequests(userId);
    }

    public Map<String, Long> getCounts(Long userId) {
        return conversationService.getCounts(userId);
    }

    public void userConnected(Long userId) {
        onlineStatusService.userConnected(userId);
    }

    public void userDisconnected(Long userId) {
        onlineStatusService.userDisconnected(userId);
    }

    public boolean isUserOnline(Long userId) {
        return onlineStatusService.isUserOnline(userId);
    }
}
