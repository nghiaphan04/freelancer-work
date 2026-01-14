# Freelancer - Messenger API Documentation

> Cập nhật 2026-01: Hệ thống nhắn tin realtime với WebSocket.

## 1. KIẾN TRÚC TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MESSENGER SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Client    │───>│ JWT Filter  │───>│ Controller  │───>│  Service    │   │
│  │  (Next.js)  │    │             │    │    Chat     │    │Chat/Message │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘   │
│         │                                                        │          │
│         │ WebSocket (STOMP)                                      │          │
│         ▼                                                        │          │
│  ┌─────────────┐                           ┌─────────────────────┼────┐     │
│  │  WebSocket  │                           │                     │    │     │
│  │   Config    │                           ▼                     ▼    ▼     │
│  └─────────────┘                     ┌──────────┐        ┌──────────────┐   │
│                                      │Conversat.│        │  ChatMessage │   │
│                                      │Repository│        │  Repository  │   │
│                                      └────┬─────┘        └──────────────┘   │
│                                           │                                 │
│                                           ▼                                 │
│                                     ┌────────────┐                          │
│                                     │  Database  │                          │
│                                     │(PostgreSQL)│                          │
│                                     └────────────┘                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DATABASE SCHEMA

```sql
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE DESIGN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────┐         ┌─────────────────────────┐           │
│   │      conversations      │         │      chat_messages      │           │
│   ├─────────────────────────┤         ├─────────────────────────┤           │
│   │ id (PK)                 │◄────────│ conversation_id (FK)    │           │
│   │ initiator_id (FK)       │         │ id (PK)                 │           │
│   │ receiver_id (FK)        │         │ sender_id (FK)          │           │
│   │ status (ENUM)           │         │ content (TEXT)          │           │
│   │ blocked_by_id           │         │ message_type (ENUM)     │           │
│   │ first_message           │         │ status (ENUM)           │           │
│   │ last_message            │         │ reply_to_id (FK)        │           │
│   │ last_message_type       │         │ is_edited               │           │
│   │ last_message_deleted    │         │ is_deleted              │           │
│   │ last_message_status     │         │ created_at              │           │
│   │ last_message_sender_id  │         └─────────────────────────┘           │
│   │ last_message_time       │                                               │
│   │ initiator_unread_count  │         EConversationStatus:                  │
│   │ receiver_unread_count   │         - PENDING                             │
│   │ created_at              │         - ACCEPTED                            │
│   └─────────────────────────┘         - REJECTED                            │
│                                       - BLOCKED                             │
│   EMessageType:                                                             │
│   - TEXT, IMAGE, FILE, SYSTEM, LIKE   EMessageStatus:                       │
│                                       - SENT, DELIVERED, READ               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. API ENDPOINTS

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/chat/users/search` | Tìm kiếm user theo email | ✅ |
| POST | `/api/chat/request` | Gửi yêu cầu kết bạn | ✅ |
| GET | `/api/chat/requests/pending` | Lấy danh sách yêu cầu đang chờ | ✅ |
| GET | `/api/chat/requests/sent` | Lấy danh sách yêu cầu đã gửi | ✅ |
| POST | `/api/chat/requests/{id}/accept` | Chấp nhận yêu cầu | ✅ |
| POST | `/api/chat/requests/{id}/reject` | Từ chối yêu cầu | ✅ |
| POST | `/api/chat/requests/{id}/cancel` | Hủy yêu cầu đã gửi | ✅ |
| GET | `/api/chat/conversations` | Lấy danh sách hội thoại | ✅ |
| GET | `/api/chat/conversations/{id}/messages` | Lấy tin nhắn | ✅ |
| POST | `/api/chat/conversations/{id}/read` | Đánh dấu đã đọc | ✅ |
| POST | `/api/chat/conversations/{id}/block` | Chặn người dùng | ✅ |
| POST | `/api/chat/conversations/{id}/unblock` | Bỏ chặn | ✅ |
| POST | `/api/chat/send` | Gửi tin nhắn (REST) | ✅ |
| GET | `/api/chat/messages/{id}` | Lấy tin nhắn theo ID | ✅ |
| PUT | `/api/chat/messages/{id}` | Sửa tin nhắn | ✅ |
| DELETE | `/api/chat/messages/{id}` | Xóa tin nhắn | ✅ |
| GET | `/api/chat/counts` | Lấy số tin chưa đọc | ✅ |

---

## 4. WEBSOCKET ENDPOINTS

| Destination | Description |
|-------------|-------------|
| `/app/chat.send` | Gửi tin nhắn qua WebSocket |
| `/user/queue/messages` | Nhận tin nhắn mới |
| `/user/queue/conversations` | Cập nhật hội thoại |
| `/user/queue/chat-requests` | Nhận yêu cầu kết bạn |
| `/user/queue/request-accepted` | Yêu cầu được chấp nhận |
| `/user/queue/message-updated` | Tin nhắn được sửa |
| `/user/queue/message-deleted` | Tin nhắn bị xóa |
| `/user/queue/message-status` | Cập nhật trạng thái đọc |
| `/user/queue/online-status` | Trạng thái online |
| `/user/queue/errors` | Lỗi (rate limit, etc.) |

---

## 5. POST /api/chat/request
Gửi yêu cầu kết bạn (tin nhắn đầu tiên)

```
Request:
{
    "receiverId": 2,
    "message": "Xin chào, mình muốn kết bạn!"
}
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/FriendService.java                                     │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ConversationResponse sendChatRequest(Long senderId,           │
│     ChatRequestDto request) {                                        │
│                                                                      │
│     // Validate không cho kết bạn với admin                          │
│     if (receiver.isAdmin()) throw ...                                │
│                                                                      │
│     // Kiểm tra conversation đã tồn tại chưa                         │
│     Optional<Conversation> existingConv = ...                        │
│                                                                      │
│     // Tạo conversation mới với status PENDING                       │
│     conversation = Conversation.builder()                            │
│         .initiator(sender).receiver(receiver)                        │
│         .status(EConversationStatus.PENDING)                         │
│         .firstMessage(request.getMessage())                          │
│         .build();                                                    │
│                                                                      │
│     // Lưu tin nhắn đầu tiên                                         │
│     ChatMessage message = ChatMessage.builder()                      │
│         .conversation(conversation).sender(sender)                   │
│         .content(request.getMessage())                               │
│         .messageType(EMessageType.TEXT).build();                     │
│                                                                      │
│     // Gửi WebSocket notification cho receiver                       │
│     messagingTemplate.convertAndSendToUser(receiver.getEmail(),      │
│         "/queue/chat-requests", response);                           │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Đã gửi yêu cầu kết bạn",
    "data": {
        "id": 1,
        "otherUser": { "id": 2, "fullName": "Nguyễn Văn B", ... },
        "status": "PENDING",
        "firstMessage": "Xin chào, mình muốn kết bạn!",
        "isInitiator": true
    }
}
```

---

## 6. POST /api/chat/send
Gửi tin nhắn (REST fallback)

```
Request:
{
    "receiverId": 2,
    "content": "Hello!",
    "messageType": "TEXT",
    "replyToId": null
}
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/MessageService.java                                    │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ChatMessageResponse sendMessage(Long senderId,                │
│     SendMessageRequest request) {                                    │
│                                                                      │
│     // Rate limit check (15 tin/phút)                                │
│     if (!rateLimitInfo.tryAcquire()) throw ...                       │
│                                                                      │
│     // Validate conversation đã ACCEPTED                             │
│     if (conversation.getStatus() != ACCEPTED) throw ...              │
│                                                                      │
│     // Tạo và lưu tin nhắn                                           │
│     ChatMessage message = ChatMessage.builder()                      │
│         .conversation(conversation).sender(sender)                   │
│         .content(request.getContent())                               │
│         .messageType(request.getMessageType())                       │
│         .status(initialStatus).build();                              │
│                                                                      │
│     // Cập nhật lastMessage trong conversation                       │
│     conversation.setLastMessage(request.getContent());               │
│     conversation.setLastMessageType(request.getMessageType());       │
│                                                                      │
│     // Gửi WebSocket cho receiver                                    │
│     messagingTemplate.convertAndSendToUser(receiver.getEmail(),      │
│         "/queue/messages", response);                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Gửi tin nhắn thành công",
    "data": {
        "id": 100,
        "conversationId": 1,
        "sender": { "id": 1, "fullName": "Nguyễn Văn A" },
        "content": "Hello!",
        "messageType": "TEXT",
        "status": "SENT",
        "isEdited": false,
        "isDeleted": false,
        "createdAt": "2026-01-14T10:30:00"
    }
}
```

---

## 7. WebSocket: /app/chat.send
Gửi tin nhắn qua WebSocket (realtime)

```
STOMP Message:
{
    "receiverId": 2,
    "content": "👍",
    "messageType": "LIKE",
    "replyToId": null
}
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: controller/ChatController.java                                 │
├──────────────────────────────────────────────────────────────────────┤
│ @MessageMapping("/chat.send")                                        │
│ public void sendMessageWs(@Payload SendMessageRequest request,       │
│     SimpMessageHeaderAccessor headerAccessor) {                      │
│                                                                      │
│     Authentication auth = headerAccessor.getUser();                  │
│     UserDetailsImpl userDetails = auth.getPrincipal();               │
│                                                                      │
│     try {                                                            │
│         chatService.sendMessage(userDetails.getId(), request);       │
│     } catch (MessageRateLimitException ex) {                         │
│         messagingTemplate.convertAndSendToUser(                      │
│             userDetails.getUsername(),                               │
│             "/queue/errors",                                         │
│             Map.of("type", "RATE_LIMIT", "message", ex.getMessage()) │
│         );                                                           │
│     }                                                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
WebSocket Response to Receiver: /user/queue/messages
{
    "id": 101,
    "conversationId": 1,
    "sender": { "id": 1, "fullName": "Nguyễn Văn A" },
    "content": "👍",
    "messageType": "LIKE",
    "status": "DELIVERED",
    "createdAt": "2026-01-14T10:31:00"
}
```

---

## 8. POST /api/chat/conversations/{id}/block
Chặn người dùng

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/FriendService.java                                     │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public void blockUser(Long userId, Long conversationId) {            │
│                                                                      │
│     conversation.setStatus(EConversationStatus.BLOCKED);             │
│     conversation.setBlockedById(userId);                             │
│     conversationRepository.save(conversation);                       │
│                                                                      │
│     // Gửi WebSocket cho cả 2 user                                   │
│     messagingTemplate.convertAndSendToUser(blockedUser.getEmail(),   │
│         "/queue/conversations", response);                           │
│     messagingTemplate.convertAndSendToUser(blocker.getEmail(),       │
│         "/queue/conversations", response);                           │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Đã chặn người dùng",
    "data": null
}
```

---

## 9. POST /api/chat/conversations/{id}/unblock
Bỏ chặn người dùng (chỉ người chặn mới được bỏ chặn)

```
Request + Cookie accessToken
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/FriendService.java                                     │
├──────────────────────────────────────────────────────────────────────┤
│ @Transactional                                                       │
│ public ConversationResponse unblockUser(Long conversationId,         │
│     Long userId) {                                                   │
│                                                                      │
│     // Validate chỉ người chặn mới được bỏ chặn                      │
│     if (!userId.equals(conversation.getBlockedById())) throw ...     │
│                                                                      │
│     conversation.setStatus(EConversationStatus.ACCEPTED);            │
│     conversation.setBlockedById(null);                               │
│     conversationRepository.save(conversation);                       │
│                                                                      │
│     // Gửi WebSocket cho cả 2 user                                   │
│     messagingTemplate.convertAndSendToUser(...);                     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Response: 200 OK
{
    "status": "SUCCESS",
    "message": "Đã bỏ chặn người dùng",
    "data": {
        "id": 1,
        "otherUser": { ... },
        "status": "ACCEPTED",
        "blockedById": null
    }
}
```

---

## 10. DTO RESPONSES

```
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/response/ConversationResponse.java                         │
├──────────────────────────────────────────────────────────────────────┤
│ @Data @Builder                                                       │
│ public class ConversationResponse {                                  │
│     private Long id;                                                 │
│     private UserInfo otherUser;                                      │
│     private EConversationStatus status;                              │
│     private Long blockedById;                                        │
│     private Boolean isInitiator;                                     │
│     private String firstMessage;                                     │
│     private String lastMessage;                                      │
│     private EMessageType lastMessageType;                            │
│     private Boolean lastMessageDeleted;                              │
│     private EMessageStatus lastMessageStatus;                        │
│     private Long lastMessageSenderId;                                │
│     private LocalDateTime lastMessageTime;                           │
│     private Integer unreadCount;                                     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ FILE: dto/response/ChatMessageResponse.java                          │
├──────────────────────────────────────────────────────────────────────┤
│ @Data @Builder                                                       │
│ public class ChatMessageResponse {                                   │
│     private Long id;                                                 │
│     private Long conversationId;                                     │
│     private SenderInfo sender;                                       │
│     private String content;                                          │
│     private EMessageType messageType;                                │
│     private EMessageStatus status;                                   │
│     private Boolean isEdited;                                        │
│     private Boolean isDeleted;                                       │
│     private LocalDateTime createdAt;                                 │
│     private ReplyInfo replyTo;                                       │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 11. RATE LIMITING

```
┌──────────────────────────────────────────────────────────────────────┐
│ FILE: service/MessageService.java                                    │
├──────────────────────────────────────────────────────────────────────┤
│ private static final int MAX_MESSAGES_PER_MINUTE = 15;               │
│ private static final long RATE_LIMIT_WINDOW_MS = 60_000;             │
│                                                                      │
│ private static class RateLimitInfo {                                 │
│     AtomicInteger count = new AtomicInteger(0);                      │
│     volatile long windowStart = System.currentTimeMillis();          │
│                                                                      │
│     synchronized boolean tryAcquire() {                              │
│         if (now - windowStart > RATE_LIMIT_WINDOW_MS) {              │
│             windowStart = now;                                       │
│             count.set(1);                                            │
│             return true;                                             │
│         }                                                            │
│         return count.incrementAndGet() <= MAX_MESSAGES_PER_MINUTE;   │
│     }                                                                │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘

Khi bị rate limit:
- REST: Throw MessageRateLimitException → 429 Too Many Requests
- WebSocket: Gửi error qua /user/queue/errors
```

---

## 12. CLIENT WEBSOCKET USAGE

```typescript
// hooks/useChatSocket.ts
const sendMessage = useCallback((
  receiverId: number, 
  content: string, 
  replyToId?: number, 
  messageType: string = "TEXT"
) => {
  if (clientRef.current?.connected) {
    clientRef.current.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({ receiverId, content, messageType, replyToId }),
    });
  }
}, []);

// Subscribe to channels
client.subscribe("/user/queue/messages", (message) => {
  const data = JSON.parse(message.body);
  onNewMessage?.(data);
});

client.subscribe("/user/queue/conversations", (message) => {
  const data = JSON.parse(message.body);
  onConversationUpdated?.(data);
});

client.subscribe("/user/queue/errors", (message) => {
  const data = JSON.parse(message.body);
  if (data.type === "RATE_LIMIT") {
    onRateLimitError?.(data);
  }
});
```
