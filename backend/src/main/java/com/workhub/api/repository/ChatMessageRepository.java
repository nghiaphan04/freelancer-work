package com.workhub.api.repository;

import com.workhub.api.entity.ChatMessage;
import com.workhub.api.entity.Conversation;
import com.workhub.api.entity.EMessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m LEFT JOIN FETCH m.replyTo r LEFT JOIN FETCH r.sender WHERE m.conversation = :conversation ORDER BY m.createdAt DESC")
    Page<ChatMessage> findByConversationWithReplyTo(@Param("conversation") Conversation conversation, Pageable pageable);

    Page<ChatMessage> findByConversationOrderByCreatedAtDesc(Conversation conversation, Pageable pageable);

    List<ChatMessage> findByConversationOrderByCreatedAtAsc(Conversation conversation);

    // Mark messages as READ when user opens conversation
    @Modifying
    @Query("UPDATE ChatMessage m SET m.status = 'READ' WHERE m.conversation.id = :conversationId AND m.sender.id != :userId AND m.status != 'READ'")
    void markMessagesAsRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    // Mark messages as DELIVERED when receiver comes online
    @Modifying
    @Query("UPDATE ChatMessage m SET m.status = 'DELIVERED' WHERE m.conversation.id = :conversationId AND m.sender.id != :userId AND m.status = 'SENT'")
    void markMessagesAsDelivered(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    // Count unread messages (not READ yet)
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversation.id = :conversationId AND m.sender.id != :userId AND m.status != 'READ'")
    Long countUnreadMessages(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    // Find messages by status for a conversation
    @Query("SELECT m FROM ChatMessage m WHERE m.conversation.id = :conversationId AND m.sender.id = :senderId AND m.status = :status")
    List<ChatMessage> findByConversationAndSenderAndStatus(
            @Param("conversationId") Long conversationId,
            @Param("senderId") Long senderId,
            @Param("status") EMessageStatus status);

    // Find all SENT messages for a receiver (to mark as DELIVERED when they come online)
    @Query("SELECT m FROM ChatMessage m WHERE m.conversation IN " +
            "(SELECT c FROM Conversation c WHERE c.initiator.id = :userId OR c.receiver.id = :userId) " +
            "AND m.sender.id != :userId AND m.status = 'SENT'")
    List<ChatMessage> findAllSentMessagesForUser(@Param("userId") Long userId);
}
