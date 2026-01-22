package com.workhub.api.repository;

import com.workhub.api.entity.DisputeRound;
import com.workhub.api.entity.EDisputeRoundStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRoundRepository extends JpaRepository<DisputeRound, Long> {
    
    List<DisputeRound> findByDisputeIdOrderByRoundNumber(Long disputeId);
    
    Optional<DisputeRound> findByDisputeIdAndRoundNumber(Long disputeId, Integer roundNumber);
    
    @Query("SELECT r FROM DisputeRound r " +
           "JOIN FETCH r.dispute d " +
           "JOIN FETCH d.employer " +
           "JOIN FETCH d.freelancer " +
           "JOIN FETCH d.job " +
           "LEFT JOIN FETCH r.admin " +
           "WHERE r.status = :status AND r.voteDeadline < :deadline")
    List<DisputeRound> findByStatusAndVoteDeadlineBefore(@Param("status") EDisputeRoundStatus status, @Param("deadline") LocalDateTime deadline);
    
    @Query("SELECT r.admin.id FROM DisputeRound r WHERE r.dispute.id = :disputeId")
    List<Long> findAdminIdsByDisputeId(@Param("disputeId") Long disputeId);
    
    @Query("SELECT r FROM DisputeRound r WHERE r.admin.id = :adminId AND r.status = :status")
    List<DisputeRound> findByAdminIdAndStatus(@Param("adminId") Long adminId, @Param("status") EDisputeRoundStatus status);
    
    @Query("SELECT COUNT(r) FROM DisputeRound r WHERE r.dispute.id = :disputeId AND r.status = 'VOTED'")
    int countVotedRoundsByDisputeId(@Param("disputeId") Long disputeId);
}
