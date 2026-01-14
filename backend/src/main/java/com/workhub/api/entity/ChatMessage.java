package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_chat_message_conversation", columnList = "conversation_id"),
    @Index(name = "idx_chat_message_sender", columnList = "sender_id"),
    @Index(name = "idx_chat_message_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type")
    @Builder.Default
    private EMessageType messageType = EMessageType.TEXT;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private EMessageStatus status = EMessageStatus.SENT;

    @Column(name = "is_edited")
    @Builder.Default
    private Boolean isEdited = false;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // Reply to another message
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private ChatMessage replyTo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
