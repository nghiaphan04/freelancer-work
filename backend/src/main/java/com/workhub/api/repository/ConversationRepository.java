package com.workhub.api.repository;

import com.workhub.api.entity.Conversation;
import com.workhub.api.entity.EConversationStatus;
import com.workhub.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    // Tìm conversation giữa 2 users (bất kể ai là initiator)
    @Query("SELECT c FROM Conversation c WHERE (c.initiator = :user1 AND c.receiver = :user2) OR (c.initiator = :user2 AND c.receiver = :user1)")
    Optional<Conversation> findByUsers(@Param("user1") User user1, @Param("user2") User user2);

    @Query("SELECT c FROM Conversation c WHERE (c.initiator.id = :userId OR c.receiver.id = :userId) AND c.status IN ('ACCEPTED', 'BLOCKED') ORDER BY c.lastMessageTime DESC NULLS LAST")
    List<Conversation> findAcceptedByUserId(@Param("userId") Long userId);

    // Lấy tất cả conversations của user (bao gồm cả pending)
    @Query("SELECT c FROM Conversation c WHERE c.initiator.id = :userId OR c.receiver.id = :userId ORDER BY c.lastMessageTime DESC NULLS LAST")
    List<Conversation> findAllByUserId(@Param("userId") Long userId);

    // Lấy các request đang chờ (user là receiver)
    @Query("SELECT c FROM Conversation c WHERE c.receiver.id = :userId AND c.status = 'PENDING' ORDER BY c.createdAt DESC")
    List<Conversation> findPendingRequestsForUser(@Param("userId") Long userId);

    // Lấy các request đã gửi (user là initiator)
    @Query("SELECT c FROM Conversation c WHERE c.initiator.id = :userId AND c.status = 'PENDING' ORDER BY c.createdAt DESC")
    List<Conversation> findSentRequestsByUser(@Param("userId") Long userId);

    // Đếm số request chưa đọc
    @Query("SELECT COUNT(c) FROM Conversation c WHERE c.receiver.id = :userId AND c.status = 'PENDING'")
    Long countPendingRequests(@Param("userId") Long userId);

    // Đếm số tin nhắn chưa đọc
    @Query("SELECT COUNT(c) FROM Conversation c WHERE ((c.initiator.id = :userId AND c.initiatorUnreadCount > 0) OR (c.receiver.id = :userId AND c.receiverUnreadCount > 0)) AND c.status = 'ACCEPTED'")
    Long countUnreadConversations(@Param("userId") Long userId);
}
