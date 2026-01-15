package com.workhub.api.controller;

import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.request.ChatRequestDto;
import com.workhub.api.dto.request.SendMessageRequest;
import com.workhub.api.dto.request.UpdateMessageRequest;
import com.workhub.api.dto.response.ChatMessageResponse;
import com.workhub.api.dto.response.ConversationResponse;
import com.workhub.api.dto.response.UserSearchResponse;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/users/search")
    public ResponseEntity<ApiResponse<List<UserSearchResponse>>> searchUsers(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam String email) {
        
        List<UserSearchResponse> users = chatService.searchUsersByEmail(userDetails.getId(), email);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<ConversationResponse>> sendChatRequest(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody ChatRequestDto request) {
        
        ConversationResponse response = chatService.sendChatRequest(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi yêu cầu kết bạn", response));
    }

    @GetMapping("/requests/pending")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getPendingRequests(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        List<ConversationResponse> requests = chatService.getPendingRequests(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @GetMapping("/requests/sent")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getSentRequests(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        List<ConversationResponse> requests = chatService.getSentRequests(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @PostMapping("/requests/{conversationId}/accept")
    public ResponseEntity<ApiResponse<ConversationResponse>> acceptRequest(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long conversationId) {
        
        ConversationResponse response = chatService.acceptChatRequest(userDetails.getId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success("Đã chấp nhận yêu cầu", response));
    }

    @PostMapping("/requests/{conversationId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long conversationId) {

        chatService.rejectChatRequest(userDetails.getId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối yêu cầu", null));
    }

    @PostMapping("/requests/{conversationId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelRequest(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long conversationId) {

        chatService.cancelChatRequest(userDetails.getId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy yêu cầu kết bạn", null));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        List<ConversationResponse> conversations = chatService.getConversations(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> getMessages(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Page<ChatMessageResponse> messages = chatService.getMessages(conversationId, userDetails.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long conversationId) {
        
        chatService.markAsRead(conversationId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu đã đọc", null));
    }

    @MessageMapping("/chat.send")
    public void sendMessageWs(@Payload SendMessageRequest request, SimpMessageHeaderAccessor headerAccessor) {
        Authentication auth = (Authentication) headerAccessor.getUser();
        if (auth != null) {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            try {
                chatService.sendMessage(userDetails.getId(), request);
            } catch (com.workhub.api.exception.MessageRateLimitException ex) {
                messagingTemplate.convertAndSendToUser(
                    userDetails.getUsername(),
                    "/queue/errors",
                    Map.of(
                        "type", "RATE_LIMIT",
                        "message", ex.getMessage()
                    )
                );
                log.warn("Rate limit exceeded for user {} via WebSocket", userDetails.getId());
            }
        }
    }

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody SendMessageRequest request) {
        
        ChatMessageResponse response = chatService.sendMessage(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Gửi tin nhắn thành công", response));
    }

    @GetMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> getMessage(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long messageId) {
        
        ChatMessageResponse response = chatService.getMessage(messageId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> updateMessage(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long messageId,
            @Valid @RequestBody UpdateMessageRequest request) {
        
        ChatMessageResponse response = chatService.updateMessage(messageId, userDetails.getId(), request.getContent());
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật tin nhắn", response));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> deleteMessage(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long messageId) {
        
        ChatMessageResponse response = chatService.deleteMessage(messageId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tin nhắn", response));
    }

    @GetMapping("/counts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getCounts(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        Map<String, Long> counts = chatService.getCounts(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(counts));
    }

    @PostMapping("/conversations/{conversationId}/block")
    public ResponseEntity<ApiResponse<Void>> blockUser(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long conversationId) {
        
        chatService.blockUser(userDetails.getId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success("Đã chặn người dùng", null));
    }

    @PostMapping("/conversations/{conversationId}/unblock")
    public ResponseEntity<ApiResponse<ConversationResponse>> unblockUser(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long conversationId) {
        
        ConversationResponse response = chatService.unblockUser(userDetails.getId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success("Đã bỏ chặn người dùng", response));
    }

}
