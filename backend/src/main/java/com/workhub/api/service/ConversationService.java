package com.workhub.api.service;

import com.workhub.api.dto.response.ConversationResponse;
import com.workhub.api.entity.Conversation;
import com.workhub.api.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final OnlineStatusService onlineStatusService;

    /**
     * Get all ACCEPTED conversations for user
     */
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(Long userId) {
        List<Conversation> conversations = conversationRepository.findAcceptedByUserId(userId);

        return conversations.stream()
                .map(conv -> {
                    ConversationResponse response = ConversationResponse.fromEntity(conv, userId);
                    response.getOtherUser().setOnline(onlineStatusService.isUserOnline(response.getOtherUser().getId()));
                    return response;
                })
                .collect(Collectors.toList());
    }

    /**
     * Get pending chat requests (user là receiver)
     */
    @Transactional(readOnly = true)
    public List<ConversationResponse> getPendingRequests(Long userId) {
        List<Conversation> requests = conversationRepository.findPendingRequestsForUser(userId);

        return requests.stream()
                .map(conv -> {
                    ConversationResponse response = ConversationResponse.fromEntity(conv, userId);
                    response.getOtherUser().setOnline(onlineStatusService.isUserOnline(response.getOtherUser().getId()));
                    return response;
                })
                .collect(Collectors.toList());
    }

    /**
     * Get sent requests (user là initiator)
     */
    @Transactional(readOnly = true)
    public List<ConversationResponse> getSentRequests(Long userId) {
        List<Conversation> requests = conversationRepository.findSentRequestsByUser(userId);

        return requests.stream()
                .map(conv -> {
                    ConversationResponse response = ConversationResponse.fromEntity(conv, userId);
                    response.getOtherUser().setOnline(onlineStatusService.isUserOnline(response.getOtherUser().getId()));
                    return response;
                })
                .collect(Collectors.toList());
    }

    /**
     * Get counts
     */
    public Map<String, Long> getCounts(Long userId) {
        return Map.of(
                "unreadMessages", conversationRepository.countUnreadConversations(userId),
                "pendingRequests", conversationRepository.countPendingRequests(userId)
        );
    }
}
