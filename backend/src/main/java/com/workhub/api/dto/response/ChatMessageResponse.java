package com.workhub.api.dto.response;

import com.workhub.api.entity.ChatMessage;
import com.workhub.api.entity.EMessageStatus;
import com.workhub.api.entity.EMessageType;
import com.workhub.api.entity.FileUpload;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {

    private Long id;
    private Long conversationId;
    private SenderInfo sender;
    private String content;
    private EMessageType messageType;
    private EMessageStatus status; // SENT, DELIVERED, READ
    private Boolean isEdited;
    private Boolean isDeleted;
    private LocalDateTime editedAt;
    private LocalDateTime deletedAt;
    private LocalDateTime createdAt;
    private ReplyInfo replyTo;
    private FileInfo file;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SenderInfo {
        private Long id;
        private String fullName;
        private String avatarUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReplyInfo {
        private Long id;
        private SenderInfo sender;
        private String content;
        private String messageType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FileInfo {
        private Long id;
        private String url;
        private String secureUrl;
        private String originalFilename;
        private String fileType;
        private String mimeType;
        private String format;
        private Long sizeBytes;
        private String readableSize;
        private Integer width;
        private Integer height;
    }

    public static ChatMessageResponse fromEntity(ChatMessage message) {
        ChatMessageResponseBuilder builder = ChatMessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .sender(SenderInfo.builder()
                        .id(message.getSender().getId())
                        .fullName(message.getSender().getFullName())
                        .avatarUrl(message.getSender().getAvatarUrl())
                        .build())
                .content(message.getIsDeleted() ? "Tin nhắn đã bị xóa" : message.getContent())
                .messageType(message.getMessageType())
                .status(message.getStatus())
                .isEdited(message.getIsEdited())
                .isDeleted(message.getIsDeleted())
                .editedAt(message.getEditedAt())
                .deletedAt(message.getDeletedAt())
                .createdAt(message.getCreatedAt());

        // Add reply info if exists
        if (message.getReplyTo() != null) {
            ChatMessage replyMsg = message.getReplyTo();
            builder.replyTo(ReplyInfo.builder()
                    .id(replyMsg.getId())
                    .sender(SenderInfo.builder()
                            .id(replyMsg.getSender().getId())
                            .fullName(replyMsg.getSender().getFullName())
                            .avatarUrl(replyMsg.getSender().getAvatarUrl())
                            .build())
                    .content(replyMsg.getIsDeleted() ? "Tin nhắn đã bị xóa" : replyMsg.getContent())
                    .messageType(replyMsg.getMessageType().name())
                    .build());
        }

        // Add file info if exists
        if (message.hasFile() && !message.getIsDeleted()) {
            FileUpload file = message.getFile();
            builder.file(FileInfo.builder()
                    .id(file.getId())
                    .url(file.getUrl())
                    .secureUrl(file.getSecureUrl())
                    .originalFilename(file.getOriginalFilename())
                    .fileType(file.getFileType().name())
                    .mimeType(file.getMimeType())
                    .format(file.getFormat())
                    .sizeBytes(file.getSizeBytes())
                    .readableSize(file.getReadableSize())
                    .width(file.getWidth())
                    .height(file.getHeight())
                    .build());
        }

        return builder.build();
    }
}
